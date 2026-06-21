import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ─── Templates ─────────────────────────────────────────────────────────────
const CATEGORIES = ['Popular', 'Health', 'Sports', 'Mind', 'Focus'];

const TEMPLATES = {
  Popular: [
    { emoji: '💧', name: 'Drink 8 glasses of water' },
    { emoji: '📚', name: 'Read for 30 minutes' },
    { emoji: '🧘', name: 'Meditate' },
    { emoji: '🚶', name: '10,000 steps' },
    { emoji: '🛌', name: 'Sleep by 10pm' },
    { emoji: '📓', name: 'Journal' },
    { emoji: '💪', name: 'Work out' },
    { emoji: '🥗', name: 'Eat vegetables' },
  ],
  Health: [
    { emoji: '💊', name: 'Take vitamins' },
    { emoji: '🚰', name: 'No sugary drinks' },
    { emoji: '🌿', name: 'No junk food' },
    { emoji: '🧴', name: 'Skincare routine' },
    { emoji: '🦷', name: 'Floss teeth' },
    { emoji: '🛌', name: 'Sleep 8 hours' },
    { emoji: '🌬️', name: 'Deep breathing' },
    { emoji: '🥗', name: 'Eat vegetables' },
  ],
  Sports: [
    { emoji: '🏃', name: 'Morning run' },
    { emoji: '💪', name: 'Work out' },
    { emoji: '🚴', name: 'Cycling' },
    { emoji: '🏊', name: 'Swimming' },
    { emoji: '🤸', name: 'Stretching' },
    { emoji: '⚽', name: 'Sport practice' },
    { emoji: '🎾', name: 'Tennis' },
    { emoji: '🧗', name: 'Rock climbing' },
  ],
  Mind: [
    { emoji: '📓', name: 'Journal' },
    { emoji: '🙏', name: 'Gratitude list' },
    { emoji: '📵', name: 'No social media' },
    { emoji: '🧠', name: 'Learn something new' },
    { emoji: '🎯', name: 'Daily planning' },
    { emoji: '📖', name: 'Read non-fiction' },
    { emoji: '😌', name: 'Digital detox hour' },
    { emoji: '🧘', name: 'Meditation' },
  ],
  Focus: [
    { emoji: '⏰', name: 'Wake up early' },
    { emoji: '📱', name: 'No phone before 9am' },
    { emoji: '✅', name: 'Write a to-do list' },
    { emoji: '💻', name: 'Deep work (1 hour)' },
    { emoji: '🗂️', name: 'Inbox zero' },
    { emoji: '🎧', name: 'Focus music session' },
    { emoji: '📝', name: 'Review yesterday' },
    { emoji: '🚫', name: 'No meetings before noon' },
  ],
};

