import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Bug fix: toISOString() returns UTC, which produces wrong dates for non-UTC users.
// Use local calendar date so stored completion dates match the user's actual day.
function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDayDate(startDateStr, dayIndex) {
  const d = new Date(startDateStr + 'T00:00:00');
  d.setDate(d.getDate() + dayIndex - 1);
  return toLocalDateStr(d);
}

function getCurrentDay(startDateStr) {
  const start = new Date(startDateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - start) / 86400000);
  return Math.min(Math.max(diff + 1, 1), 30);
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function DailyChecklist() {
  const { day: dayParam } = useParams();
  const navigate = useNavigate();
  const {
    activeChallenge, toggleHabit, deleteHabit, loading,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
  } = useApp();

  const togglingRef = useRef(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [toast, setToast]             = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [addingItem, setAddingItem]   = useState(false);
  const togglingItemRef = useRef(new Set());

  const toastTimer = useRef(null);

  // cleanup timers on unmount
  useEffect(() => () => {
    clearTimeout(toastTimer.current);
  }, []);

  const currentDay = activeChallenge
    ? parseInt(dayParam) || getCurrentDay(activeChallenge.startDate)
    : 1;

  const date = activeChallenge
    ? getDayDate(activeChallenge.startDate, currentDay)
    : '';

  const showToast = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2500);
  };

  const goToDay = (d) => {
    if (d < 1 || d > 30) return;
    navigate(`/checklist/${d}`, { replace: true });
  };

  const handleToggle = useCallback(
    async (habitId) => {
      if (!activeChallenge || togglingRef.current.has(habitId)) return;
      togglingRef.current.add(habitId);
      try {
        await toggleHabit(activeChallenge._id, habitId, date);
      } catch (err) {
        console.error('Toggle failed', err);
      } finally {
        togglingRef.current.delete(habitId);
      }
    },
    [activeChallenge, date, toggleHabit]
  );

  const handleDelete = useCallback(async () => {
    if (!activeChallenge || !confirmDelete || deleting) return;
    setDeleting(true);
    try {
      await deleteHabit(activeChallenge._id, confirmDelete);
      setConfirmDelete(null);
      showToast('habit gone ✓');
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleting(false);
    }
  }, [activeChallenge, confirmDelete, deleteHabit, deleting]);

  const handleAddItem = useCallback(async () => {
    const text = newItemText.trim();
    if (!text || !activeChallenge || addingItem) return;
    setAddingItem(true);
    try {
      await addChecklistItem(activeChallenge._id, text);
      setNewItemText('');
    } catch (err) {
      console.error('Add checklist item failed', err);
    } finally {
      setAddingItem(false);
    }
  }, [activeChallenge, newItemText, addingItem, addChecklistItem]);

  const handleToggleItem = useCallback(async (itemId) => {
    if (!activeChallenge || togglingItemRef.current.has(itemId)) return;
    togglingItemRef.current.add(itemId);
    try {
      await toggleChecklistItem(activeChallenge._id, itemId);
    } catch (err) {
      console.error('Toggle checklist item failed', err);
    } finally {
      togglingItemRef.current.delete(itemId);
    }
  }, [activeChallenge, toggleChecklistItem]);

  const handleDeleteItem = useCallback(async (itemId) => {
    if (!activeChallenge) return;
    try {
      await deleteChecklistItem(activeChallenge._id, itemId);
    } catch (err) {
      console.error('Delete checklist item failed', err);
    }
  }, [activeChallenge, deleteChecklistItem]);

  if (loading) {
    return <div className="page"><div className="loading-wrap"><div className="spinner" /></div></div>;
  }

  if (!activeChallenge) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-text">no active run<br />pick one in Runs</div>
        </div>
      </div>
    );
  }

  const todayDay    = getCurrentDay(activeChallenge.startDate);
  const dayEntry    = activeChallenge.completions?.find((c) => c.date === date);
  const habits      = activeChallenge.habits || [];
  const checklist   = activeChallenge.checklist || [];
  const completedCount = dayEntry ? dayEntry.habits.filter((h) => h.completed).length : 0;
  const totalCount  = habits.length;
  const pct         = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isToday     = currentDay === todayDay;

  const isHabitDone = (habitId) =>
    dayEntry?.habits.find((h) => h.habitId === habitId)?.completed || false;

  const habitToDelete = habits.find((h) => h.id === confirmDelete);

  return (
    <div className="page">
      {/* Day Navigator */}
      <div className="day-nav">
        <button className="arrow-btn" onClick={() => goToDay(currentDay - 1)} disabled={currentDay <= 1} aria-label="Previous day">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <div className="day-nav-center">
          <div className="day-label">
            day {currentDay}
            {isToday && <span style={{ fontSize: 13, color: 'var(--blue)', marginLeft: 6, fontWeight: 600 }}>· today</span>}
          </div>
          <div className="day-date">{formatDate(date)}</div>
        </div>

        {/* Bug fix: also disable when already on today — can't navigate to future days */}
        <button className="arrow-btn" onClick={() => goToDay(currentDay + 1)} disabled={currentDay >= 30 || currentDay >= todayDay} aria-label="Next day">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M8 4l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="card mt-12">
        <div className="progress-label">
          <span className="progress-count">{completedCount}/{totalCount} done</span>
          <span className="progress-pct">{pct}%</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Habit List */}
      <div className="card">
        {habits.length === 0 && (
          <div className="empty-state" style={{ padding: '28px 0' }}>
            <div className="empty-state-icon">🎯</div>
            <div className="empty-state-text">no habits yet — add some!</div>
          </div>
        )}
        {habits.map((habit) => {
          const done = isHabitDone(habit.id);
          return (
            <div
              key={habit.id}
              className="habit-item"
              onClick={() => handleToggle(habit.id)}
              role="checkbox"
              aria-checked={done}
              tabIndex={0}
              onKeyDown={(e) => e.key === ' ' && handleToggle(habit.id)}
            >
              <div className={`habit-checkbox ${done ? 'checked' : ''}`}>
                {done && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className={`habit-name ${done ? 'done' : ''}`}>{habit.name}</span>
              {habit.target && habit.target !== true && (
                <span className="habit-target">{habit.target}{habit.unit ? ` ${habit.unit}` : ''}</span>
              )}
              <button
                className="habit-delete-btn"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(habit.id); }}
                aria-label={`Delete ${habit.name}`}
                tabIndex={-1}
              >
                <TrashIcon />
              </button>
            </div>
          );
        })}
      </div>

      {/* Checklist */}
      <div className="card">
        <div className="card-title">checklist</div>

        {checklist.length === 0 && (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-text">no items yet — add one below</div>
          </div>
        )}

        {checklist.map((item) => (
          <div
            key={item.id}
            className="habit-item"
            onClick={() => handleToggleItem(item.id)}
            role="checkbox"
            aria-checked={item.done}
            tabIndex={0}
            onKeyDown={(e) => e.key === ' ' && handleToggleItem(item.id)}
          >
            <div className={`habit-checkbox ${item.done ? 'checked' : ''}`}>
              {item.done && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span className={`habit-name ${item.done ? 'done' : ''}`}>{item.text}</span>
            <button
              className="habit-delete-btn"
              onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
              aria-label={`Delete ${item.text}`}
              tabIndex={-1}
            >
              <TrashIcon />
            </button>
          </div>
        ))}

        <div className="checklist-add-row">
          <input
            className="focus-input"
            style={{ fontSize: 14, padding: '11px 14px' }}
            type="text"
            placeholder="add an item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            maxLength={120}
          />
          <button
            className="btn btn-primary btn-sm"
            style={{ flexShrink: 0 }}
            disabled={!newItemText.trim() || addingItem}
            onClick={handleAddItem}
          >
            {addingItem ? '…' : 'add'}
          </button>
        </div>
      </div>

      {/* Completion celebration */}
      {completedCount === totalCount && totalCount > 0 && (
        <div className="card" style={{
          textAlign: 'center',
          padding: '22px 16px',
          border: '1px solid rgba(52,211,153,0.25)',
          background: 'rgba(52,211,153,0.06)'
        }}>
          <div style={{ fontSize: 36 }}>🎉</div>
          <div style={{ fontWeight: 800, fontSize: 17, marginTop: 8, letterSpacing: '-.02em' }}>
            day {currentDay} complete!
          </div>
          <div className="text-muted mt-4">you crushed it 🔥</div>
        </div>
      )}

      {/* Delete habit modal */}
      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => !deleting && setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">delete this habit?</div>
            <div className="modal-desc">"{habitToDelete?.name}" is gone for good. no undo.</div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>nope</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'yeeting…' : 'yeet it 🗑️'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
