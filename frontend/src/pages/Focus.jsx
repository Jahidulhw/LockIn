import { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import PlantSVG from '../components/PlantSVG';
import { getPlant, getRarity } from '../utils/plants';

// ─── quick preset options ──────────────────────────────────────────────────
const QUICK_PRESETS = [
  { label: '30 min', s: 1800 },
  { label: '1 hr',   s: 3600 },
  { label: '2 hr',   s: 7200 },
];

// parse "45 min", "1.5 hrs", "90", "2h", "45m", etc. → seconds (or null)
function parseCustomTime(raw) {
  const s = raw.trim().toLowerCase();
  if (!s) return null;

  // "1.5 hr" / "2 hrs" / "1h"
  const hMatch = s.match(/^(\d+\.?\d*)\s*h(r|rs|our|ours?)?$/);
  if (hMatch) return Math.round(parseFloat(hMatch[1]) * 3600);

  // "45 min" / "90 mins" / "45m"
  const mMatch = s.match(/^(\d+\.?\d*)\s*m(in|ins|inute|inutes?)?$/);
  if (mMatch) return Math.round(parseFloat(mMatch[1]) * 60);

  // bare number → minutes
  const nMatch = s.match(/^(\d+\.?\d*)$/);
  if (nMatch) return Math.round(parseFloat(nMatch[1]) * 60);

  return null;
}

// ─── plant growth stages ───────────────────────────────────────────────────
const STAGES = [
  { min: 0,  label: '🌰 seed',         msg: 'it begins...' },
  { min: 15, label: '🌱 sprout',        msg: "breaking through!" },
  { min: 35, label: '🌿 growing',       msg: 'keep it up 💪' },
  { min: 55, label: '🪴 young plant',   msg: 'looking good!' },
  { min: 75, label: '🌸 almost there',  msg: 'so close!' },
  { min: 95, label: '🌺 blooming',      msg: 'wow wow wow' },
];

function getStage(progress) {
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (progress >= STAGES[i].min) return STAGES[i];
  }
  return STAGES[0];
}

// ─── formatting helpers ────────────────────────────────────────────────────
function fmtCountdown(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function fmtGoal(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── ding sound (C major chord) ────────────────────────────────────────────
function playDing() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [[523.25, 0], [659.25, 0.18], [783.99, 0.36]].forEach(([freq, t]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.22, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 2.2);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 2.5);
    });
  } catch {}
}

