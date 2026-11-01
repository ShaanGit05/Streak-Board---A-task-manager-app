import React, { useState } from 'react';
import type { TaskTemplate, Task } from '../lib/types';
import { calculateTaskPoints } from '../lib/scoring';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTasks: Task[];
  targetDate: string;
  templates: TaskTemplate[];
  onSaveTemplate: (name: string, description?: string) => Promise<void>;
  onApplyTemplate: (templateId: string) => Promise<number>;
  onDeleteTemplate: (templateId: string) => Promise<void>;
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  currentTasks,
  targetDate,
  templates,
  onSaveTemplate,
  onApplyTemplate,
  onDeleteTemplate,
}) => {
  const [mode, setMode] = useState<'apply' | 'save'>('apply');
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }
    if (currentTasks.length === 0) {
      setError('There are no tasks on this day to save into a template');
      return;
    }

    try {
      setSubmitting(true);
      await onSaveTemplate(templateName.trim(), templateDesc.trim() || undefined);
      setTemplateName('');
      setTemplateDesc('');
      setMode('apply');
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async () => {
    if (!selectedTemplateId) {
      setError('Please select a template to apply');
      return;
    }
    try {
      setSubmitting(true);
      await onApplyTemplate(selectedTemplateId);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'apply' ? 'btn-primary' : ''}`}
              onClick={() => {
                setMode('apply');
                setError('');
              }}
            >
              Apply Template
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'save' ? 'btn-primary' : ''}`}
              onClick={() => {
                setMode('save');
                setError('');
              }}
            >
              Save Day as Template
            </button>
          </div>
          <button className="toast-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="form-error" style={{ marginBottom: '14px' }}>{error}</div>}

          {mode === 'apply' ? (
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Select a saved template to populate <strong>{targetDate}</strong> in one click.
              </p>

              {templates.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div style={{ fontSize: '24px' }}>📋</div>
                  <div className="empty-state-title">No templates saved yet</div>
                  <div className="empty-state-text">
                    You can switch to "Save Day as Template" to capture today's task structure!
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {templates.map((tmpl) => {
                    const isSelected = tmpl.id === selectedTemplateId;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedTemplateId(tmpl.id);
                          setError('');
                        }}
                        style={{
                          padding: '12px 14px',
                          border: `1px solid ${isSelected ? 'var(--green-3)' : 'var(--border-default)'}`,
                          backgroundColor: isSelected ? 'rgba(38, 166, 65, 0.1)' : 'var(--bg-canvas)',
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                            {tmpl.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="points-pill">
                              {tmpl.items?.length || 0} tasks
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              style={{ padding: '2px 6px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTemplate(tmpl.id);
                              }}
                              title="Delete template"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {tmpl.description && (
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {tmpl.description}
                          </div>
                        )}

                        {tmpl.items && tmpl.items.length > 0 && isSelected && (
                          <div
                            style={{
                              marginTop: '10px',
                              paddingTop: '8px',
                              borderTop: '1px solid var(--border-muted)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                            }}
                          >
                            {tmpl.items.map((item, idx) => {
                              const pts = calculateTaskPoints(item.difficulty, item.priority);
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    fontSize: '12px',
                                  }}
                                >
                                  <span>• {item.title}</span>
                                  <span style={{ color: 'var(--text-muted)' }}>
                                    {item.category} ({pts} pts)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSave}>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                Save the <strong>{currentTasks.length} task(s)</strong> currently on{' '}
                <strong>{targetDate}</strong> as a reusable template.
              </p>

              <div className="form-group">
                <label className="form-label">Template Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Standard Weekday Routine"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Core sprint work, workout, and reading"
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                />
              </div>

              <div className="tasks-preview-box" style={{ padding: '10px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', maxHeight: '160px', overflowY: 'auto' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  TASKS TO BE SAVED:
                </div>
                {currentTasks.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--accent-red)' }}>
                    No tasks on this date to save!
                  </div>
                ) : (
                  currentTasks.map((t, idx) => (
                    <div key={idx} style={{ fontSize: '12px', padding: '2px 0' }}>
                      • {t.title} <span style={{ color: 'var(--text-muted)' }}>({t.category})</span>
                    </div>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn" onClick={() => setMode('apply')}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || currentTasks.length === 0}
                >
                  {submitting ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          {mode === 'apply' && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!selectedTemplateId || submitting}
              onClick={handleApply}
            >
              {submitting ? 'Applying...' : `Apply to ${targetDate}`}
            </button>
          )}
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
