import React, { useState } from 'react';
import type { RecurringRule, TaskCategory, TaskPriority, RepeatType } from '../lib/types';
import { calculateTaskPoints } from '../lib/scoring';

interface RecurringTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: RecurringRule[];
  onCreateRule: (rule: Omit<RecurringRule, 'id' | 'user_id'>) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Study', 'Health', 'Personal', 'Other'];
const PRIORITIES: TaskPriority[] = ['Low', 'Med', 'High'];
const DAYS_OF_WEEK = [
  { day: 1, label: 'Mon' },
  { day: 2, label: 'Tue' },
  { day: 3, label: 'Wed' },
  { day: 4, label: 'Thu' },
  { day: 5, label: 'Fri' },
  { day: 6, label: 'Sat' },
  { day: 0, label: 'Sun' },
];

export const RecurringTasksModal: React.FC<RecurringTasksModalProps> = ({
  isOpen,
  onClose,
  rules,
  onCreateRule,
  onDeleteRule,
  onToggleActive,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Health');
  const [priority, setPriority] = useState<TaskPriority>('Med');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [repeatType, setRepeatType] = useState<RepeatType>('daily');
  const [repeatDays, setRepeatDays] = useState<number[]>([1, 3, 5]); // default Mon, Wed, Fri
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter((d) => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (repeatType === 'weekly' && repeatDays.length === 0) {
      setError('Please select at least one day for weekly recurrence');
      return;
    }

    try {
      setSubmitting(true);
      await onCreateRule({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        difficulty,
        repeat_type: repeatType,
        repeat_days: repeatType === 'weekly' ? repeatDays : undefined,
        is_active: true,
      });
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create recurring rule');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">🔄 Recurring Tasks</h3>
          <button className="toast-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Recurring tasks automatically generate when you open a matching date. No duplicates are ever created.
          </p>

          {!isCreating ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                  Active Rules ({rules.length})
                </span>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCreating(true)}
                >
                  + New Recurring Task
                </button>
              </div>

              {rules.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div style={{ fontSize: '24px' }}>🔄</div>
                  <div className="empty-state-title">No recurring tasks yet</div>
                  <div className="empty-state-text">
                    Create routines like "Morning Workout" or "Weekly Review" to auto-populate your days!
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {rules.map((rule) => {
                    const pts = calculateTaskPoints(rule.difficulty, rule.priority);
                    let cadenceText = 'Daily';
                    if (rule.repeat_type === 'weekdays') cadenceText = 'Weekdays (Mon-Fri)';
                    if (rule.repeat_type === 'weekly') {
                      cadenceText =
                        'Weekly: ' +
                        (rule.repeat_days || [])
                          .map((d) => DAYS_OF_WEEK.find((item) => item.day === d)?.label)
                          .filter(Boolean)
                          .join(', ');
                    }

                    return (
                      <div
                        key={rule.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          backgroundColor: 'var(--bg-canvas)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span
                              style={{
                                fontWeight: 600,
                                color: rule.is_active ? 'var(--text-bright)' : 'var(--text-disabled)',
                                textDecoration: rule.is_active ? 'none' : 'line-through',
                              }}
                            >
                              {rule.title}
                            </span>
                            <span className={`badge badge-${rule.category}`}>{rule.category}</span>
                            <span className="points-pill">{pts} pts</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--accent-blue)' }}>
                            {cadenceText}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => onToggleActive(rule.id, !rule.is_active)}
                            title={rule.is_active ? 'Pause Rule' : 'Resume Rule'}
                          >
                            {rule.is_active ? 'Active' : 'Paused'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => onDeleteRule(rule.id)}
                            title="Delete Rule"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                  Create Recurring Task
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setIsCreating(false)}
                >
                  Back to List
                </button>
              </div>

              {error && <div className="form-error" style={{ marginBottom: '12px' }}>{error}</div>}

              <div className="form-group">
                <label className="form-label">Task Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Morning 20m Workout"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Notes or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Repeat Cadence</label>
                <select
                  className="form-select"
                  value={repeatType}
                  onChange={(e) => setRepeatType(e.target.value as RepeatType)}
                >
                  <option value="daily">Every Day</option>
                  <option value="weekdays">Weekdays Only (Mon - Fri)</option>
                  <option value="weekly">Specific Days of Week</option>
                </select>
              </div>

              {repeatType === 'weekly' && (
                <div className="form-group">
                  <label className="form-label">Select Days</label>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {DAYS_OF_WEEK.map((item) => {
                      const isSelected = repeatDays.includes(item.day);
                      return (
                        <button
                          key={item.day}
                          type="button"
                          className={`btn btn-sm ${isSelected ? 'btn-primary' : ''}`}
                          style={{ minWidth: '40px' }}
                          onClick={() => toggleDay(item.day)}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Difficulty Points: {difficulty}</label>
                  <span className="points-pill" style={{ color: 'var(--green-4)' }}>
                    Earns {calculateTaskPoints(difficulty, priority)} pts
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-green)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn" onClick={() => setIsCreating(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Save Recurring Rule'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
