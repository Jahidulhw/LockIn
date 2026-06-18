import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, THEMES } from '../context/ThemeContext';

export default function ProfileButton() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (!user) return null;
  const initial = user.username[0].toUpperCase();

  return createPortal(
    <div className="profile-btn-wrap" ref={ref}>
      <button
        className="profile-avatar"
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-user">
            <div className="profile-dropdown-avatar">{initial}</div>
            <div className="profile-dropdown-name">{user.username}</div>
          </div>

          <div className="profile-dropdown-divider" />

          {/* Theme picker */}
          <div className="profile-theme-section">
            <div className="profile-theme-label">appearance</div>
            <div className="profile-theme-grid">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`profile-theme-btn ${theme === t.id ? 'selected' : ''}`}
                  onClick={() => setTheme(t.id)}
                  title={t.name}
                >
                  <div
                    className="profile-theme-swatch"
                    style={{ '--swatch-bg': t.swatch[0], '--swatch-accent': t.swatch[1] }}
                  />
                  <span className="profile-theme-name">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="profile-dropdown-divider" />

          <button
            className="profile-dropdown-item profile-dropdown-logout"
            onClick={() => { setOpen(false); logout(); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            log out
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
