import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import PlantSVG from '../components/PlantSVG';
import { PLANTS, getRarity, rollPlant, getPlant } from '../utils/plants';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

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

function RarityBadge({ rarityKey }) {
  const r = getRarity(rarityKey);
  return (
    <span className={`rarity-badge rarity-${rarityKey}`}>{r.label}</span>
  );
}

export default function CreateChallenge() {
  const { createChallenge } = useApp();
  const navigate = useNavigate();

  const [name,        setName]        = useState('');
  const [startDate,   setStartDate]   = useState(todayStr());
  const [category,    setCategory]    = useState('Popular');
  const [selected,    setSelected]    = useState(new Set());
  const [customs,     setCustoms]     = useState([]);
  const [customDraft, setCustomDraft] = useState('');
  const [showCustom,  setShowCustom]  = useState(false);
  const [plantType,   setPlantType]   = useState('flower');
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState({});

  function toggleTemplate(emoji, habitName) {
    const key = `${emoji} ${habitName}`;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setErrors((e) => ({ ...e, habits: undefined }));
  }

  function addCustom() {
    const val = customDraft.trim();
    if (!val || customs.includes(val)) return;
    setCustoms((prev) => [...prev, val]);
    setCustomDraft('');
    setShowCustom(false);
    setErrors((e) => ({ ...e, habits: undefined }));
  }

  function removeCustom(val) {
    setCustoms((prev) => prev.filter((c) => c !== val));
  }

  const totalHabits = selected.size + customs.length;
  const selectedPlant = getPlant(plantType);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!name.trim())      errs.name      = 'give it a name first';
    if (!startDate)        errs.startDate = 'need a start date';
    if (totalHabits === 0) errs.habits    = 'pick at least one habit';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      const { actualRarity } = rollPlant(selectedPlant);
      const habits = [
        ...Array.from(selected).map((key) => ({ name: key })),
        ...customs.map((n) => ({ name: n })),
      ];
      await createChallenge({ name: name.trim(), startDate, habits, plantType, plantRarity: actualRarity });
      navigate('/');
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  }

  const templates = TEMPLATES[category];

  return (
    <div className="page" style={{ paddingBottom: 48 }}>
      <div className="page-header">
        <div className="page-title">new run ⚡</div>
        <div className="page-subtitle">30 days. let's build something.</div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '0 16px' }}>
        {/* Challenge name */}
        <div className="form-group">
          <label className="form-label">what's this run?</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. morning grind, glow up, deep work..."
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((er) => ({ ...er, name: undefined })); }}
            maxLength={60}
          />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>

        {/* Start date */}
        <div className="form-group">
          <label className="form-label">kicks off</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>30 days from here</div>
        </div>

        {/* Habit picker */}
        <div className="form-group">
          <label className="form-label">
            pick your habits
            {totalHabits > 0 && (
              <span style={{ color: 'var(--green)', fontWeight: 700, marginLeft: 8 }}>
                · {totalHabits} selected
              </span>
            )}
          </label>

          {errors.habits && <div className="form-error" style={{ marginBottom: 10 }}>{errors.habits}</div>}

          <div className="habit-categories" style={{ marginBottom: 12 }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`habit-category-chip ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="habit-template-list">
            {templates.map(({ emoji, name: habitName }) => {
              const key  = `${emoji} ${habitName}`;
              const isOn = selected.has(key);
              return (
                <div
                  key={key}
                  className={`habit-template-item ${isOn ? 'is-selected' : ''}`}
                  onClick={() => toggleTemplate(emoji, habitName)}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="habit-template-emoji">{emoji}</span>
                  <span className="habit-template-name">{habitName}</span>
                  <span className={`habit-add-btn ${isOn ? 'added' : ''}`} aria-hidden="true">
                    {isOn ? '✓' : '+'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="custom-habit-section" style={{ marginTop: 8 }}>
            {customs.map((c) => (
              <div key={c} className="habit-template-item is-selected" style={{ marginBottom: 6 }}>
                <span className="habit-template-emoji">✏️</span>
                <span className="habit-template-name">{c}</span>
                <button
                  type="button"
                  className="habit-add-btn added"
                  onClick={(e) => { e.stopPropagation(); removeCustom(c); }}
                  aria-label={`Remove ${c}`}
                  style={{ fontSize: 16 }}
                >
                  ×
                </button>
              </div>
            ))}

            {!showCustom ? (
              <button
                type="button"
                className="habit-template-item custom-habit-toggle"
                onClick={() => setShowCustom(true)}
                style={{ width: '100%', marginTop: customs.length ? 0 : 2 }}
              >
                <span className="habit-template-emoji">✏️</span>
                <span className="habit-template-name" style={{ color: 'var(--muted)' }}>Custom habit</span>
                <span className="habit-add-btn" aria-hidden="true">+</span>
              </button>
            ) : (
              <div className="custom-habit-form" style={{ marginTop: 6 }}>
                <div className="custom-habit-inputs">
                  <input
                    className="focus-input"
                    style={{ fontSize: 14, padding: '11px 14px' }}
                    type="text"
                    placeholder="e.g. practice guitar, drink green tea..."
                    value={customDraft}
                    onChange={(e) => setCustomDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
                    maxLength={60}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '11px 18px', flexShrink: 0 }}
                    disabled={!customDraft.trim()}
                    onClick={addCustom}
                  >
                    add
                  </button>
                </div>
                <button
                  type="button"
                  className="btn-give-up"
                  style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  onClick={() => { setShowCustom(false); setCustomDraft(''); }}
                >
                  cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Plant selector */}
        <div className="form-group">
          <label className="form-label">choose your plant</label>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
            your companion for the next 30 days
          </div>
          <div className="plant-selector-grid">
            {PLANTS.map((plant) => {
              const rarity   = getRarity(plant.rarity);
              const isChosen = plantType === plant.id;
              return (
                <button
                  key={plant.id}
                  type="button"
                  className={`plant-card${isChosen ? ` selected rarity-${plant.rarity}` : ''}`}
                  onClick={() => setPlantType(plant.id)}
                  style={isChosen ? { borderColor: rarity.border, boxShadow: `0 0 14px ${rarity.glow}` } : undefined}
                >
                  <PlantSVG
                    plantType={plant.id}
                    progress={70}
                    style={{ width: 56, height: 90 }}
                    instanceId={`sel-${plant.id}`}
                  />
                  <div className="plant-card-name">{plant.name}</div>
                  <RarityBadge rarityKey={plant.rarity} />
                  {plant.odds < 1 && (
                    <div className="plant-card-odds">{Math.round(plant.odds * 100)}% chance</div>
                  )}
                </button>
              );
            })}
          </div>
          {selectedPlant.odds < 1 && (
            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              background: 'rgba(245,158,11,.07)',
              border: '1px solid rgba(245,158,11,.22)',
              borderRadius: 10,
              fontSize: 12,
              color: 'var(--muted)',
              lineHeight: 1.5
            }}>
              ⚡ <strong style={{ color: '#F59E0B' }}>{selectedPlant.name}</strong> is rare.{' '}
              you have a <strong style={{ color: '#F59E0B' }}>{Math.round(selectedPlant.odds * 100)}%</strong> chance of getting{' '}
              {getRarity(selectedPlant.rarity).label} — or you'll receive a{' '}
              {getRarity(['common','rare','epic','legendary','mythic'][Math.max(0, ['common','rare','epic','legendary','mythic'].indexOf(selectedPlant.rarity) - 1)]).label} plant instead.
            </div>
          )}
        </div>

        {errors.submit && (
          <div style={{
            background: 'var(--red-light)',
            border: '1px solid rgba(248,113,113,0.2)',
            color: 'var(--red)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            marginBottom: 16,
            fontSize: 13
          }}>
            {errors.submit}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={saving}
          style={{ marginTop: 12, fontSize: 16 }}
        >
          {saving ? 'setting up…' : 'lock it in 🔒'}
        </button>
      </form>
    </div>
  );
}
