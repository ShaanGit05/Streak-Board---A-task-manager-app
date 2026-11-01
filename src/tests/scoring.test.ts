import { describe, it, expect } from 'vitest';
import { calculateTaskPoints, calculateDailyScore, PRIORITY_WEIGHTS } from '../lib/scoring';
import type { Task } from '../lib/types';

describe('Scoring Logic', () => {
  it('applies correct priority weights', () => {
    expect(PRIORITY_WEIGHTS.Low).toBe(1);
    expect(PRIORITY_WEIGHTS.Med).toBe(1.5);
    expect(PRIORITY_WEIGHTS.High).toBe(2);
  });

  it('calculates points per task correctly (difficulty x priority)', () => {
    // 3 difficulty x 1 (Low) = 3
    expect(calculateTaskPoints(3, 'Low')).toBe(3);
    // 4 difficulty x 1.5 (Med) = 6
    expect(calculateTaskPoints(4, 'Med')).toBe(6);
    // 5 difficulty x 2 (High) = 10
    expect(calculateTaskPoints(5, 'High')).toBe(10);
    // 1 difficulty x 1.5 (Med) = 1.5
    expect(calculateTaskPoints(1, 'Med')).toBe(1.5);
  });

  it('clamps difficulty between 1 and 5', () => {
    expect(calculateTaskPoints(0, 'High')).toBe(2); // clamped to 1 * 2 = 2
    expect(calculateTaskPoints(10, 'High')).toBe(10); // clamped to 5 * 2 = 10
  });

  it('calculates daily score summary and completion percentage', () => {
    const tasks: Task[] = [
      {
        id: '1',
        user_id: 'user-1',
        task_date: '2026-11-01',
        title: 'Task 1',
        category: 'Work',
        priority: 'High',
        difficulty: 3, // 3 * 2 = 6 pts
        is_completed: true,
      },
      {
        id: '2',
        user_id: 'user-1',
        task_date: '2026-11-01',
        title: 'Task 2',
        category: 'Study',
        priority: 'Med',
        difficulty: 2, // 2 * 1.5 = 3 pts
        is_completed: true,
      },
      {
        id: '3',
        user_id: 'user-1',
        task_date: '2026-11-01',
        title: 'Task 3',
        category: 'Health',
        priority: 'Low',
        difficulty: 1, // 1 * 1 = 1 pt
        is_completed: false,
      },
    ];

    // Total points = 6 + 3 + 1 = 10
    // Earned points = 6 + 3 = 9
    // Completion % = 9 / 10 = 90%
    const summary = calculateDailyScore(tasks, false, 70);

    expect(summary.points_total).toBe(10);
    expect(summary.points_earned).toBe(9);
    expect(summary.completion_pct).toBe(90);
    expect(summary.tasks_total).toBe(3);
    expect(summary.tasks_completed).toBe(2);
    expect(summary.goal_met).toBe(true);
    expect(summary.is_rest_day).toBe(false);
  });

  it('marks goal_met false when below target', () => {
    const tasks: Task[] = [
      {
        id: '1',
        user_id: 'u1',
        task_date: '2026-11-01',
        title: 'Task 1',
        category: 'Work',
        priority: 'Low',
        difficulty: 3,
        is_completed: false, // 0 / 3 = 0%
      },
    ];

    const summary = calculateDailyScore(tasks, false, 70);
    expect(summary.completion_pct).toBe(0);
    expect(summary.goal_met).toBe(false);
  });

  it('handles empty task list', () => {
    const summary = calculateDailyScore([], false, 70);
    expect(summary.points_total).toBe(0);
    expect(summary.points_earned).toBe(0);
    expect(summary.completion_pct).toBe(0);
    expect(summary.goal_met).toBe(false);
  });

  it('recognizes rest day without goal_met requirement', () => {
    const summary = calculateDailyScore([], true, 70);
    expect(summary.is_rest_day).toBe(true);
    expect(summary.goal_met).toBe(false);
  });
});
