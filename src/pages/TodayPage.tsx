import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { TaskModal } from '../components/TaskModal';
import { RecurringTasksModal } from '../components/RecurringTasksModal';
import { TemplateModal } from '../components/TemplateModal';
import type { Task } from '../lib/types';
import { formatDisplayDate, isTodayStr } from '../lib/dates';
import { calculateTaskPoints } from '../lib/scoring';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Copy,
  Calendar,
  RotateCcw,
  Sparkles,
  Coffee,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Award,
} from 'lucide-react';

export const TodayPage: React.FC = () => {
  const {
    selectedDate,
    setSelectedDate,
    goToPrevDay,
    goToNextDay,
    goToToday,
    tasks,
    dailySummary,
    settings,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    toggleRestDay,
    carryOverIncompleteTasks,
    recurringRules,
    createRecurringRule,
    updateRecurringRule,
    deleteRecurringRule,
    templates,
    saveDayAsTemplate,
    applyTemplate,
    deleteTemplate,
    restDaysInCurrentWeek,
  } = useData();

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const isToday = isTodayStr(selectedDate);

  const handleOpenAdd = () => {
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="today-page">
      {/* Top Date Navigation Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={goToPrevDay}
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={goToNextDay}
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button
              type="button"
              className="btn btn-sm"
              onClick={goToToday}
              style={{ color: 'var(--accent-blue)' }}
            >
              Today
            </button>
          )}

          <div style={{ marginLeft: '6px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
              {formatDisplayDate(selectedDate)}
            </h2>
          </div>
        </div>

        {/* Date Picker Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar
              size={14}
              style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }}
            />
            <input
              type="date"
              className="form-input"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(e.target.value);
                }
              }}
              style={{
                paddingLeft: '32px',
                paddingTop: '5px',
                paddingBottom: '5px',
                fontSize: '13px',
                width: '150px',
              }}
              aria-label="Select Date"
            />
          </div>

          {/* Rest Day Button */}
          <button
            type="button"
            className={`btn btn-sm ${dailySummary.is_rest_day ? 'btn-rest active' : 'btn-rest'}`}
            onClick={() => toggleRestDay(selectedDate)}
            title={
              dailySummary.is_rest_day
                ? 'Click to turn off rest day'
                : `Mark as rest day (${restDaysInCurrentWeek}/${settings.max_rest_days_per_week} used this week)`
            }
          >
            <Coffee size={14} />
            <span>
              {dailySummary.is_rest_day ? 'Rest Day Enabled' : 'Mark Rest Day'}
            </span>
          </button>
        </div>
      </div>

      {/* Rest Day Banner if active */}
      {dailySummary.is_rest_day && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#16283b',
            border: '1px solid #388bfd',
            borderRadius: 'var(--radius-md)',
            color: '#79c0ff',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          <Coffee size={18} />
          <div>
            <strong>Rest Day Active:</strong> Your streak is protected! Tasks are optional today and completion won't break your consistency.
          </div>
        </div>
      )}

      {/* Score & Progress Summary Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-bright)' }}>
                {dailySummary.completion_pct}%
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Daily Completion
              </span>

              {dailySummary.goal_met && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'rgba(57, 211, 83, 0.15)',
                    color: 'var(--green-4)',
                    border: '1px solid var(--green-3)',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  <Award size={14} /> Goal Met ({settings.target_completion_pct}% target)
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {dailySummary.points_earned} of {dailySummary.points_total} points earned ·{' '}
              {dailySummary.tasks_completed} of {dailySummary.tasks_total} tasks done
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>EARNED XP</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--green-4)' }}>
                +{dailySummary.points_earned} XP
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PLANNED</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-bright)' }}>
                {dailySummary.points_total} pts
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: '8px',
            backgroundColor: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            marginTop: '14px',
            border: '1px solid var(--border-default)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${dailySummary.completion_pct}%`,
              backgroundColor: dailySummary.goal_met ? 'var(--green-4)' : 'var(--green-3)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Action Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => carryOverIncompleteTasks()}
            title="Copy incomplete tasks from previous day to today"
          >
            <Copy size={15} />
            <span>Carry Over</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => setIsTemplateModalOpen(true)}
          >
            <Sparkles size={15} />
            <span>Templates</span>
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => setIsRecurringModalOpen(true)}
          >
            <RotateCcw size={15} />
            <span>Recurring Rules ({recurringRules.length})</span>
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {tasks.length} task{tasks.length === 1 ? '' : 's'} scheduled
        </div>
      </div>

      {/* Task List */}
      <div className="task-list-container">
        {tasks.length === 0 ? (
          <div className="card empty-state">
            <div style={{ fontSize: '32px' }}>📋</div>
            <div className="empty-state-title">No tasks planned for {selectedDate}</div>
            <div className="empty-state-text">
              Plan your high-impact work, study, and health goals to boost your daily score.
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleOpenAdd}
              >
                <Plus size={16} />
                <span>Add Your First Task</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setIsTemplateModalOpen(true)}
              >
                <Sparkles size={15} />
                <span>Apply a Template</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {tasks.map((task) => {
              const taskPoints = calculateTaskPoints(task.difficulty, task.priority);
              return (
                <div
                  key={task.id}
                  className="card"
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    backgroundColor: task.is_completed ? '#12171d' : 'var(--bg-card)',
                    borderColor: task.is_completed ? 'var(--border-muted)' : 'var(--border-default)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {/* Complete Checkbox */}
                  <button
                    type="button"
                    onClick={() => toggleTask(task)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: task.is_completed ? 'var(--green-4)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px',
                    }}
                    aria-label={task.is_completed ? 'Mark task incomplete' : 'Mark task complete'}
                  >
                    {task.is_completed ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <Circle size={22} />
                    )}
                  </button>

                  {/* Task Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: task.is_completed ? 'var(--text-muted)' : 'var(--text-bright)',
                          textDecoration: task.is_completed ? 'line-through' : 'none',
                        }}
                      >
                        {task.title}
                      </span>
                      <span className={`badge badge-${task.category}`}>{task.category}</span>
                      <span className={`priority-indicator priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      <span
                        className="points-pill"
                        style={{
                          color: task.is_completed ? 'var(--green-4)' : 'var(--text-primary)',
                        }}
                      >
                        {taskPoints} pts
                      </span>
                    </div>

                    {task.description && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                          textDecoration: task.is_completed ? 'line-through' : 'none',
                        }}
                      >
                        {task.description}
                      </div>
                    )}
                  </div>

                  {/* Task Actions */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => handleOpenEdit(task)}
                      title="Edit task"
                      aria-label="Edit task"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteTask(task.id)}
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={async (data) => {
          if (taskToEdit) {
            await updateTask(taskToEdit.id, data);
          } else {
            await createTask(data);
          }
        }}
        taskToEdit={taskToEdit}
        targetDate={selectedDate}
      />

      <RecurringTasksModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        rules={recurringRules}
        onCreateRule={createRecurringRule}
        onDeleteRule={deleteRecurringRule}
        onToggleActive={(id, active) => updateRecurringRule(id, { is_active: active })}
      />

      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        currentTasks={tasks}
        targetDate={selectedDate}
        templates={templates}
        onSaveTemplate={saveDayAsTemplate}
        onApplyTemplate={applyTemplate}
        onDeleteTemplate={deleteTemplate}
      />
    </div>
  );
};
