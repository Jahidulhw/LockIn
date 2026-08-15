import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function getDaysRemaining(startDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 29);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const remaining = Math.ceil((end - today) / 86400000);
  return Math.max(0, remaining);
}

function getCurrentDay(startDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  return Math.min(Math.max(diff + 1, 1), 30);
}

// Bug fix: toISOString() returns UTC date, which is wrong for non-UTC users.
// Use local calendar date instead.
function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getOverallPct(challenge) {
  const day = getCurrentDay(challenge.startDate);
  let total = 0, done = 0;
  for (let i = 0; i < day; i++) {
    const d = new Date(challenge.startDate + 'T00:00:00');
    d.setDate(d.getDate() + i);
    const dateStr = toLocalDateStr(d);
    const entry = challenge.completions?.find((c) => c.date === dateStr);
    total += challenge.habits?.length || 0;
    done += entry ? entry.habits.filter((h) => h.completed).length : 0;
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Challenges() {
  const { challenges, activeChallenge, setActiveChallenge, deleteChallenge, loading } = useApp();
  const navigate = useNavigate();

  const [confirmDelete, setConfirmDelete] = useState(null); // challenge _id
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  const handleDelete = useCallback(async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteChallenge(confirmDelete);
      setConfirmDelete(null);
      showToast('run deleted ✓');
    } catch (err) {
      console.error('Delete failed', err);
      // Bug fix: previously the modal stayed open with no feedback on failure
      showToast('delete failed — try again');
    } finally {
      setDeleting(false);
    }
  }, [confirmDelete, deleteChallenge, deleting]);

  if (loading) {
    return (
      <div className="page">
        <div className="loading-wrap"><div className="spinner" /></div>
      </div>
    );
  }

  const challengeToDelete = challenges.find((c) => c._id === confirmDelete);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">your runs</div>
        <div className="page-subtitle">{challenges.length} challenge{challenges.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="section-pad" />

      {challenges.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-text">nothing yet<br />hit + to start a run</div>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/create')}>
            start one →
          </button>
        </div>
      ) : (
        challenges.map((challenge) => {
          const isActive = activeChallenge?._id === challenge._id;
          const day = getCurrentDay(challenge.startDate);
          const daysRemaining = getDaysRemaining(challenge.startDate);
          const pct = getOverallPct(challenge);

          return (
            <div
              key={challenge._id}
              className={`challenge-card ${isActive ? 'active-card' : ''}`}
              onClick={() => {
                setActiveChallenge(challenge);
                navigate('/');
              }}
            >
              <div className="challenge-card-header">
                <div className="challenge-card-name">{challenge.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {isActive && <span className="badge badge-active">active ✓</span>}
                  <button
                    className="card-delete-btn"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(challenge._id); }}
                    aria-label={`Delete ${challenge.name}`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              <div className="challenge-meta">
                <div className="meta-item">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  started {new Date(challenge.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="meta-item">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M8 4.5V8l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  day {day} · {daysRemaining}d left
                </div>
                <div className="meta-item">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {challenge.habits?.length || 0} habits
                </div>
              </div>

              <div className="progress-label">
                <span className="progress-count">overall</span>
                <span className="progress-pct">{pct}%</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
              </div>

              {!isActive && (
                <div style={{ marginTop: 14 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveChallenge(challenge);
                    }}
                  >
                    make active
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">delete this challenge?</div>
            <div className="modal-desc">
              "{challengeToDelete?.name}" and all its data are gone for good. no undo.
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
              >
                nope
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'deleting…' : 'delete it'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
