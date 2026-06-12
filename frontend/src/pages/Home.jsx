import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { resetChallenge } from '../api/client';

function getDayIndex(startDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  return Math.min(Math.max(diff + 1, 1), 30);
}

function getTodayStats(challenge) {
  const today = new Date().toISOString().split('T')[0];
  const dayEntry = challenge.completions?.find((c) => c.date === today);
  const total = challenge.habits?.length || 0;
  const completed = dayEntry ? dayEntry.habits.filter((h) => h.completed).length : 0;
  return { completed, total, pct: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

function calcStreak(challenge) {
  let streak = 0;
  const total = challenge.habits?.length || 0;
  if (total === 0) return 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const entry = challenge.completions?.find((c) => c.date === dateStr);
    const done = entry ? entry.habits.filter((h) => h.completed).length : 0;
    if (done === total) { streak++; } else if (i > 0) { break; }
  }
  return streak;
}

function calcTotalCompleted(challenge) {
  return (challenge.completions || []).reduce(
    (sum, day) => sum + day.habits.filter((h) => h.completed).length,
    0
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'burning midnight oil 🌙';
  if (h < 12) return 'good morning ☀️';
  if (h < 17) return 'good afternoon 👋';
  if (h < 21) return 'good evening 🌆';
  return 'late night grind 🌙';
}

function getMotivation(pct, streak) {
  if (pct === 100) return "you crushed it today 🏆";
  if (streak >= 7)  return `${streak} days strong — don't break it`;
  if (pct >= 50)    return "halfway there, finish strong";
  if (pct > 0)      return "good start, keep going";
  return "let's make today count";
}

export default function Home() {
  const { activeChallenge, loading, error, reload } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting]           = useState(false);

  async function handleReset() {
    setResetting(true);
    try {
      await resetChallenge(activeChallenge._id);
      await reload();
      setShowResetModal(false);
    } catch {
      alert('Failed to reset. Try again.');
    } finally {
      setResetting(false);
    }
  }

  if (loading) {
    return <div className="page"><div className="loading-wrap"><div className="spinner" /></div></div>;
  }

  if (error) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">😵</div>
          <div className="empty-state-text">can't reach the server<br />make sure the backend is running</div>
        </div>
      </div>
    );
  }

  /* ── empty state ── */
  if (!activeChallenge) {
    return (
      <div className="page home-page">
        <div className="home-welcome">
          <div className="home-welcome-greeting">{getGreeting()}</div>
        </div>
        <div className="home-empty-card">
          <div className="home-empty-glyph">🌱</div>
          <div className="home-empty-headline">no active challenge</div>
          <div className="home-empty-sub">
            start a 30-day run and build habits that actually stick.
          </div>
          <button className="home-cta-btn" onClick={() => navigate('/create')}>
            create a challenge →
          </button>
        </div>
      </div>
    );
  }

  /* ── active challenge ── */
  const day          = getDayIndex(activeChallenge.startDate);
  const todayStats   = getTodayStats(activeChallenge);
  const streak       = calcStreak(activeChallenge);
  const totalDone    = calcTotalCompleted(activeChallenge);
  const daysLeft     = 30 - day + 1;
  const today        = new Date().toISOString().split('T')[0];
  const allDoneToday = todayStats.total > 0 && todayStats.completed === todayStats.total;
  const challengePct = Math.round((day / 30) * 100);

  return (
    <div className="page home-page">

      {/* greeting */}
      <div className="home-welcome">
        <div className="home-welcome-greeting">{getGreeting()}</div>
      </div>

      {/* challenge hero card */}
      <div className="home-hero-card">
        <div className="home-hero-glow" />
        <div className="home-hero-top">
          <div className="home-hero-label">active challenge</div>
          <div className="home-hero-day-pill">day {day} of 30</div>
        </div>
        <div className="home-hero-name">{activeChallenge.name}</div>
        <div className="home-hero-motivation">{getMotivation(todayStats.pct, streak)}</div>
        <div className="home-progress-track">
          <div className="home-progress-fill" style={{ width: `${challengePct}%` }} />
        </div>
        <div className="home-progress-meta">
          <span>{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
          <span>{challengePct}% through</span>
        </div>
      </div>

      {/* quick stats */}
      <div className="home-stats-row">
        <div className="home-stat-card">
          <div className="home-stat-emoji">🔥</div>
          <div className="home-stat-value">{streak}</div>
          <div className="home-stat-label">day streak</div>
        </div>
        <div className="home-stat-card home-stat-card--center">
          <div className="home-stat-emoji">✅</div>
          <div className="home-stat-value">{todayStats.pct}%</div>
          <div className="home-stat-label">today</div>
        </div>
        <div className="home-stat-card">
          <div className="home-stat-emoji">⚡</div>
          <div className="home-stat-value">{totalDone}</div>
          <div className="home-stat-label">completed</div>
        </div>
      </div>

      {/* today's goals */}
      <div className="home-section">
        <div className="home-section-header">
          <span className="home-section-title">
            {allDoneToday ? "done for today 🎉" : "what's on today"}
          </span>
          <button className="home-section-link" onClick={() => navigate(`/checklist/${day}`)}>
            see all →
          </button>
        </div>

        {activeChallenge.habits?.length === 0 ? (
          <div className="home-goals-empty">
            no habits yet —{' '}
            <button className="home-inline-link" onClick={() => navigate('/add-habit')}>
              add some
            </button>
          </div>
        ) : (
          <div className="home-goals-card">
            {activeChallenge.habits.slice(0, 6).map((habit) => {
              const dayEntry = activeChallenge.completions?.find((c) => c.date === today);
              const done = dayEntry?.habits.find((h) => h.habitId === habit.id)?.completed || false;
              return (
                <div
                  key={habit.id}
                  className="home-habit-row"
                  onClick={() => navigate(`/checklist/${day}`)}
                >
                  <div className={`home-habit-check ${done ? 'done' : ''}`}>
                    {done && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M1.5 5.5l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className={`home-habit-text ${done ? 'done' : ''}`}>{habit.name}</span>
                  {!done && <span className="home-habit-arrow">›</span>}
                </div>
              );
            })}
            {activeChallenge.habits.length > 6 && (
              <div className="home-goals-more" onClick={() => navigate(`/checklist/${day}`)}>
                +{activeChallenge.habits.length - 6} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="home-cta-wrap">
        <button
          className={`home-cta-btn${allDoneToday ? ' all-done' : ''}`}
          onClick={() => navigate(`/checklist/${day}`)}
        >
          {allDoneToday ? '🏆 all done — view the list' : 'start today →'}
        </button>
      </div>

      {/* reset */}
      <div className="home-danger-row">
        <button className="home-nuke-btn" onClick={() => setShowResetModal(true)} disabled={resetting}>
          reset progress
        </button>
      </div>

      {/* reset modal */}
      {showResetModal && (
        <div className="modal-backdrop" onClick={() => !resetting && setShowResetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">you sure? 🤔</div>
            <div className="modal-desc">this wipes all your check-ins. can't undo.</div>
            <div className="modal-actions">
              <button className="btn btn-ghost" disabled={resetting} onClick={() => setShowResetModal(false)}>
                nah, keep it
              </button>
              <button className="btn btn-danger" disabled={resetting} onClick={handleReset}>
                {resetting ? 'nuking…' : 'yeah, reset'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
