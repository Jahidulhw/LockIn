import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!user) return null;
  const initial = user.username[0].toUpperCase();
  const displayName = user.username.charAt(0).toUpperCase() + user.username.slice(1);

  return (
    <div className="app-header">
      <div className="app-header-inner">
        <span className="app-header-username">{displayName}</span>
        <div className="app-header-avatar-wrap" ref={ref}>
          <button
            className="app-header-avatar"
            onClick={() => setOpen((o) => !o)}
            aria-label="Profile menu"
            aria-expanded={open}
          >
            {initial}
          </button>
          {open && (
            <div className="app-header-dropdown">
              <div className="profile-dropdown-user">
                <div className="profile-dropdown-avatar">{initial}</div>
                <div className="profile-dropdown-name">{displayName}</div>
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
        </div>
      </div>
    </div>
  );
}
