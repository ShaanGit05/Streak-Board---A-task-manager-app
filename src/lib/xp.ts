import type { LevelInfo } from './types';

export const LEVEL_TITLES: { minLevel: number; title: string }[] = [
  { minLevel: 15, title: 'Streak Titan' },
  { minLevel: 11, title: 'Focus Grandmaster' },
  { minLevel: 8, title: 'Consistency Champion' },
  { minLevel: 5, title: 'Momentum Master' },
  { minLevel: 3, title: 'Habit Builder' },
  { minLevel: 1, title: 'Novice Planner' },
];

export function getLevelTitle(level: number): string {
  for (const entry of LEVEL_TITLES) {
    if (level >= entry.minLevel) {
      return entry.title;
    }
  }
  return 'Novice Planner';
}

/**
 * Total XP required to reach a specific level.
 * Level 1 requires 0 XP.
 * Level 2 requires 100 XP.
 * Level 3 requires 100 + 200 = 300 XP.
 * Level L requires 50 * L * (L - 1) XP.
 */
export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  return 50 * level * (level - 1);
}

/**
 * Calculate level, title, XP in current level, XP needed for next level, and progress percentage.
 * Total points earned = total XP.
 */
export function calculateLevel(totalXP: number): LevelInfo {
  const safeXP = Math.max(0, Math.floor(totalXP));

  // Solve 50 * L * (L - 1) <= safeXP
  // L^2 - L - safeXP / 50 = 0
  // L = (1 + sqrt(1 + 4 * safeXP / 50)) / 2
  const level = Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * safeXP) / 50)) / 2));
  const title = getLevelTitle(level);

  const xpForCurrentLevel = getXPForLevel(level);
  const xpNeededForNextLevel = 100 * level; // XP needed to complete this level
  const currentLevelXP = safeXP - xpForCurrentLevel;
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round((currentLevelXP / xpNeededForNextLevel) * 100))
  );

  return {
    level,
    title,
    totalXP: safeXP,
    currentLevelXP,
    xpNeededForNextLevel,
    progressPct,
  };
}