// ─── Focus timer plant (flower variant, tied to timer progress) ───────────
function FocusPlantSVG({ progress, style }) {
  const p = progress;
  const show = (t, r = 15) => Math.min(1, Math.max(0, (p - t) / r));

  const seedOp   = Math.max(0, 1 - p / 12);
  const stemProg = show(5, 50);
  const stemTopY = 253 - 161 * stemProg;
  const leaf1    = show(20, 14);
  const leaf2    = show(40, 14);
  const leaf3    = show(58, 12);
  const budOp    = show(74, 10);
  const petalOp  = show(84, 15);
  const glowOp   = show(95, 5);

  return (
    <svg
      viewBox="0 0 200 320"
      style={{ display: 'block', ...style }}
      aria-label="growing focus plant"
    >
      {/* ── Pot ── */}
      <path d="M 70,258 L 65,308 L 135,308 L 130,258 Z" fill="#B45309" />
      <rect x="62" y="248" width="76" height="12" rx="4" fill="#D97706" />
      <rect x="66" y="276" width="68" height="5" rx="2" fill="#92400E" />

      {/* ── Soil ── */}
      <ellipse cx="100" cy="256" rx="34" ry="8" fill="#2D1B10" />
      <ellipse cx="87"  cy="254" rx="5"  ry="2" fill="#1A0D08" opacity="0.7" />
      <ellipse cx="113" cy="255" rx="4"  ry="1.5" fill="#1A0D08" opacity="0.5" />

      {/* ── Seed ── */}
      <ellipse cx="100" cy="252" rx="9"  ry="5.5" fill="#78350F" opacity={seedOp} />
      <ellipse cx="98"  cy="250" rx="4"  ry="2.5" fill="#92400E" opacity={seedOp * 0.7} />

      {/* ── Stem clip ── */}
      <defs>
        <clipPath id="stc">
          <rect x="72" y={stemTopY} width="56" height={253 - stemTopY + 10} />
        </clipPath>
      </defs>

      {/* Stem body */}
      <path
        d="M 100,253 C 99,228 101,208 100,188 C 99,165 101,148 100,128 C 99,112 101,102 100,92"
        stroke="#16A34A"
        strokeWidth="5.5"
        fill="none"
        strokeLinecap="round"
        clipPath="url(#stc)"
      />
      {/* Stem highlight */}
      <path
        d="M 103,250 C 102,225 104,205 103,185 C 102,162 104,145 103,125 C 102,109 104,99 103,89"
        stroke="#4ADE80"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        opacity={stemProg * 0.55}
        clipPath="url(#stc)"
      />

      {/* ── Leaf pair 1 (y=210) ── */}
      <g style={{
        opacity: leaf1,
        transform: `scale(${0.35 + 0.65 * leaf1})`,
        transformOrigin: '100px 210px',
        transition: 'opacity .7s, transform .7s',
      }}>
        <path d="M 100,210 C 110,200 128,188 130,198 C 132,208 118,216 100,210 Z" fill="#16A34A" />
        <path d="M 100,210 C 90,200 72,188 70,198 C 68,208 82,216 100,210 Z"    fill="#15803D" />
        <line x1="100" y1="210" x2="122" y2="197" stroke="#14532D" strokeWidth="0.9" opacity="0.55" />
        <line x1="100" y1="210" x2="78"  y2="197" stroke="#14532D" strokeWidth="0.9" opacity="0.55" />
      </g>

      {/* ── Leaf pair 2 (y=172) ── */}
      <g style={{
        opacity: leaf2,
        transform: `scale(${0.35 + 0.65 * leaf2})`,
        transformOrigin: '100px 172px',
        transition: 'opacity .7s, transform .7s',
      }}>
        <path d="M 100,172 C 112,160 134,147 136,158 C 138,169 122,178 100,172 Z" fill="#22C55E" />
        <path d="M 100,172 C 88,160 66,147 64,158 C 62,169 78,178 100,172 Z"    fill="#16A34A" />
        <line x1="100" y1="172" x2="128" y2="157" stroke="#15803D" strokeWidth="0.9" opacity="0.55" />
        <line x1="100" y1="172" x2="72"  y2="157" stroke="#15803D" strokeWidth="0.9" opacity="0.55" />
      </g>

      {/* ── Leaf pair 3 (y=135) ── */}
      <g style={{
        opacity: leaf3,
        transform: `scale(${0.35 + 0.65 * leaf3})`,
        transformOrigin: '100px 135px',
        transition: 'opacity .7s, transform .7s',
      }}>
        <path d="M 100,135 C 110,124 126,113 128,123 C 130,133 116,141 100,135 Z" fill="#4ADE80" />
        <path d="M 100,135 C 90,124 74,113 72,123 C 70,133 84,141 100,135 Z"    fill="#22C55E" />
        <line x1="100" y1="135" x2="120" y2="122" stroke="#16A34A" strokeWidth="0.9" opacity="0.55" />
        <line x1="100" y1="135" x2="80"  y2="122" stroke="#16A34A" strokeWidth="0.9" opacity="0.55" />
      </g>

      {/* ── Flower bud ── */}
      <g opacity={budOp * (1 - petalOp)} style={{ transition: 'opacity .4s' }}>
        <ellipse cx="100" cy="96" rx="7"  ry="10" fill="#A855F7" />
        <ellipse cx="100" cy="90" rx="5"  ry="7"  fill="#C084FC" />
        <ellipse cx="100" cy="87" rx="3"  ry="4"  fill="#E879F9" />
      </g>

      {/* ── Flower petals ── */}
      <g opacity={petalOp} style={{ transition: 'opacity .8s' }}>
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <ellipse
            key={angle}
            cx="100" cy="79"
            rx="8" ry="16"
            fill={i % 2 === 0 ? '#F9A8D4' : '#E879F9'}
            transform={`rotate(${angle}, 100, 96)`}
          />
        ))}
        {/* Flower center */}
        <circle cx="100" cy="96" r="11" fill="#FDE047" />
        <circle cx="100" cy="96" r="7"  fill="#FCD34D" />
        <circle cx="100" cy="96" r="4"  fill="#F59E0B" />
        {/* Stamen dots */}
        {[0, 60, 120, 180, 240, 300].map((a) => {
          const rad = (a * Math.PI) / 180;
          return (
            <circle
              key={a}
              cx={100 + Math.cos(rad) * 8}
              cy={96  + Math.sin(rad) * 8}
              r="1.5"
              fill="#92400E"
              opacity={0.7}
            />
          );
        })}
      </g>

      {/* ── Glow rings at 100% ── */}
      <circle cx="100" cy="96" r="34" fill="none" stroke="#FDE047" strokeWidth="2" opacity={glowOp * 0.4} />
      <circle cx="100" cy="96" r="52" fill="none" stroke="#F9A8D4" strokeWidth="1" opacity={glowOp * 0.2} />
    </svg>
  );
}

