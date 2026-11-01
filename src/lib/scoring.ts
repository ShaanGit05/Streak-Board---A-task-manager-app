import type { Task, TaskPriority, DailyScoreSummary } from './types';

export const PRIORITY_WEIGHTS: Record<TaskPriority, number> = {
  Low: 1,
  Med: 1.5,
  High: 2,
};

/**
 * Calculate points for an individual task.
 * Points = difficulty * priority weight
 */
export function calculateTaskPoints(difficulty: number, priority: TaskPriority): number {
  const weight = PRIORITY_WEIGHTS[priority] ?? 1;
  const clampedDifficulty = Math.max(1, Math.min(5, difficulty));
  return Number((clampedDifficulty * weight).toFixed(1));
}

/**
 * Calculate the daily score summary from a list of tasks for that day.
 * - earned points = sum of points for completed tasks
 * - planned points = sum of points for all tasks
 * - completion % = earned points / planned points (rounded to integer 0-100)
 * - goal_met = completion_pct >= targetPct (if there are planned tasks)
 */
export function calculateDailyScore(
  tasks: Task[],
  isRestDay: boolean = false,
  targetCompletionPct: number = 70
): DailyScoreSummary {
  const tasks_total = tasks.length;
  let points_total = 0;
  let points_earned = 0;
  let tasks_completed = 0;

  for (const task of tasks) {
    const pts = calculateTaskPoints(task.difficulty, task.priority);
    points_total += pts;
    if (task.is_completed) {
      points_earned += pts;
      tasks_completed += 1;
    }
  }

  // Round points to 1 decimal place
  points_earned = Number(points_earned.toFixed(1));
  points_total = Number(points_total.toFixed(1));

  let completion_pct = 0;
  if (points_total > 0) {
    completion_pct = Math.round((points_earned / points_total) * 100);
  }

  const goal_met = !isRestDay && points_total > 0 && completion_pct >= targetCompletionPct;

  return {
    points_earned,
    points_total,
    completion_pct,
    tasks_completed,
    tasks_total,
    is_rest_day: isRestDay,
    goal_met,
  };
}
