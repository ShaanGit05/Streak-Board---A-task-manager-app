import type { DailyScore, StreakStats } from './types';
import { addDaysToDateStr, getTodayDateStr } from './dates';

/**
 * Check if a daily score counts as meeting the goal.
 */
export function isDaySuccessful(score: DailyScore | undefined, targetGoalPct: number = 70): boolean {
  if (!score) return false;
  return (
    !score.is_rest_day &&
    score.points_total > 0 &&
    score.completion_pct >= targetGoalPct
  );
}

/**
 * Calculates current streak and longest streak from daily score records.
 * 
 * Rules:
 * - A day with completion_pct >= targetGoalPct is a success and increments streak.
 * - A day marked is_rest_day = true DOES NOT break streak (acts as bridge).
 * - A day that failed (not rest day and completion_pct < targetGoalPct) breaks streak.
 * - For today: if today hasn't met the goal yet (in-progress), yesterday's streak is preserved.
 *   If today met the goal, today counts towards streak.
 */
export function calculateStreakStats(
  dailyScores: DailyScore[],
  targetGoalPct: number = 70,
  referenceDateStr: string = getTodayDateStr()
): StreakStats {
  if (!dailyScores || dailyScores.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalCompletedTasks: 0,
      averageDailyScore: 0,
      bestDay: null,
      activeDaysCount: 0,
    };
  }

  // Create a map by score_date for fast O(1) lookup
  const scoreMap = new Map<string, DailyScore>();
  let totalCompletedTasks = 0;
  let totalPointsEarned = 0;
  let activeDaysCount = 0;
  let bestDay: { date: string; points: number } | null = null;

  for (const s of dailyScores) {
    scoreMap.set(s.score_date, s);
    totalCompletedTasks += s.tasks_completed;
    totalPointsEarned += s.points_earned;

    if (s.points_earned > 0 || s.is_rest_day) {
      activeDaysCount += 1;
    }

    if (!bestDay || s.points_earned > bestDay.points) {
      if (s.points_earned > 0) {
        bestDay = { date: s.score_date, points: s.points_earned };
      }
    }
  }

  const averageDailyScore =
    activeDaysCount > 0 ? Number((totalPointsEarned / activeDaysCount).toFixed(1)) : 0;

  // 1. Calculate Current Streak starting from referenceDateStr (today)
  let currentStreak = 0;
  let checkDate = referenceDateStr;
  const todayScore = scoreMap.get(checkDate);

  if (todayScore && isDaySuccessful(todayScore, targetGoalPct)) {
    // Today has already met the goal!
    currentStreak += 1;
    checkDate = addDaysToDateStr(checkDate, -1);
  } else if (todayScore && todayScore.is_rest_day) {
    // Today is a rest day, streak is preserved from yesterday
    checkDate = addDaysToDateStr(checkDate, -1);
  } else {
    // Today is still in progress / not yet finished.
    // Check if yesterday had an active streak.
    checkDate = addDaysToDateStr(checkDate, -1);
  }

  // Walk backwards day-by-day
  while (true) {
    const dayScore = scoreMap.get(checkDate);
    if (!dayScore) {
      // Missing day -> streak broken
      break;
    }

    if (isDaySuccessful(dayScore, targetGoalPct)) {
      currentStreak += 1;
      checkDate = addDaysToDateStr(checkDate, -1);
    } else if (dayScore.is_rest_day) {
      // Rest day: does not break streak! Continue walking back
      checkDate = addDaysToDateStr(checkDate, -1);
    } else {
      // Unmet goal day that is not a rest day: streak broken
      break;
    }
  }

  // 2. Calculate Longest Streak in history
  // Sort all unique dates in ascending order
  const allDates = Array.from(scoreMap.keys()).sort();
  let longestStreak = 0;
  let tempStreak = 0;

  // For longest streak, we can walk through consecutive dates in the recorded date range
  if (allDates.length > 0) {
    const firstDate = allDates[0];
    const lastDate = allDates[allDates.length - 1];
    let curr = firstDate;

    while (curr <= lastDate) {
      const s = scoreMap.get(curr);
      if (s && isDaySuccessful(s, targetGoalPct)) {
        tempStreak += 1;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else if (s && s.is_rest_day) {
        // Rest day bridges streak without breaking it
        // Note: tempStreak remains the same
      } else {
        // Day missed or goal not met
        tempStreak = 0;
      }
      curr = addDaysToDateStr(curr, 1);
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletedTasks,
    averageDailyScore,
    bestDay,
    activeDaysCount,
  };
}
