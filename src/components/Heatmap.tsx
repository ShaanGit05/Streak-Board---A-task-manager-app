import React, { useState, useMemo } from 'react';
import type { DailyScore } from '../lib/types';
import {
  parseLocalDate,
  formatLocalDate,
  formatDisplayDate,
} from '../lib/dates';
import {
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  getDay,
  format,
} from 'date-fns';

interface HeatmapProps {
  dailyScores: DailyScore[];
  targetGoalPct?: number;
  onSelectDate: (dateStr: string) => void;
  availableYears?: number[];
}

interface CellData {
  dateStr: string;
  score?: DailyScore;
  colIndex: number;
  rowIndex: number;
  monthName?: string;
}

export const Heatmap: React.FC<HeatmapProps> = ({
  dailyScores,
  targetGoalPct = 70,
  onSelectDate,
  availableYears,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data?: CellData;
  }>({
    visible: false,
    x: 0,
    y: 0,
  });

  // Map scores by score_date
  const scoreMap = useMemo(() => {
    const map = new Map<string, DailyScore>();
    for (const s of dailyScores) {
      map.set(s.score_date, s);
    }
    return map;
  }, [dailyScores]);

  // Compute years options
  const years = useMemo(() => {
    if (availableYears && availableYears.length > 0) return availableYears;
    const scoreYears = dailyScores.map((s) => parseLocalDate(s.score_date).getFullYear());
    const unique = Array.from(new Set([currentYear, ...scoreYears])).sort((a, b) => b - a);
    return unique;
  }, [dailyScores, availableYears, currentYear]);

  // Generate grid for selected year
  const { cells, monthLabels, activeDaysCount } = useMemo(() => {
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

    let activeCount = 0;
    const cellList: CellData[] = [];
    const months: { label: string; colIndex: number }[] = [];
    let lastMonth = -1;

    // Start offset: day of week for Jan 1 (0=Sun, 6=Sat)
    const firstDayOfWeek = getDay(yearStart);

    allDays.forEach((day, index) => {
      const dateStr = formatLocalDate(day);
      const score = scoreMap.get(dateStr);
      const dayOfWeek = getDay(day); // 0=Sun ... 6=Sat

      // Total days elapsed since beginning of grid week
      const totalGridDays = index + firstDayOfWeek;
      const colIndex = Math.floor(totalGridDays / 7);
      const rowIndex = dayOfWeek;

      const monthIndex = day.getMonth();
      if (monthIndex !== lastMonth) {
        months.push({
          label: format(day, 'MMM'),
          colIndex,
        });
        lastMonth = monthIndex;
      }

      if (score && (score.points_earned > 0 || score.is_rest_day)) {
        activeCount++;
      }

      cellList.push({
        dateStr,
        score,
        colIndex,
        rowIndex,
      });
    });

    return {
      cells: cellList,
      monthLabels: months,
      activeDaysCount: activeCount,
    };
  }, [selectedYear, scoreMap]);

  // Color selection based on % and rest day
  const getCellColor = (score?: DailyScore) => {
    if (!score) return '#161b22';
    if (score.is_rest_day) return '#204068'; // Blue-gray for rest day
    if (score.points_total === 0 || score.completion_pct === 0) return '#161b22';
    if (score.completion_pct <= 25) return '#0e4429';
    if (score.completion_pct <= 50) return '#006d32';
    if (score.completion_pct <= 75) return '#26a641';
    return '#39d353';
  };

  const cellSize = 11;
  const cellGap = 3;
  const leftPadding = 32;
  const topPadding = 24;

  const width = leftPadding + 54 * (cellSize + cellGap);
  const height = topPadding + 7 * (cellSize + cellGap) + 10;

  const handleMouseEnter = (cell: CellData, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      data: cell,
    });
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="heatmap-container card">
      {/* Heatmap Header */}
      <div className="heatmap-header">
        <div className="heatmap-title-group">
          <h3 className="heatmap-title">Contribution Activity</h3>
          <span className="heatmap-subtitle">
            <strong>{activeDaysCount}</strong> active days in {selectedYear}
          </span>
        </div>

        <div className="heatmap-controls">
          <select
            className="form-select year-selector"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            aria-label="Select year"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SVG Heatmap */}
      <div className="heatmap-svg-scroll">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="heatmap-svg"
          style={{ width: '100%', height: 'auto', minWidth: '700px' }}
        >
          {/* Day of Week Labels (Mon=Row 1, Wed=Row 3, Fri=Row 5) */}
          <text x={0} y={topPadding + 1 * (cellSize + cellGap) + 9} className="heatmap-axis-label">
            Mon
          </text>
          <text x={0} y={topPadding + 3 * (cellSize + cellGap) + 9} className="heatmap-axis-label">
            Wed
          </text>
          <text x={0} y={topPadding + 5 * (cellSize + cellGap) + 9} className="heatmap-axis-label">
            Fri
          </text>

          {/* Month Labels */}
          {monthLabels.map((m, idx) => (
            <text
              key={idx}
              x={leftPadding + m.colIndex * (cellSize + cellGap)}
              y={topPadding - 8}
              className="heatmap-month-label"
            >
              {m.label}
            </text>
          ))}

          {/* Grid Cells */}
          {cells.map((cell) => {
            const x = leftPadding + cell.colIndex * (cellSize + cellGap);
            const y = topPadding + cell.rowIndex * (cellSize + cellGap);
            const fill = getCellColor(cell.score);
            const isRest = cell.score?.is_rest_day;

            return (
              <rect
                key={cell.dateStr}
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                rx={2}
                ry={2}
                fill={fill}
                stroke={isRest ? '#58a6ff' : '#30363d'}
                strokeWidth={isRest ? 1.5 : 0.5}
                className="heatmap-cell"
                onClick={() => onSelectDate(cell.dateStr)}
                onMouseEnter={(e) => handleMouseEnter(cell, e)}
                onMouseLeave={handleMouseLeave}
              />
            );
          })}
        </svg>
      </div>

      {/* Footer & Legend */}
      <div className="heatmap-footer">
        <div className="heatmap-legend">
          <span className="legend-label">Less</span>
          <div className="legend-cell" style={{ backgroundColor: '#161b22' }} />
          <div className="legend-cell" style={{ backgroundColor: '#0e4429' }} />
          <div className="legend-cell" style={{ backgroundColor: '#006d32' }} />
          <div className="legend-cell" style={{ backgroundColor: '#26a641' }} />
          <div className="legend-cell" style={{ backgroundColor: '#39d353' }} />
          <span className="legend-label">More</span>

          <span className="legend-divider">|</span>
          <div
            className="legend-cell"
            style={{ backgroundColor: '#204068', border: '1px solid #58a6ff' }}
          />
          <span className="legend-label">Rest Day</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {tooltip.visible && tooltip.data && (
        <div
          className="heatmap-tooltip"
          style={{
            position: 'fixed',
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <div className="tooltip-title">
            {formatDisplayDate(tooltip.data.dateStr)}
          </div>
          {tooltip.data.score ? (
            tooltip.data.score.is_rest_day ? (
              <div className="tooltip-badge-rest">🌿 Rest Day (Streak preserved)</div>
            ) : (
              <>
                <div className="tooltip-stat">
                  <strong>{tooltip.data.score.completion_pct}%</strong> completion,{' '}
                  <strong>{tooltip.data.score.points_earned}</strong> pts
                </div>
                <div className="tooltip-detail">
                  {tooltip.data.score.tasks_completed} of {tooltip.data.score.tasks_total} tasks done
                </div>
                <div
                  className={`tooltip-goal ${
                    tooltip.data.score.completion_pct >= targetGoalPct
                      ? 'goal-met'
                      : 'goal-missed'
                  }`}
                >
                  {tooltip.data.score.completion_pct >= targetGoalPct
                    ? `🎯 Goal met (≥${targetGoalPct}%)`
                    : `Goal missed (<${targetGoalPct}%)`}
                </div>
              </>
            )
          ) : (
            <div className="tooltip-empty">No tasks planned on this day</div>
          )}
          <div className="tooltip-hint">Click square to open day</div>
        </div>
      )}
    </div>
  );
};
