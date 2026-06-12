import { useEffect, useRef } from 'react';

const COLORS = ['#8b5cf6', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#60a5fa', '#fb923c'];

// Pre-generated so particles don't re-randomise on re-render
const PARTICLES = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  left:     `${(i / 48) * 100 + (Math.sin(i * 2.4) * 2)}%`,
  delay:    `${(i % 12) * 0.12}s`,
  duration: `${2.2 + (i % 5) * 0.3}s`,
  color:    COLORS[i % COLORS.length],
  size:     `${7 + (i % 4) * 2}px`,
  shape:    i % 3 === 0 ? 'circle' : 'square',
  skew:     `${(i % 7) * 15}deg`,
}));

export default function CelebrationOverlay({ onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    // Auto-focus close button for keyboard accessibility
    closeRef.current?.focus();

    // Auto-dismiss after 8 s if user doesn't interact
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="celebration-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      {/* Confetti */}
      <div className="confetti-container" aria-hidden="true">
        {PARTICLES.map(p => (
          <span
            key={p.id}
            className="confetti-piece"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              background: p.color,
              width: p.size,
              height: p.size,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              transform: `skewX(${p.skew})`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className="celebration-card" onClick={e => e.stopPropagation()}>
        <div className="celebration-glow" />

        <div className="celebration-emoji-wrap">
          <span className="celebration-plant" aria-label="fully grown plant">🌳</span>
          <span className="celebration-sparkle s1">✨</span>
          <span className="celebration-sparkle s2">⭐</span>
          <span className="celebration-sparkle s3">✨</span>
        </div>

        <div className="celebration-trophy">🏆</div>

        <h2 className="celebration-title">challenge complete!</h2>
        <p className="celebration-subtitle">Your plant is fully grown! 🌱</p>
        <p className="celebration-body">
          30 days. Every single one.<br />
          That's not luck — that's discipline.
        </p>

        <button
          ref={closeRef}
          className="celebration-close-btn"
          onClick={onClose}
        >
          let's go 🔥
        </button>
      </div>
    </div>
  );
}
