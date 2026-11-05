import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Coffee,
  CheckCircle2,
} from 'lucide-react';
import { parseLocalDate, formatLocalDate, formatDisplayDate, getTodayDateStr } from '../lib/dates';
import type { DailyScore } from '../lib/types';

interface GlassDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  scores?: DailyScore[];
  targetGoalPct?: number;
  label?: string;
  className?: string;
  align?: 'left' | 'right';
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const GlassDatePicker: React.FC<GlassDatePickerProps> = ({
  value,
  onChange,
  scores = [],
  targetGoalPct = 70,
  label,
  className = '',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse currently selected date
  const selectedDate = useMemo(() => {
    try {
      return parseLocalDate(value);
    } catch {
      return new Date();
    }
  }, [value]);

  // Current viewed month in the calendar
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

  // Sync viewed month when selected value changes
  useEffect(() => {
    setViewDate(selectedDate);
  }, [value, selectedDate]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Pre-index scores by date for rapid lookup
  const scoresByDate = useMemo(() => {
    const map = new Map<string, DailyScore>();
    for (const s of scores) {
      map.set(s.score_date, s);
    }
    return map;
  }, [scores]);

  // Generate days grid for viewDate
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [viewDate]);

  const todayStr = getTodayDateStr();
  const isSelectedToday = value === todayStr;

  const handleSelectDay = (day: Date) => {
    const dateStr = formatLocalDate(day);
    onChange(dateStr);
    setIsOpen(false);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate((prev) => addMonths(prev, 1));
  };

  const handleGoToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    setViewDate(today);
    onChange(getTodayDateStr());
    setIsOpen(false);
  };

  // Human friendly label
  const formattedDisplay = useMemo(() => {
    try {
      return format(selectedDate, 'MMM d, yyyy');
    } catch {
      return value;
    }
  }, [selectedDate, value]);

  const selectedScore = scoresByDate.get(value);

  return (
    <div className={`glass-datepicker-wrapper ${isOpen ? 'is-open' : ''} ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        className={`glass-datepicker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Choose date"
      >
        <div className="glass-datepicker-trigger-icon">
          <CalendarIcon size={16} />
        </div>

        <div className="glass-datepicker-trigger-text">
          {label && <span className="glass-datepicker-label">{label}</span>}
          <span className="glass-datepicker-date">{formattedDisplay}</span>
        </div>

        {/* Status Indicators on Trigger */}
        {selectedScore && (
          <div className="glass-datepicker-badge-indicator">
            {selectedScore.is_rest_day ? (
              <span className="mini-badge-dot rest" title="Rest Day">
                <Coffee size={10} />
              </span>
            ) : selectedScore.completion_pct >= targetGoalPct ? (
              <span className="mini-badge-dot success" title="Goal Met">
                <CheckCircle2 size={10} />
              </span>
            ) : selectedScore.tasks_total > 0 ? (
              <span className="mini-badge-dot active" title="Tasks Planned" />
            ) : null}
          </div>
        )}

        {isSelectedToday && (
          <span className="glass-datepicker-today-tag">Today</span>
        )}

        <ChevronDown
          size={14}
          className={`glass-datepicker-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Glassmorphic Dropdown Calendar Popup */}
      {isOpen && (
        <div className={`glass-datepicker-dropdown align-${align}`} role="dialog" aria-modal="true">
          {/* Header */}
          <div className="glass-calendar-header">
            <div className="glass-calendar-title-group">
              <span className="glass-calendar-month">
                {format(viewDate, 'MMMM')}
              </span>
              <span className="glass-calendar-year">
                {format(viewDate, 'yyyy')}
              </span>
            </div>

            <div className="glass-calendar-nav">
              <button
                type="button"
                className="glass-nav-btn"
                onClick={handlePrevMonth}
                aria-label="Previous month"
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="glass-nav-btn"
                onClick={handleNextMonth}
                aria-label="Next month"
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="glass-calendar-weekdays">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="glass-weekday-cell">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="glass-calendar-grid">
            {calendarDays.map((day) => {
              const dayStr = formatLocalDate(day);
              const isCurrentMonth = isSameMonth(day, viewDate);
              const isSelected = dayStr === value;
              const isToday = dayStr === todayStr;
              const score = scoresByDate.get(dayStr);

              return (
                <button
                  key={dayStr}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`glass-day-cell ${
                    !isCurrentMonth ? 'outside-month' : ''
                  } ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  aria-label={`${format(day, 'MMMM d, yyyy')}${
                    isSelected ? ' (Selected)' : ''
                  }`}
                  aria-pressed={isSelected}
                >
                  <span className="glass-day-number">{format(day, 'd')}</span>

                  {/* Activity Indicator Dots */}
                  <span className="glass-day-dots">
                    {score?.is_rest_day ? (
                      <span className="day-dot rest-dot" title="Rest Day" />
                    ) : score && score.completion_pct >= targetGoalPct ? (
                      <span className="day-dot goal-dot" title="Goal Met" />
                    ) : score && score.tasks_total > 0 ? (
                      <span className="day-dot task-dot" title="Tasks" />
                    ) : isToday ? (
                      <span className="day-dot today-dot" title="Today" />
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Calendar Footer Bar */}
          <div className="glass-calendar-footer">
            <button
              type="button"
              className="glass-quick-today-btn"
              onClick={handleGoToday}
            >
              <Sparkles size={12} />
              <span>Jump to Today</span>
            </button>

            <span className="glass-calendar-hint">
              {formatDisplayDate(value)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