// ─── Confetti ──────────────────────────────────────────────────────────────
const C_COLORS = ['#F9A8D4', '#C084FC', '#67E8F9', '#4ADE80', '#FDE047', '#FB923C', '#F87171', '#A78BFA'];

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 65 }, (_, i) => ({
      id: i,
      x: 3 + Math.random() * 94,
      color: C_COLORS[i % C_COLORS.length],
      delay: Math.random() * 1.8,
      duration: 1.6 + Math.random() * 2,
      size: 5 + Math.floor(Math.random() * 7),
      circle: Math.random() > 0.45,
      rot: Math.floor(Math.random() * 360),
    })),
  []);

  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className={`confetti-bit${p.circle ? ' round' : ''}`}
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--rot': `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}

// ─── localStorage ──────────────────────────────────────────────────────────
const SK = 'streakr_sessions';
function loadSessions() { try { return JSON.parse(localStorage.getItem(SK) || '[]'); } catch { return []; } }
function saveSessions(l) { localStorage.setItem(SK, JSON.stringify(l)); }

// ─── Main component ────────────────────────────────────────────────────────
function getChallengeProgress(challenge) {
  if (!challenge?.startDate) return 0;
  const start = new Date(challenge.startDate + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.min(29, Math.max(0, Math.floor((today - start) / 86400000)));
  return Math.round((days / 29) * 100);
}

export default function Focus() {
  const { activeChallenge } = useApp();
  const [tab,         setTab]         = useState('challenge');
  const [phase,       setPhase]       = useState('setup');   // setup|running|paused|done
  const [activity,    setActivity]    = useState('');
  const [preset,      setPreset]      = useState(1800);      // active quick-preset value
  const [customTime,  setCustomTime]  = useState('');        // raw custom input text
  const [customError, setCustomError] = useState(false);     // invalid format flag
  const [remaining,   setRemaining]   = useState(0);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [sessions,    setSessions]    = useState(loadSessions);

  // Resolve the actual goal: custom input wins when it parses correctly
  const parsedCustom = parseCustomTime(customTime);
  const goalSeconds  = (customTime.trim() && parsedCustom) ? parsedCustom : preset;

  const timerRef    = useRef(null);
  const activityRef = useRef(activity);
  const goalRef     = useRef(goalSeconds);

  // Keep refs in sync
  activityRef.current = activity;
  goalRef.current     = goalSeconds;

  // Timer completion
  useEffect(() => {
    if (remaining === 0 && phase === 'running') {
      clearInterval(timerRef.current);
      setPhase('done');
      playDing();
      const s = {
        id:          `${Date.now()}`,
        activity:    activityRef.current,
        goalSeconds: goalRef.current,
        savedAt:     new Date().toISOString(),
      };
      setSessions((prev) => {
        const u = [s, ...prev];
        saveSessions(u);
        return u;
      });
    }
  }, [remaining, phase]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // progress: 0 when just started (seed) → 100 when done (full bloom)
  const progress = phase === 'setup' ? 0
    : goalSeconds > 0 ? Math.round(((goalSeconds - remaining) / goalSeconds) * 100)
    : 100;

  const stage    = getStage(progress);
  const isActive = phase !== 'setup';

  function handleStart() {
    if (!activity.trim()) return;
    setRemaining(goalSeconds);
    setPhase('running');
    setConfirmQuit(false);
    timerRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
  }

  function handlePause() {
    clearInterval(timerRef.current);
    setPhase('paused');
    setConfirmQuit(false);
  }

  function handleResume() {
    setPhase('running');
    timerRef.current = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
  }

  function handleGiveUp() {
    clearInterval(timerRef.current);
    setPhase('setup');
    setActivity('');
    setRemaining(0);
    setConfirmQuit(false);
    setCustomTime('');
    setCustomError(false);
  }

  function handleGrowAnother() {
    setPhase('setup');
    setActivity('');
    setRemaining(0);
    setCustomTime('');
    setCustomError(false);
  }

  function deleteSession(id) {
    setSessions((prev) => {
      const u = prev.filter((s) => s.id !== id);
      saveSessions(u);
      return u;
    });
  }

  return (
    <div className="page">
      {/* ── Inner tab bar ── */}
      <div className="focus-tabs">
        <button
          className={`focus-tab ${tab === 'challenge' ? 'active' : ''}`}
          onClick={() => { if (!isActive) setTab('challenge'); }}
          style={{ opacity: isActive ? 0.45 : 1, cursor: isActive ? 'default' : 'pointer' }}
          title={isActive ? 'finish your session first' : undefined}
        >
          🌱 challenge
        </button>
        <button
          className={`focus-tab ${tab === 'timer' ? 'active' : ''}`}
          onClick={() => setTab('timer')}
        >
          ⏱ grow
        </button>
        <button
          className={`focus-tab ${tab === 'gallery' ? 'active' : ''}`}
          onClick={() => { if (!isActive) setTab('gallery'); }}
          style={{ opacity: isActive ? 0.45 : 1, cursor: isActive ? 'default' : 'pointer' }}
          title={isActive ? 'finish your session first' : undefined}
        >
          🎋 gallery
          {sessions.length > 0 && (
            <span className="focus-tab-count">{sessions.length}</span>
          )}
        </button>
      </div>

      {/* ── Challenge plant tab ── */}
      {tab === 'challenge' && (() => {
        if (!activeChallenge) {
          return (
            <div className="empty-state">
              <div className="empty-state-icon">🌱</div>
              <div className="empty-state-text">no active challenge<br />start one to grow your plant</div>
            </div>
          );
        }
        const plantType     = activeChallenge.plantType  || 'flower';
        const rarityKey     = activeChallenge.plantRarity || 'common';
        const plant         = getPlant(plantType);
        const rarity        = getRarity(rarityKey);
        const cp            = getChallengeProgress(activeChallenge);
        const todayStr      = new Date().toISOString().split('T')[0];
        const start         = new Date(activeChallenge.startDate + 'T00:00:00');
        const todayMid      = new Date(); todayMid.setHours(0, 0, 0, 0);
        const dayIndex      = Math.max(0, Math.floor((todayMid - start) / 86400000));
        const currentDay    = Math.min(30, dayIndex + 1);
        const daysLeft      = Math.max(0, 30 - currentDay);
        const todayEntry    = activeChallenge.completions?.find((c) => c.date === todayStr);
        const totalHabits   = activeChallenge.habits?.length || 0;
        const doneTodayCount = todayEntry ? todayEntry.habits.filter((h) => h.completed).length : 0;

        return (
          <div className="challenge-plant-section">
            <div className="challenge-plant-name">{activeChallenge.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`rarity-badge rarity-${rarityKey}`}>{rarity.label}</span>
              <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{plant.name} {plant.emoji}</span>
            </div>
            <div className="plant-display-wrap">
              <PlantSVG
                plantType={plantType}
                progress={cp}
                style={{ width: 180, height: 288 }}
                instanceId="challenge-tab"
              />
            </div>
            <div className="challenge-plant-progress-row">
              <div className="challenge-plant-day-label">
                <span>day {currentDay} of 30</span>
                <span>{cp}% grown</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${cp}%` }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.03em' }}>
                  {doneTodayCount}/{totalHabits}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  today
                </div>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-.03em' }}>
                  {daysLeft}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  days left
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Timer tab ── */}
      {tab === 'timer' && (
        <div className="focus-session">
          {/* Plant display — always visible, grows with progress */}
          <div className={`plant-display-wrap ${phase === 'done' ? 'done' : ''}`}>
            <FocusPlantSVG progress={progress} style={{ width: 180, height: 288 }} />
          </div>

          {/* Stage label */}
          {isActive && (
            <div className="focus-stage-row">
              <span className="focus-stage-label">{stage.label}</span>
              <span className="focus-stage-msg">{stage.msg}</span>
            </div>
          )}

          {/* ──── Setup phase ──── */}
          {phase === 'setup' && (
            <div className="focus-setup-form">
              <p className="focus-setup-heading">what are you growing today?</p>
              <input
                className="focus-input"
                type="text"
                placeholder="studying, workout, deep work..."
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                maxLength={50}
              />
              <p className="focus-time-label">set your goal</p>
              <div className="goal-preset-row">
                {QUICK_PRESETS.map((o) => (
                  <button
                    key={o.s}
                    className={`goal-time-chip ${!customTime.trim() && preset === o.s ? 'active' : ''}`}
                    onClick={() => { setPreset(o.s); setCustomTime(''); setCustomError(false); }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <div className="custom-time-wrap">
                <input
                  className={`focus-input custom-time-input ${customError ? 'error' : ''}`}
                  type="text"
                  placeholder="or enter your time (45 min, 1.5 hrs, etc)"
                  value={customTime}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomTime(val);
                    if (val.trim()) {
                      setCustomError(!parseCustomTime(val));
                    } else {
                      setCustomError(false);
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && !customError && handleStart()}
                />
                {customError && (
                  <span className="custom-time-err">try "45 min" or "1.5 hrs"</span>
                )}
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 4, minWidth: 180 }}
                disabled={!activity.trim() || customError}
                onClick={handleStart}
              >
                start growing →
              </button>
            </div>
          )}

          {/* ──── Running / Paused phase ──── */}
          {(phase === 'running' || phase === 'paused') && (
            <div className="focus-timer-area">
              <div className={`focus-timer ${phase === 'paused' ? 'paused' : ''}`}>
                {fmtCountdown(remaining)}
              </div>
              <div className="focus-activity-badge">{activity} · {fmtGoal(goalSeconds)}</div>

              {!confirmQuit ? (
                <div className="focus-controls">
                  <button className="btn-pause" onClick={phase === 'running' ? handlePause : handleResume}>
                    {phase === 'running' ? '⏸ pause' : '▶ resume'}
                  </button>
                  <button className="btn-give-up" onClick={() => setConfirmQuit(true)}>
                    give up
                  </button>
                </div>
              ) : (
                <div className="focus-quit-row">
                  <span className="focus-quit-msg">your plant will wither 🪦</span>
                  <button className="btn btn-danger btn-sm" onClick={handleGiveUp}>quit</button>
                  <button className="btn-pause" onClick={() => setConfirmQuit(false)}>keep going</button>
                </div>
              )}
            </div>
          )}

          {/* ──── Done phase ──── */}
          {phase === 'done' && (
            <div className="focus-done-area">
              <div className="focus-done-title">you grew a plant! 🌺</div>
              <div className="focus-done-sub">{activity} · {fmtGoal(goalSeconds)}</div>
              <div className="focus-done-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => { handleGrowAnother(); setTab('gallery'); }}
                >
                  view gallery →
                </button>
                <button className="btn btn-ghost" onClick={handleGrowAnother}>
                  grow another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Gallery tab ── */}
      {tab === 'gallery' && (
        <div className="focus-gallery-wrap">
          <div className="page-header" style={{ paddingTop: 4 }}>
            <div className="page-title">your plants 🌿</div>
            {sessions.length > 0 && (
              <div className="page-subtitle">
                {sessions.length} plant{sessions.length !== 1 ? 's' : ''} grown
              </div>
            )}
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌰</div>
              <div className="empty-state-text">
                no plants yet<br />
                complete a focus session to grow your first one
              </div>
              <button
                className="btn btn-primary mt-16"
                style={{ minWidth: 140 }}
                onClick={() => setTab('timer')}
              >
                grow one →
              </button>
            </div>
          ) : (
            <div className="plant-gallery">
              {sessions.map((s) => (
                <div key={s.id} className="gallery-card">
                  <div className="gallery-plant">
                    <FocusPlantSVG progress={100} style={{ width: 68, height: 108 }} />
                  </div>
                  <div className="gallery-card-name">{s.activity}</div>
                  <div className="gallery-card-duration">{fmtGoal(s.goalSeconds)}</div>
                  <div className="gallery-card-date">{fmtDate(s.savedAt)}</div>
                  <button
                    className="gallery-card-delete"
                    onClick={() => deleteSession(s.id)}
                    aria-label="delete plant"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Confetti ── */}
      {phase === 'done' && <Confetti />}
    </div>
  );
}
