import React, { useState, useEffect } from 'react';
import type { Task, TaskCategory, TaskPriority } from '../lib/types';
import { calculateTaskPoints } from '../lib/scoring';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    difficulty: number;
  }) => Promise<void>;
  taskToEdit?: Task | null;
  targetDate: string;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Study', 'Health', 'Personal', 'Other'];
const PRIORITIES: TaskPriority[] = ['Low', 'Med', 'High'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  taskToEdit,
  targetDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('Med');
  const [difficulty, setDifficulty] = useState<number>(3);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setDifficulty(taskToEdit.difficulty);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Work');
      setPriority('Med');
      setDifficulty(3);
    }
    setError('');
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const calculatedPoints = calculateTaskPoints(difficulty, priority);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        priority,
        difficulty,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {taskToEdit ? 'Edit Task' : 'New Planned Task'}
          </h3>
          <button className="toast-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="date-banner-small" style={{ marginBottom: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Scheduled for <strong>{targetDate}</strong>
            </div>

            {error && <div className="form-error" style={{ marginBottom: '12px' }}>{error}</div>}

            <div className="form-group">
              <label className="form-label" htmlFor="task-title">Title *</label>
              <input
                id="task-title"
                type="text"
                className="form-input"
                placeholder="e.g. Read 2 chapters of System Design"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">Description (optional)</label>
              <textarea
                id="task-desc"
                className="form-textarea"
                rows={2}
                placeholder="Details, links, or notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-row-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="task-cat">Category</label>
                <select
                  id="task-cat"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategory)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-prio">Priority</label>
                <select
                  id="task-prio"
                  className="form-select"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p} (weight: {p === 'Low' ? '1x' : p === 'Med' ? '1.5x' : '2x'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" htmlFor="task-diff" style={{ margin: 0 }}>Difficulty (1 - 5)</label>
                <span className="points-pill" style={{ color: 'var(--green-4)', borderColor: 'var(--green-3)' }}>
                  Earns {calculatedPoints} pts
                </span>
              </div>
              <input
                id="task-diff"
                type="range"
                min="1"
                max="5"
                step="1"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#26a641' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>1 (Trivial)</span>
                <span>2 (Easy)</span>
                <span>3 (Moderate)</span>
                <span>4 (Hard)</span>
                <span>5 (Intense)</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