// ─── Component ─────────────────────────────────────────────────────────────
export default function AddHabit() {
  const { activeChallenge, addHabit, loading } = useApp();
  const navigate = useNavigate();

  const [category, setCategory]     = useState('Popular');
  const [added, setAdded]           = useState(new Set());   // names added this session
  const [adding, setAdding]         = useState(null);        // name currently in flight
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [toast, setToast]           = useState('');

  const toastRef = useRef(null);

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(''), 2200);
  }

  const handleAddTemplate = useCallback(async ({ emoji, name }) => {
    if (!activeChallenge || added.has(name) || adding) return;
    setAdding(name);
    try {
      await addHabit(activeChallenge._id, { name: `${emoji} ${name}` });
      setAdded((prev) => new Set([...prev, name]));
      showToast(`${emoji} added!`);
    } finally {
      setAdding(null);
    }
  }, [activeChallenge, added, adding, addHabit]);

  const handleAddCustom = useCallback(async () => {
    if (!customName.trim() || !activeChallenge || adding) return;
    setAdding('__custom__');
    try {
      await addHabit(activeChallenge._id, { name: customName.trim() });
      setAdded((prev) => new Set([...prev, customName.trim()]));
      showToast('custom habit added! ✓');
      setCustomName('');
      setShowCustom(false);
    } finally {
      setAdding(null);
    }
  }, [customName, activeChallenge, adding, addHabit]);

  if (loading) {
    return <div className="page"><div className="loading-wrap"><div className="spinner" /></div></div>;
  }

  const templates   = TEMPLATES[category];
  const addedCount  = added.size;

  return (
    <div className="page" style={addedCount > 0 ? { paddingBottom: 'calc(136px + var(--sab))' } : undefined}>
      {/* Header */}
      <div className="page-header">
        <div className="page-title">add a habit ✨</div>
        <div className="page-subtitle">
          {activeChallenge ? activeChallenge.name : 'no active challenge'}
        </div>
      </div>

      {/* No active challenge */}
      {!activeChallenge && (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <div className="empty-state-text">
            you need an active challenge first<br />
            create one to start adding habits
          </div>
          <button className="btn btn-primary mt-16" onClick={() => navigate('/create')}>
            create a challenge →
          </button>
        </div>
      )}

      {activeChallenge && (
        <>
          {/* Category chips */}
          <div className="habit-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`habit-category-chip ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template list */}
          <div className="habit-template-list">
            {templates.map(({ emoji, name }) => {
              const isAdded   = added.has(name);
              const isLoading = adding === name;
              return (
                <div key={name} className={`habit-template-item ${isAdded ? 'is-added' : ''}`}>
                  <span className="habit-template-emoji">{emoji}</span>
                  <span className="habit-template-name">{name}</span>
                  <button
                    className={`habit-add-btn ${isAdded ? 'added' : ''}`}
                    onClick={() => handleAddTemplate({ emoji, name })}
                    disabled={isAdded || !!adding}
                    aria-label={isAdded ? `${name} added` : `Add ${name}`}
                  >
                    {isLoading ? '…' : isAdded ? '✓' : '+'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Custom habit */}
          <div className="custom-habit-section">
            {!showCustom ? (
              <button className="habit-template-item custom-habit-toggle" onClick={() => setShowCustom(true)}>
                <span className="habit-template-emoji">✏️</span>
                <span className="habit-template-name" style={{ color: 'var(--muted)' }}>Custom Habit</span>
                <span className="habit-add-btn" aria-hidden="true">+</span>
              </button>
            ) : (
              <div className="custom-habit-form">
                <div className="custom-habit-form-title">custom habit</div>
                <div className="custom-habit-inputs">
                  <input
                    className="focus-input"
                    style={{ fontSize: 14, padding: '11px 14px' }}
                    type="text"
                    placeholder="e.g. practice guitar, drink green tea..."
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                    maxLength={60}
                    autoFocus
                  />
                  <button
                    className="btn btn-primary"
                    style={{ padding: '11px 18px', flexShrink: 0 }}
                    disabled={!customName.trim() || !!adding}
                    onClick={handleAddCustom}
                  >
                    {adding === '__custom__' ? '…' : 'add'}
                  </button>
                </div>
                <button
                  className="btn-give-up"
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  onClick={() => { setShowCustom(false); setCustomName(''); }}
                >
                  cancel
                </button>
              </div>
            )}
          </div>

          {/* Create challenge link */}
          <div style={{ textAlign: 'center', paddingTop: 20 }}>
            <button
              className="btn-give-up"
              style={{ color: 'var(--dimmed)', fontSize: 12 }}
              onClick={() => navigate('/create')}
            >
              create a new challenge →
            </button>
          </div>
        </>
      )}

      {/* Sticky confirmation bar */}
      {addedCount > 0 && (
        <div className="habits-added-bar">
          <span>✓ {addedCount} habit{addedCount !== 1 ? 's' : ''} added</span>
          <button className="habits-added-cta" onClick={() => navigate('/checklist')}>
            see today →
          </button>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}
