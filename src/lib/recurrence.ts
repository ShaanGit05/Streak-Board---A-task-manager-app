import type { RecurringRule, Task } from './types';
import { getDayOfWeek } from './dates';

/**
 * Determine if a recurring rule applies to a specific date.
 */
export function shouldRuleGenerateForDate(rule: RecurringRule, dateStr: string): boolean {
  if (!rule.is_active) return false;

  const dayOfWeek = getDayOfWeek(dateStr); // 0=Sun, 1=Mon, ..., 6=Sat

  switch (rule.repeat_type) {
    case 'daily':
      return true;

    case 'weekdays':
      // Monday (1) through Friday (5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case 'weekly':
      if (!rule.repeat_days || rule.repeat_days.length === 0) {
        return false;
      }
      return rule.repeat_days.includes(dayOfWeek);

    case 'none':
    default:
      return false;
  }
}

/**
 * Generate instances of recurring tasks for a specific date without creating duplicates.
 * Checks existing tasks for that date to see if the rule has already been instantiated.
 */
export function generateTasksForDate(
  rules: RecurringRule[],
  dateStr: string,
  existingTasksForDate: Task[],
  userId: string
): Omit<Task, 'id'>[] {
  const existingRuleIds = new Set(
    existingTasksForDate
      .filter((t) => !!t.recurring_rule_id)
      .map((t) => t.recurring_rule_id)
  );

  const existingTitles = new Set(
    existingTasksForDate.map((t) => t.title.trim().toLowerCase())
  );

  const newTasks: Omit<Task, 'id'>[] = [];

  for (const rule of rules) {
    if (!shouldRuleGenerateForDate(rule, dateStr)) {
      continue;
    }

    // Skip if already generated for this rule id
    if (existingRuleIds.has(rule.id)) {
      continue;
    }

    // Also skip if an identical task title already exists on this date to be extra safe
    if (existingTitles.has(rule.title.trim().toLowerCase())) {
      continue;
    }

    newTasks.push({
      user_id: userId,
      task_date: dateStr,
      title: rule.title,
      description: rule.description || '',
      category: rule.category,
      priority: rule.priority,
      difficulty: rule.difficulty,
      is_completed: false,
      recurring_rule_id: rule.id,
      created_at: new Date().toISOString(),
    });

    // Mark as accounted for
    existingTitles.add(rule.title.trim().toLowerCase());
  }

  return newTasks;
}
