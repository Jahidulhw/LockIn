import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getAnalytics } from '../api/client';

function shortDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function CalendarGrid({ dailyHistory, onDayClick }) {
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="cal30-grid">
      {dailyHistory.map((day) => {
        const isFuture = !day.isPast;
        const isToday  = day.date === todayStr;
        const hasHabits = day.total > 0;

        let status = 'none';
        if (!isFuture && hasHabits) {
          if (day.percentage === 100)   status = 'full';
          else if (day.percentage > 0)  status = 'partial';
        }

        const classes = [
          'cal30-cell',
          isFuture ? 'is-future' : 'is-past',
          isToday  ? 'is-today'  : '',
          `done-${status}`,
        ].filter(Boolean).join(' ');

        return (
          <div
            key={day.date}
            className={classes}
            onClick={() => !isFuture && onDayClick(day.day)}
            role={!isFuture ? 'button' : undefined}
            tabIndex={!isFuture ? 0 : -1}
            onKeyDown={(e) => e.key === 'Enter' && !isFuture && onDayClick(day.day)}
            title={isFuture ? 'locked 🔒' : `Day ${day.day} — ${day.percentage}%`}
          >
            <span className="cal30-daynum">{day.day}</span>
            <span className="cal30-date">{shortDate(day.date)}</span>
            {isFuture ? (
              <span className="cal30-lock">🔒</span>
            ) : !hasHabits ? (
              <span className="cal30-pct">—</span>
            ) : (
              <span className="cal30-pct">{day.percentage}%</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function Analytics() {
  const { activeChallenge, loading: ctxLoading } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeChallenge) return;
    setLoading(true);
    setError(null);
    getAnalytics(activeChallenge._id)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [activeChallenge]);

  if (ctxLoading || loading) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">the stats 📊</div></div>
        <div className="loading-wrap"><div className="spinner" /></div>
      </div>
    );
  }

  if (!activeChallenge) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">the stats 📊</div></div>
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">no active run to analyze</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="page-header"><div className="page-title">the stats 📊</div></div>
        <div className="empty-state">
          <div className="empty-state-icon">😵</div>
          <div className="empty-state-text">couldn't load: {error}</div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { dailyHistory, habitStats } = data;

  // habitStats is already sorted high→low by the backend
  const half      = Math.ceil(habitStats.length / 2);
  const crushing  = habitStats.slice(0, half);
  const needsWork = habitStats.slice(half).reverse(); // worst first

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">the stats 📊</div>
        <div className="page-subtitle">{activeChallenge.name}</div>
      </div>

      {/* 30-Day Calendar */}
      <div className="card mt-12">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>30-day calendar</div>
          <div style={{ display: 'flex', gap: 10, fontSize: 10, color: 'var(--muted)', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--green)', display: 'inline-block' }} />
              full
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--amber)', display: 'inline-block' }} />
              partial
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--surface-3)', display: 'inline-block' }} />
              missed
            </span>
          </div>
        </div>

        <CalendarGrid
          dailyHistory={dailyHistory}
          onDayClick={(dayNum) => navigate(`/checklist/${dayNum}`)}
        />

        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--dimmed)', textAlign: 'center' }}>
          tap any past day to open its checklist
        </div>
      </div>

      {/* Crushing it */}
      {crushing.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(52,211,153,0.18)' }}>
          <div className="card-title">crushing it 🔥</div>
          {crushing.map((h) => (
            <div key={h.habitId} className="habit-stat-row">
              <div className="habit-stat-name">{h.name}</div>
              <div className="habit-stat-bar-wrap">
                <div
                  className="habit-stat-bar-fill"
                  style={{ width: `${h.completionRate}%`, background: 'var(--green)' }}
                />
              </div>
              <div className="habit-stat-pct" style={{ color: 'var(--green)' }}>{h.completionRate}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Needs work */}
      {needsWork.length > 0 && (
        <div className="card" style={{ border: '1px solid rgba(248,113,113,0.18)' }}>
          <div className="card-title">needs work 😅</div>
          {needsWork.map((h) => (
            <div key={h.habitId} className="habit-stat-row">
              <div className="habit-stat-name">{h.name}</div>
              <div className="habit-stat-bar-wrap">
                <div
                  className="habit-stat-bar-fill"
                  style={{ width: `${h.completionRate}%`, background: 'var(--red)' }}
                />
              </div>
              <div className="habit-stat-pct" style={{ color: 'var(--red)' }}>{h.completionRate}%</div>
            </div>
          ))}
        </div>
      )}

      {habitStats.length === 0 && (
        <div className="card">
          <div className="text-muted text-center">start checking off habits to see your stats</div>
        </div>
      )}
    </div>
  );
}
