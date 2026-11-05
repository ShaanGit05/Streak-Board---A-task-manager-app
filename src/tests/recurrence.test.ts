import { describe, it, expect } from 'vitest';
import { shouldRuleGenerateForDate, generateTasksForDate } from '../lib/recurrence';
import type { RecurringRule, Task } from '../lib/types';

describe('Recurrence Logic', () => {
  const dailyRule: RecurringRule = {
    id: 'rule-daily',
    user_id: 'u1',
    title: 'Morning Meditation',
    category: 'Health',
    priority: 'Low',
    difficulty: 2,
    repeat_type: 'daily',
    is_active: true,
  };

  const weekdaysRule: RecurringRule = {
    id: 'rule-weekdays',
    user_id: 'u1',
    title: 'Daily Standup',
    category: 'Work',
    priority: 'Med',
    difficulty: 1,
    repeat_type: 'weekdays',
    is_active: true,
  };

  const mwfRule: RecurringRule = {
    id: 'rule-mwf',
    user_id: 'u1',
    title: 'Gym Workout',
    category: 'Health',
    priority: 'High',
    difficulty: 4,
    repeat_type: 'weekly',
    repeat_days: [1, 3, 5], // Mon, Wed, Fri
    is_active: true,
  };

  it('evaluates daily rule properly', () => {
    // Should run on Monday, Saturday, Sunday, any date
    expect(shouldRuleGenerateForDate(dailyRule, '2026-11-02')).toBe(true); // Monday
    expect(shouldRuleGenerateForDate(dailyRule, '2026-11-07')).toBe(true); // Saturday
    expect(shouldRuleGenerateForDate(dailyRule, '2026-11-08')).toBe(true); // Sunday
  });

  it('evaluates weekdays rule properly (Mon-Fri only)', () => {
    expect(shouldRuleGenerateForDate(weekdaysRule, '2026-11-02')).toBe(true); // Mon
    expect(shouldRuleGenerateForDate(weekdaysRule, '2026-11-06')).toBe(true); // Fri
    expect(shouldRuleGenerateForDate(weekdaysRule, '2026-11-07')).toBe(false); // Sat
    expect(shouldRuleGenerateForDate(weekdaysRule, '2026-11-08')).toBe(false); // Sun
  });

  it('evaluates weekly specific days rule (Mon, Wed, Fri)', () => {
    expect(shouldRuleGenerateForDate(mwfRule, '2026-11-02')).toBe(true); // Mon
    expect(shouldRuleGenerateForDate(mwfRule, '2026-11-03')).toBe(false); // Tue
    expect(shouldRuleGenerateForDate(mwfRule, '2026-11-04')).toBe(true); // Wed
    expect(shouldRuleGenerateForDate(mwfRule, '2026-11-05')).toBe(false); // Thu
    expect(shouldRuleGenerateForDate(mwfRule, '2026-11-06')).toBe(true); // Fri
    expect(shouldRuleGenerateForDate(mwfRule, '2026-11-07')).toBe(false); // Sat
  });

  it('ignores inactive rules', () => {
    const inactive = { ...dailyRule, is_active: false };
    expect(shouldRuleGenerateForDate(inactive, '2026-11-02')).toBe(false);
  });

  it('generates task instances without duplicates', () => {
    const rules = [dailyRule, weekdaysRule, mwfRule];
    const monday = '2026-11-02';

    // First generation on empty date: all 3 apply on Monday
    const newTasks = generateTasksForDate(rules, monday, [], 'u1');
    expect(newTasks.length).toBe(3);
    expect(newTasks.map((t) => t.title)).toContain('Morning Meditation');
    expect(newTasks.map((t) => t.title)).toContain('Daily Standup');
    expect(newTasks.map((t) => t.title)).toContain('Gym Workout');

    // Simulate that 'Gym Workout' already exists for this rule on that date
    const existingTasks: Task[] = [
      {
        id: 'existing-task-1',
        user_id: 'u1',
        task_date: monday,
        title: 'Gym Workout',
        category: 'Health',
        priority: 'High',
        difficulty: 4,
        is_completed: false,
        recurring_rule_id: 'rule-mwf',
      },
    ];

    // Second generation: only Morning Meditation and Daily Standup should be created
    const regenerated = generateTasksForDate(rules, monday, existingTasks, 'u1');
    expect(regenerated.length).toBe(2);
    expect(regenerated.map((t) => t.title)).not.toContain('Gym Workout');
  });

  it('does NOT generate tasks on days prior to the rule creation date', () => {
    // Rule created on Thursday (2026-11-05)
    const thursdayRule: RecurringRule = {
      id: 'rule-thursday',
      user_id: 'u1',
      title: 'Thursday Habit',
      category: 'Study',
      priority: 'High',
      difficulty: 3,
      repeat_type: 'daily',
      is_active: true,
      created_at: '2026-11-05T10:00:00.000Z',
    };

    // Prior days: Wednesday (2026-11-04), Tuesday (2026-11-03)
    expect(shouldRuleGenerateForDate(thursdayRule, '2026-11-04')).toBe(false);
    expect(shouldRuleGenerateForDate(thursdayRule, '2026-11-03')).toBe(false);
    expect(shouldRuleGenerateForDate(thursdayRule, '2026-11-02')).toBe(false);

    // On or after Thursday:
    expect(shouldRuleGenerateForDate(thursdayRule, '2026-11-05')).toBe(true);
    expect(shouldRuleGenerateForDate(thursdayRule, '2026-11-06')).toBe(true);
    expect(shouldRuleGenerateForDate(thursdayRule, '2026-11-07')).toBe(true);
  });
});
