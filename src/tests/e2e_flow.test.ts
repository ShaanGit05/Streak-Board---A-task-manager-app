import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../lib/api';
import { calculateStreakStats } from '../lib/streaks';
import { calculateLevel } from '../lib/xp';
import { calculateDailyScore } from '../lib/scoring';
import { generateTasksForDate } from '../lib/recurrence';
import type { Task, TaskCategory, TaskPriority } from '../lib/types';

// Provide localStorage mock in Node/Vitest environment
if (typeof localStorage === 'undefined' || !localStorage.getItem) {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) || null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] || null,
    length: 0,
  } as Storage;
}

describe('StreakBoard Full User Flow & Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('verifies the full end-to-end journey from signup to rest days and heatmap', async () => {
    // 1. Sign up
    const session = await api.signUp('streakmaster@example.com', 'mypassword123', 'Streak Master');
    expect(session.user).toBeDefined();
    expect(session.user.email).toBe('streakmaster@example.com');
    expect(session.user.display_name).toBe('Streak Master');

    const userId = session.user.id;

    // Verify profile & default settings
    const profile = await api.getProfile(userId);
    expect(profile.display_name).toBe('Streak Master');

    const settings = await api.getSettings(userId);
    expect(settings.target_completion_pct).toBe(70);
    expect(settings.max_rest_days_per_week).toBe(2);

    // 2. Create Recurring Rule (e.g. Daily Workout)
    const rule = await api.createRecurringRule({
      user_id: userId,
      title: 'Morning Yoga & Stretch',
      category: 'Health',
      priority: 'Med',
      difficulty: 3, // 3 * 1.5 = 4.5 pts
      repeat_type: 'daily',
      is_active: true,
    });
    expect(rule.id).toBeDefined();

    const rules = await api.getRecurringRules(userId);
    expect(rules.length).toBe(1);

    // 3. Open today's date and generate recurring instance
    const today = '2026-11-02';
    const existingToday = await api.getTasks(userId, today);
    const toGenerate = generateTasksForDate(rules, today, existingToday, userId);
    expect(toGenerate.length).toBe(1);
    expect(toGenerate[0].title).toBe('Morning Yoga & Stretch');

    const createdTasks = await api.createMultipleTasks(toGenerate);
    expect(createdTasks.length).toBe(1);

    // Verify idempotence: opening again should not generate duplicates
    const toGenerateAgain = generateTasksForDate(rules, today, createdTasks, userId);
    expect(toGenerateAgain.length).toBe(0);

    // 4. Add custom tasks
    // Task 2: Work task (difficulty 4, High = 8 pts)
    const task2 = await api.createTask({
      user_id: userId,
      task_date: today,
      title: 'Build Core Payment Service',
      category: 'Work',
      priority: 'High',
      difficulty: 4,
      is_completed: false,
    });

    // Task 3: Study task (difficulty 2, Low = 2 pts)
    const task3 = await api.createTask({
      user_id: userId,
      task_date: today,
      title: 'Read Microservices Chapter',
      category: 'Study',
      priority: 'Low',
      difficulty: 2,
      is_completed: false,
    });

    const dayTasks = await api.getTasks(userId, today);
    expect(dayTasks.length).toBe(3);

    // Planned points = 4.5 (Yoga) + 8 (Payment) + 2 (Reading) = 14.5 pts
    let score = await api.syncDailyScore(userId, today);
    expect(score.points_total).toBe(14.5);
    expect(score.points_earned).toBe(0);
    expect(score.completion_pct).toBe(0);

    // 5. Save current day as a named template
    const template = await api.createTemplate(
      userId,
      'High Focus Monday',
      'Workout, Payment Core, and Reading',
      dayTasks.map((t) => ({
        title: t.title,
        description: t.description,
        category: t.category,
        priority: t.priority,
        difficulty: t.difficulty,
      }))
    );
    expect(template.name).toBe('High Focus Monday');
    expect(template.items?.length).toBe(3);

    // 6. Apply template to another date ('2026-11-05')
    const appliedTasks = await api.applyTemplateToDate(userId, template.id, '2026-11-05');
    expect(appliedTasks.length).toBe(3);

    // 7. Complete tasks on today to meet the daily goal
    // Complete Yoga (4.5 pts) and Payment Service (8 pts) = 12.5 earned / 14.5 total = 86%
    await api.updateTask(createdTasks[0].id, { is_completed: true });
    await api.updateTask(task2.id, { is_completed: true });

    score = await api.syncDailyScore(userId, today);
    expect(score.points_earned).toBe(12.5);
    expect(score.completion_pct).toBe(86);
    expect(score.tasks_completed).toBe(2);

    const summary = calculateDailyScore(
      await api.getTasks(userId, today),
      false,
      settings.target_completion_pct
    );
    expect(summary.goal_met).toBe(true); // 86% >= 70%

    // 8. Streak calculation with Rest Days
    // Yesterday was also successful
    const yesterday = '2026-11-01';
    await api.createTask({
      user_id: userId,
      task_date: yesterday,
      title: 'Sunday Clean and Code',
      category: 'Work',
      priority: 'High',
      difficulty: 5, // 10 pts
      is_completed: true,
    });
    await api.syncDailyScore(userId, yesterday);

    // Tomorrow is marked as a Rest Day
    const tomorrow = '2026-11-03';
    await api.toggleRestDay(userId, tomorrow, true);

    const scoresList = await api.getDailyScores(userId);
    expect(scoresList.length).toBe(4); // yesterday, today, tomorrow (rest), and applied template day

    const stats = calculateStreakStats(scoresList, 70, today);
    // Streak: yesterday (100%) + today (86%) = 2 days
    expect(stats.currentStreak).toBe(2);

    // If we advance reference date to tomorrow (Rest Day):
    const statsTomorrow = calculateStreakStats(scoresList, 70, tomorrow);
    // Streak should hold at 2 days! Rest day does not break streak!
    expect(statsTomorrow.currentStreak).toBe(2);

    // 9. XP and Level update
    const totalXP = scoresList.reduce((sum, s) => sum + s.points_earned, 0);
    // Yesterday 10 pts + today 12.5 pts = 22.5 pts
    expect(totalXP).toBe(22.5);
    const lvl = calculateLevel(totalXP);
    expect(lvl.level).toBe(1);
    expect(lvl.title).toBe('Novice Planner');

    // 10. Seed 6 Months Demo Data
    const seedResult = await api.seedDemoData(userId);
    expect(seedResult.scoresCount).toBeGreaterThanOrEqual(180);

    const allHistoricalScores = await api.getDailyScores(userId);
    const historicalStats = calculateStreakStats(allHistoricalScores, 70, today);
    expect(historicalStats.activeDaysCount).toBeGreaterThan(50);
    expect(historicalStats.longestStreak).toBeGreaterThan(0);

    const advancedXP = allHistoricalScores.reduce((sum, s) => sum + s.points_earned, 0);
    const advancedLvl = calculateLevel(advancedXP);
    expect(advancedLvl.level).toBeGreaterThanOrEqual(3);

    // 11. Sign out
    await api.signOut();
    const sessionAfter = await api.getSession();
    expect(sessionAfter).toBeNull();
  });
});
