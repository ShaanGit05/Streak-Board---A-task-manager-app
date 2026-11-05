import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { Heatmap } from '../components/Heatmap';
import { CategoryDonut } from '../components/CategoryDonut';
import { formatShortDate } from '../lib/dates';
import {
  Flame,
  Trophy,
  CheckCircle,
  TrendingUp,
  Star,
  Award,
  Edit2,
  Check,
  X,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateDisplayName } = useAuth();
  const { allScores, allTasks, streakStats, levelInfo, settings, setSelectedDate } = useData();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.display_name || '');
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    try {
      setSavingName(true);
      await updateDisplayName(nameInput.trim());
      setIsEditingName(false);
      addToast('Profile name updated!', 'success');
    } catch {
      addToast('Failed to update name', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const handleSelectHeatmapDate = (dateStr: string) => {
    setSelectedDate(dateStr);
    navigate('/');
  };

  // Member since date
  const memberSince = 'Nov 2026';

  return (
    <div className="profile-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      {/* Profile Header Card */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-subtle)',
                border: '2px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--green-4)',
              }}
            >
              {user?.display_name ? user.display_name.slice(0, 2).toUpperCase() : 'SB'}
            </div>

            <div>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    style={{ padding: '4px 8px', fontSize: '16px', fontWeight: 600 }}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveName}
                    disabled={savingName}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setNameInput(user?.display_name || '');
                      setIsEditingName(false);
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
                    {user?.display_name || 'Consistency Champion'}
                  </h2>
                  <button
                    type="button"
                    style={{ color: 'var(--text-muted)', padding: '4px' }}
                    onClick={() => setIsEditingName(true)}
                    title="Edit display name"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}

              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {user?.email} · Member since {memberSince}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--green-3)',
                    color: 'var(--green-4)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <Award size={12} /> Level {levelInfo.level}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-bright)' }}>
                  {levelInfo.title}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  · {levelInfo.totalXP} Total XP
                </span>
              </div>
            </div>
          </div>

          {/* XP Progress Details */}
          <div style={{ minWidth: '220px', flex: '1', maxWidth: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Level {levelInfo.level} Progress</span>
              <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                {levelInfo.currentLevelXP} / {levelInfo.xpNeededForNextLevel} XP ({levelInfo.progressPct}%)
              </span>
            </div>
            <div
              style={{
                height: '8px',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                border: '1px solid var(--border-default)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${levelInfo.progressPct}%`,
                  background: 'linear-gradient(90deg, #26a641, #39d353)',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              {levelInfo.xpNeededForNextLevel - levelInfo.currentLevelXP} XP to Level {levelInfo.level + 1}
            </div>
          </div>
        </div>
      </div>

      {/* 5 Consistency Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Current Streak */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>
            <Flame size={16} color="#e3b341" /> Current Streak
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)' }}>
            {streakStats.currentStreak}{' '}
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Target: ≥{settings.target_completion_pct}% score
          </div>
        </div>

        {/* Longest Streak */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>
            <Trophy size={16} color="#58a6ff" /> Longest Streak
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)' }}>
            {streakStats.longestStreak}{' '}
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>days</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Personal Best Record
          </div>
        </div>

        {/* Total Tasks Completed */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>
            <CheckCircle size={16} color="#3fb950" /> Tasks Done
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)' }}>
            {streakStats.totalCompletedTasks}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Lifetime completions
          </div>
        </div>

        {/* Average Daily Score */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>
            <TrendingUp size={16} color="#bc8cff" /> Avg Daily Score
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)' }}>
            {streakStats.averageDailyScore}{' '}
            <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>pts</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Across active days
          </div>
        </div>

        {/* Best Day */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '6px' }}>
            <Star size={16} color="#d29922" /> Best Day
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)' }}>
            {streakStats.bestDay ? `${streakStats.bestDay.points} pts` : '—'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {streakStats.bestDay ? formatShortDate(streakStats.bestDay.date) : 'No scores yet'}
          </div>
        </div>
      </div>

      {/* GitHub-Style Contribution Heatmap */}
      <Heatmap
        dailyScores={allScores}
        targetGoalPct={settings.target_completion_pct}
        onSelectDate={handleSelectHeatmapDate}
      />

      {/* Category Breakdown (Last 30 Days Donut) */}
      <CategoryDonut tasks={allTasks} />
    </div>
  );
};
