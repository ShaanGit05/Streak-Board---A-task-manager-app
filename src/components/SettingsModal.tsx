import React, { useState } from 'react';
import type { UserSettings } from '../lib/types';
import { ThemeToggle } from './ThemeToggle';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSaveSettings: (updates: Partial<UserSettings>) => Promise<void>;
  onLoadDemoData: () => Promise<void>;
  onClearData: () => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onLoadDemoData,
  onClearData,
}) => {
  const [targetGoalPct, setTargetGoalPct] = useState<number>(settings.target_completion_pct);
  const [maxRestDays, setMaxRestDays] = useState<number>(settings.max_rest_days_per_week);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSaveSettings({
        target_completion_pct: targetGoalPct,
        max_rest_days_per_week: maxRestDays,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (confirm('Load 6 months of realistic historical data? This will populate your heatmap and streaks.')) {
      try {
        setSeeding(true);
        await onLoadDemoData();
        onClose();
      } finally {
        setSeeding(false);
      }
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all your tasks and scores? This cannot be undone.')) {
      try {
        setClearing(true);
        await onClearData();
        onClose();
      } finally {
        setClearing(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">⚙️ Settings & Consistency Rules</h3>
          <button className="toast-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Theme & Appearance */}
            <div className="form-group" style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-muted)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <label className="form-label" style={{ margin: 0 }}>
                    Appearance & Theme
                  </label>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Switch between Dark Glassmorphic and Light Glassmorphic styles
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* Target Daily Goal % */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Daily Goal Target: <strong>{targetGoalPct}%</strong>
                </label>
                <span className="points-pill" style={{ color: 'var(--green-4)' }}>
                  Default: 70%
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={targetGoalPct}
                onChange={(e) => setTargetGoalPct(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#26a641' }}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                A day counts toward your consistency streak when you earn at least this percentage of planned points.
              </div>
            </div>

            {/* Rest Days Per Week */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Max Rest Days Per Week: <strong>{maxRestDays} days</strong>
                </label>
                <span className="points-pill" style={{ color: 'var(--accent-blue)' }}>
                  Default: 2
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={maxRestDays}
                onChange={(e) => setMaxRestDays(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#58a6ff' }}
              />
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Rest days protect your streak without breaking momentum. Set the maximum allowed per calendar week (Mon - Sun).
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border-default)', margin: '20px 0' }} />

            {/* Demo Seed Generator */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-bright)', marginBottom: '4px' }}>
                ⚡ Heatmap Demo Verification
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Instantly populate 6 months of realistic historical activity across all categories to explore the contribution graph, streaks, and level progression right away.
              </p>
              <button
                type="button"
                className="btn"
                style={{ backgroundColor: '#1f2e1e', borderColor: 'var(--green-3)', color: 'var(--green-4)' }}
                onClick={handleSeed}
                disabled={seeding}
              >
                {seeding ? 'Generating 180 Days...' : '🌱 Generate 6 Months Demo Data'}
              </button>
            </div>

            {/* Data reset */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-red)', marginBottom: '4px' }}>
                Danger Zone
              </div>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={handleClear}
                disabled={clearing}
              >
                {clearing ? 'Clearing...' : 'Reset All User Tasks & Scores'}
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
