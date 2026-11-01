import type { Task, DailyScore, TaskCategory, TaskPriority } from './types';
import { addDaysToDateStr, getTodayDateStr } from './dates';
import { calculateDailyScore } from './scoring';

interface SeedTaskTemplate {
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  difficulty: number;
}

const SAMPLE_TASKS_POOL: SeedTaskTemplate[] = [
  { title: 'LeetCode / Algorithm problem', category: 'Study', priority: 'High', difficulty: 4 },
  { title: 'Code review & merge PRs', category: 'Work', priority: 'Med', difficulty: 3 },
  { title: 'Morning 5km run & stretching', category: 'Health', priority: 'High', difficulty: 4 },
  { title: 'Read 2 chapters of System Design', category: 'Study', priority: 'Med', difficulty: 2 },
  { title: 'Team sprint backlog refinement', category: 'Work', priority: 'Low', difficulty: 2 },
  { title: 'Gym strength training', category: 'Health', priority: 'High', difficulty: 5 },
  { title: 'Budget review and expenses log', category: 'Personal', priority: 'Low', difficulty: 1 },
  { title: 'Write tech documentation', category: 'Work', priority: 'Med', difficulty: 3 },
  { title: '30-minute mindfulness meditation', category: 'Health', priority: 'Low', difficulty: 2 },
  { title: 'Deep work on core backend API', category: 'Work', priority: 'High', difficulty: 5 },
  { title: 'Family dinner & digital detox', category: 'Personal', priority: 'Med', difficulty: 2 },
  { title: 'Duolingo language lesson', category: 'Study', priority: 'Low', difficulty: 1 },
  { title: 'Weekly grocery prep & hydration', category: 'Health', priority: 'Low', difficulty: 2 },
  { title: 'Home organization & cleanup', category: 'Other', priority: 'Low', difficulty: 2 },
  { title: 'Car maintenance / errand', category: 'Other', priority: 'Low', difficulty: 3 },
];

/**
 * Generate 6 months (approx 180 days) of realistic demo tasks and daily scores.
 */
export function generateDemoSeedData(userId: string): {
  tasks: Task[];
  dailyScores: DailyScore[];
} {
  const tasks: Task[] = [];
  const dailyScores: DailyScore[] = [];

  const todayStr = getTodayDateStr();
  const totalDays = 180;

  // Predictable pseudo-random generator
  let seed = 42;
  function random(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let i = totalDays; i >= 0; i--) {
    const dateStr = addDaysToDateStr(todayStr, -i);
    const dayOfWeek = new Date(dateStr + 'T12:00:00').getDay(); // 0=Sun, 6=Sat

    // Simulate 1 or 2 rest days per week (e.g. Sunday or occasional Wednesday)
    const isRestDay = (dayOfWeek === 0 && random() > 0.3) || (dayOfWeek === 3 && random() > 0.8);

    if (isRestDay) {
      dailyScores.push({
        id: `score-${dateStr}`,
        user_id: userId,
        score_date: dateStr,
        points_earned: 0,
        points_total: 0,
        completion_pct: 0,
        tasks_completed: 0,
        tasks_total: 0,
        is_rest_day: true,
      });
      continue;
    }

    // Pick 3 to 6 tasks for this day
    const numTasks = 3 + Math.floor(random() * 3);
    const dayTasks: Task[] = [];
    const usedIndices = new Set<number>();

    // Completion tendency: higher in recent days to preserve an active streak
    const completionRate = i < 25 ? 0.85 + random() * 0.15 : 0.4 + random() * 0.6;

    for (let t = 0; t < numTasks; t++) {
      let index = Math.floor(random() * SAMPLE_TASKS_POOL.length);
      while (usedIndices.has(index)) {
        index = (index + 1) % SAMPLE_TASKS_POOL.length;
      }
      usedIndices.add(index);

      const template = SAMPLE_TASKS_POOL[index];
      const isCompleted = random() < completionRate;

      const task: Task = {
        id: `seed-task-${dateStr}-${t}`,
        user_id: userId,
        task_date: dateStr,
        title: template.title,
        description: `Demo task scheduled for ${dateStr}`,
        category: template.category,
        priority: template.priority,
        difficulty: template.difficulty,
        is_completed: isCompleted,
        created_at: new Date(dateStr + 'T08:00:00').toISOString(),
      };

      dayTasks.push(task);
      tasks.push(task);
    }

    // Calculate daily score for this day
    const scoreSummary = calculateDailyScore(dayTasks, false, 70);
    dailyScores.push({
      id: `score-${dateStr}`,
      user_id: userId,
      score_date: dateStr,
      points_earned: scoreSummary.points_earned,
      points_total: scoreSummary.points_total,
      completion_pct: scoreSummary.completion_pct,
      tasks_completed: scoreSummary.tasks_completed,
      tasks_total: scoreSummary.tasks_total,
      is_rest_day: false,
    });
  }

  return { tasks, dailyScores };
}
