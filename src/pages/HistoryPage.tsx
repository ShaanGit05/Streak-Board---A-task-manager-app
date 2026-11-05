import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { formatDisplayDate, parseLocalDate } from '../lib/dates';
import { format } from 'date-fns';
import { Coffee, Award, ArrowRight } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { allScores, setSelectedDate, settings } = useData();
  const navigate = useNavigate();

  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Compute available months from allScores
  const monthOptions = useMemo(() => {
    const monthsSet = new Set<string>();
    for (const score of allScores) {
      const d = parseLocalDate(score.score_date);
      monthsSet.add(format(d, 'yyyy-MM'));
    }
    const sorted = Array.from(monthsSet).sort().reverse();
    return sorted.map((key) => {
      const [y, m] = key.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return {
        key,
        label: format(d, 'MMMM yyyy'),
      };
    });
  }, [allScores]);

  // Filter and sort scores
  const filteredScores = useMemo(() => {
    let list = [...allScores];
    if (selectedMonth !== 'all') {
      list = list.filter((s) => s.score_date.startsWith(selectedMonth));
    }
    // Sort descending by date
    list.sort((a, b) => b.score_date.localeCompare(a.score_date));
    return list;
  }, [allScores, selectedMonth]);

  const handleOpenDay = (dateStr: string) => {
    setSelectedDate(dateStr);
    navigate('/');
  };

  return (
    <div className="history-page">
      {/* Header and Filter */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-bright)', margin: 0 }}>
            Activity History
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Review past daily performance, task counts, and streaks
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filter Month:</span>
          <select
            className="form-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: '180px', fontSize: '13px', padding: '6px 10px' }}
          >
            <option value="all">All Months ({allScores.length} days)</option>
            {monthOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* History List */}
      {filteredScores.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '32px' }}>📅</div>
          <div className="empty-state-title">No history records found</div>
          <div className="empty-state-text">
            Start planning tasks or generate demo data in Settings to view past performance.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredScores.map((score) => {
            const isGoalMet =
              !score.is_rest_day &&
              score.points_total > 0 &&
              score.completion_pct >= settings.target_completion_pct;

            return (
              <div
                key={score.score_date}
                className="card"
                style={{
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  backgroundColor: score.is_rest_day ? 'var(--bg-subtle)' : 'var(--bg-card)',
                  borderColor: score.is_rest_day ? 'var(--rest-blue-light)' : 'var(--border-default)',
                }}
              >
                {/* Left: Date & Status Badges */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: score.is_rest_day
                        ? 'var(--rest-blue)'
                        : score.completion_pct >= 75
                        ? 'var(--green-2)'
                        : score.completion_pct >= 25
                        ? 'var(--green-1)'
                        : 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: score.is_rest_day ? 'var(--accent-blue)' : 'var(--text-bright)',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    {score.is_rest_day ? (
                      <Coffee size={18} />
                    ) : (
                      `${score.completion_pct}%`
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                      {formatDisplayDate(score.score_date)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '2px' }}>
                      {score.is_rest_day ? (
                        <span style={{ color: 'var(--accent-blue)' }}>🌿 Rest Day (Streak preserved)</span>
                      ) : (
                        <>
                          <span>{score.points_earned} / {score.points_total} pts earned</span>
                          <span>•</span>
                          <span>{score.tasks_completed} of {score.tasks_total} tasks completed</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Goal Status & Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isGoalMet && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(57, 211, 83, 0.15)',
                        color: 'var(--green-4)',
                        border: '1px solid var(--green-3)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}
                    >
                      <Award size={12} /> Goal Met
                    </span>
                  )}

                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => handleOpenDay(score.score_date)}
                  >
                    <span>View / Edit Day</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
