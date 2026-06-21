import { createContext, useContext, useState, useEffect } from 'react';
import { savePreferences } from '../api/client';

export const THEMES = [
  {
    id: 'dark-forest',
    name: 'Dark Forest',
    gradient: 'linear-gradient(135deg, #010604 0%, #051808 45%, #0a2810 80%, #041006 100%)',
  },
  {
    id: 'midnight-ocean',
    name: 'Midnight Ocean',
    gradient: 'linear-gradient(135deg, #010308 0%, #030d1e 45%, #041428 80%, #010810 100%)',
  },
  {
    id: 'moonlight',
    name: 'Moonlight',
    gradient: 'linear-gradient(135deg, #050514 0%, #0d0d2c 45%, #100e30 80%, #08081e 100%)',
  },
  {
    id: 'sunset-beach',
    name: 'Sunset Beach',
    gradient: 'linear-gradient(135deg, #050202 0%, #1c0d06 35%, #280e04 60%, #100404 100%)',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    gradient: 'linear-gradient(135deg, #010306 0%, #02080e 40%, #030d10 70%, #020608 100%)',
  },
  {
    id: 'starfield',
    name: 'Starfield',
    gradient: 'linear-gradient(135deg, #000000 0%, #03020c 40%, #050318 70%, #020108 100%)',
  },
];

const VALID_IDS = new Set(THEMES.map((t) => t.id));
const LS_KEY = 'lockin_theme';
const DEFAULT = 'starfield';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return VALID_IDS.has(saved) ? saved : DEFAULT;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setTheme(id) {
    if (!VALID_IDS.has(id)) return;
    document.documentElement.classList.add('theme-transitioning');
    localStorage.setItem(LS_KEY, id);
    setThemeState(id);
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 380);
    // Persist to server (fire-and-forget — only if logged in)
    if (localStorage.getItem('lockin_token')) {
      savePreferences({ theme: id }).catch(() => {});
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
