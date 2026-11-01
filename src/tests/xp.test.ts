import { describe, it, expect } from 'vitest';
import { calculateLevel, getXPForLevel, getLevelTitle } from '../lib/xp';

describe('XP and Level Calculation', () => {
  it('correctly calculates threshold for each level', () => {
    // Level 1: 0 XP
    expect(getXPForLevel(1)).toBe(0);
    // Level 2: 100 XP
    expect(getXPForLevel(2)).toBe(100);
    // Level 3: 100 + 200 = 300 XP
    expect(getXPForLevel(3)).toBe(300);
    // Level 4: 300 + 300 = 600 XP
    expect(getXPForLevel(4)).toBe(600);
    // Level 5: 600 + 400 = 1000 XP
    expect(getXPForLevel(5)).toBe(1000);
  });

  it('determines current level and progress', () => {
    // 0 XP -> Level 1 (0 / 100 XP, 0%)
    const l1 = calculateLevel(0);
    expect(l1.level).toBe(1);
    expect(l1.currentLevelXP).toBe(0);
    expect(l1.xpNeededForNextLevel).toBe(100);
    expect(l1.progressPct).toBe(0);
    expect(l1.title).toBe('Novice Planner');

    // 50 XP -> Level 1 (50 / 100 XP, 50%)
    const l1_half = calculateLevel(50);
    expect(l1_half.level).toBe(1);
    expect(l1_half.currentLevelXP).toBe(50);
    expect(l1_half.progressPct).toBe(50);

    // 100 XP -> Level 2 (0 / 200 XP, 0%)
    const l2 = calculateLevel(100);
    expect(l2.level).toBe(2);
    expect(l2.currentLevelXP).toBe(0);
    expect(l2.xpNeededForNextLevel).toBe(200);
    expect(l2.progressPct).toBe(0);

    // 250 XP -> Level 2 (150 / 200 XP, 75%)
    const l2_mid = calculateLevel(250);
    expect(l2_mid.level).toBe(2);
    expect(l2_mid.currentLevelXP).toBe(150);
    expect(l2_mid.progressPct).toBe(75);

    // 300 XP -> Level 3 (0 / 300 XP, 0%)
    const l3 = calculateLevel(300);
    expect(l3.level).toBe(3);
    expect(l3.title).toBe('Habit Builder');
  });

  it('assigns correct level titles', () => {
    expect(getLevelTitle(1)).toBe('Novice Planner');
    expect(getLevelTitle(2)).toBe('Novice Planner');
    expect(getLevelTitle(3)).toBe('Habit Builder');
    expect(getLevelTitle(4)).toBe('Habit Builder');
    expect(getLevelTitle(5)).toBe('Momentum Master');
    expect(getLevelTitle(8)).toBe('Consistency Champion');
    expect(getLevelTitle(11)).toBe('Focus Grandmaster');
    expect(getLevelTitle(15)).toBe('Streak Titan');
    expect(getLevelTitle(20)).toBe('Streak Titan');
  });
});
