import { describe, it, expect } from 'vitest';
import { calculateStreakStats, isDaySuccessful } from '../lib/streaks';
import type { DailyScore } from '../lib/types';

describe('Streak Calculation Logic', () => {
  it('correctly assesses a successful day based on target pct', () => {
    const success: DailyScore = {
      user_id: 'u1',
      score_date: '2026-11-01',
      points_earned: 8,
      points_total: 10,
      completion_pct: 80,
      tasks_completed: 4,
      tasks_total: 5,
      is_rest_day: false,
    };
    expect(isDaySuccessful(success, 70)).toBe(true);

    const failure: DailyScore = {
      ...success,
      completion_pct: 50,
      points_earned: 5,
    };
    expect(isDaySuccessful(failure, 70)).toBe(false);

    const restDay: DailyScore = {
      ...success,
      is_rest_day: true,
    };
    expect(isDaySuccessful(restDay, 70)).toBe(false);
  });

  it('calculates consecutive streak ending today', () => {
    const scores: DailyScore[] = [
      {
        user_id: 'u1',
        score_date: '2026-11-01', // 3 days ago
        points_earned: 10,
        points_total: 10,
        completion_pct: 100,
        tasks_completed: 3,
        tasks_total: 3,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-02', // 2 days ago
        points_earned: 8,
        points_total: 10,
        completion_pct: 80,
        tasks_completed: 2,
        tasks_total: 3,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-03', // yesterday
        points_earned: 7,
        points_total: 10,
        completion_pct: 70,
        tasks_completed: 2,
        tasks_total: 3,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-04', // today
        points_earned: 9,
        points_total: 10,
        completion_pct: 90,
        tasks_completed: 3,
        tasks_total: 3,
        is_rest_day: false,
      },
    ];

    const stats = calculateStreakStats(scores, 70, '2026-11-04');
    expect(stats.currentStreak).toBe(4);
    expect(stats.longestStreak).toBe(4);
    expect(stats.totalCompletedTasks).toBe(10);
    expect(stats.activeDaysCount).toBe(4);
  });

  it('preserves streak across rest days without breaking it', () => {
    // Nov 1 (Success) -> Nov 2 (Rest Day) -> Nov 3 (Success) -> Nov 4 (Today: Rest Day)
    const scores: DailyScore[] = [
      {
        user_id: 'u1',
        score_date: '2026-11-01',
        points_earned: 10,
        points_total: 10,
        completion_pct: 100,
        tasks_completed: 2,
        tasks_total: 2,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-02',
        points_earned: 0,
        points_total: 0,
        completion_pct: 0,
        tasks_completed: 0,
        tasks_total: 0,
        is_rest_day: true, // Rest day!
      },
      {
        user_id: 'u1',
        score_date: '2026-11-03',
        points_earned: 15,
        points_total: 15,
        completion_pct: 100,
        tasks_completed: 3,
        tasks_total: 3,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-04', // today is rest day
        points_earned: 0,
        points_total: 0,
        completion_pct: 0,
        tasks_completed: 0,
        tasks_total: 0,
        is_rest_day: true,
      },
    ];

    const stats = calculateStreakStats(scores, 70, '2026-11-04');
    // 2 active goal days (Nov 1 and Nov 3) connected by rest days
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });

  it('breaks streak when a day is missed and not marked as rest day', () => {
    // Nov 1 (Success) -> Nov 2 (MISSED) -> Nov 3 (Success) -> Nov 4 (Today: Success)
    const scores: DailyScore[] = [
      {
        user_id: 'u1',
        score_date: '2026-11-01',
        points_earned: 10,
        points_total: 10,
        completion_pct: 100,
        tasks_completed: 2,
        tasks_total: 2,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-02',
        points_earned: 2,
        points_total: 10,
        completion_pct: 20, // Failed goal
        tasks_completed: 1,
        tasks_total: 3,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-03',
        points_earned: 10,
        points_total: 10,
        completion_pct: 100,
        tasks_completed: 2,
        tasks_total: 2,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-04',
        points_earned: 10,
        points_total: 10,
        completion_pct: 100,
        tasks_completed: 2,
        tasks_total: 2,
        is_rest_day: false,
      },
    ];

    const stats = calculateStreakStats(scores, 70, '2026-11-04');
    // Nov 3 and Nov 4 = 2 days
    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });

  it('keeps yesterday streak intact if today is still in progress', () => {
    // Nov 1 (Success) -> Nov 2 (Success) -> Nov 3 (Today: 0% so far, working on it)
    const scores: DailyScore[] = [
      {
        user_id: 'u1',
        score_date: '2026-11-01',
        points_earned: 10,
        points_total: 10,
        completion_pct: 100,
        tasks_completed: 2,
        tasks_total: 2,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-02',
        points_earned: 10,
        points_total: 10,
        completion_pct: 100,
        tasks_completed: 2,
        tasks_total: 2,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-03', // Today in progress
        points_earned: 2,
        points_total: 10,
        completion_pct: 20,
        tasks_completed: 1,
        tasks_total: 3,
        is_rest_day: false,
      },
    ];

    const stats = calculateStreakStats(scores, 70, '2026-11-03');
    // Yesterday's streak of 2 days is held!
    expect(stats.currentStreak).toBe(2);
  });

  it('finds best day and average daily score', () => {
    const scores: DailyScore[] = [
      {
        user_id: 'u1',
        score_date: '2026-11-01',
        points_earned: 10,
        points_total: 10,
        completion_pct: 100,
        tasks_completed: 2,
        tasks_total: 2,
        is_rest_day: false,
      },
      {
        user_id: 'u1',
        score_date: '2026-11-02',
        points_earned: 25, // Best day!
        points_total: 25,
        completion_pct: 100,
        tasks_completed: 5,
        tasks_total: 5,
        is_rest_day: false,
      },
    ];

    const stats = calculateStreakStats(scores, 70, '2026-11-02');
    expect(stats.bestDay).toEqual({ date: '2026-11-02', points: 25 });
    expect(stats.averageDailyScore).toBe(17.5);
  });
});
