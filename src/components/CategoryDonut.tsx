import React, { useMemo } from 'react';
import type { Task, TaskCategory } from '../lib/types';
import { calculateTaskPoints } from '../lib/scoring';
import { getTodayDateStr, addDaysToDateStr } from '../lib/dates';

interface CategoryDonutProps {
  tasks: Task[];
}

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  Study: '#58a6ff',
  Work: '#bc8cff',
  Health: '#3fb950',
  Personal: '#d29922',
  Other: '#8b949e',
};

export const CategoryDonut: React.FC<CategoryDonutProps> = ({ tasks }) => {
  const todayStr = getTodayDateStr();
  const thirtyDaysAgoStr = addDaysToDateStr(todayStr, -30);

  const { stats, totalPoints, totalTasks } = useMemo(() => {
    // Filter completed tasks in the last 30 days
    const recentCompletedTasks = tasks.filter(
      (t) => t.is_completed && t.task_date >= thirtyDaysAgoStr && t.task_date <= todayStr
    );

    const pointsByCategory: Record<TaskCategory, number> = {
      Study: 0,
      Work: 0,
      Health: 0,
      Personal: 0,
      Other: 0,
    };

    const countByCategory: Record<TaskCategory, number> = {
      Study: 0,
      Work: 0,
      Health: 0,
      Personal: 0,
      Other: 0,
    };

    let total = 0;
    for (const t of recentCompletedTasks) {
      const pts = calculateTaskPoints(t.difficulty, t.priority);
      pointsByCategory[t.category] += pts;
      countByCategory[t.category] += 1;
      total += pts;
    }

    const categories: TaskCategory[] = ['Study', 'Work', 'Health', 'Personal', 'Other'];
    const list = categories.map((cat) => {
      const pts = Number(pointsByCategory[cat].toFixed(1));
      const pct = total > 0 ? Math.round((pts / total) * 100) : 0;
      return {
        category: cat,
        points: pts,
        count: countByCategory[cat],
        pct,
        color: CATEGORY_COLORS[cat],
      };
    });

    return {
      stats: list,
      totalPoints: Number(total.toFixed(1)),
      totalTasks: recentCompletedTasks.length,
    };
  }, [tasks, thirtyDaysAgoStr, todayStr]);

  // SVG Donut calculation
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePct = 0;

  return (
    <div className="card category-breakdown-card">
      <div className="card-header">
        <h3 className="card-title">Category Breakdown (Last 30 Days)</h3>
        <span className="text-muted" style={{ fontSize: '12px' }}>
          {totalTasks} tasks completed · {totalPoints} pts
        </span>
      </div>

      <div className="category-donut-container">
        {/* Pure SVG Donut */}
        <div className="donut-chart-wrapper">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#21262d"
              strokeWidth={strokeWidth}
            />

            {totalPoints > 0 ? (
              stats.map((s) => {
                if (s.points === 0) return null;
                const dashArray = (s.pct / 100) * circumference;
                const dashOffset = -((cumulativePct / 100) * circumference);
                cumulativePct += s.pct;

                return (
                  <circle
                    key={s.category}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={s.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${dashArray} ${circumference}`}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dasharray 0.3s ease' }}
                  />
                );
              })
            ) : null}

            {/* Center Label */}
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              className="donut-center-pts"
              dominantBaseline="middle"
            >
              {totalPoints}
            </text>
            <text
              x="50%"
              y="62%"
              textAnchor="middle"
              className="donut-center-sub"
              dominantBaseline="middle"
            >
              XP Points
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="category-legend-list">
          {stats.map((s) => (
            <div key={s.category} className="category-legend-item">
              <div className="category-legend-left">
                <span
                  className="category-color-dot"
                  style={{ backgroundColor: s.color }}
                />
                <span className="category-name">{s.category}</span>
              </div>
              <div className="category-legend-right">
                <span className="category-points">{s.points} pts</span>
                <span className="category-pct">({s.pct}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
