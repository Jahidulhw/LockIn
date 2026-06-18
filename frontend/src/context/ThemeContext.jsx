import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  { id: 'dark',     name: 'Dark',     swatch: ['#141414', '#8B5CF6'] },
  { id: 'light',    name: 'Light',    swatch: ['#ffffff', '#7c3aed'] },
  { id: 'midnight', name: 'Midnight', swatch: ['#0e1230', '#818cf8'] },
  { id: 'ocean',    name: 'Ocean',    swatch: ['#091828', '#22d3ee'] },
  { id: 'forest',   name: 'Forest',   swatch: ['#0d1a0f', '#34d399'] },
  { id: 'sunset',   name: 'Sunset',   swatch: ['#1a1008', '#f97316'] },
];

const LS_KEY = 'lockin_theme';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    return THEMES.some((t) => t.id === saved) ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  function setTheme(id) {
    document.documentElement.classList.add('theme-transitioning');
    localStorage.setItem(LS_KEY, id);
    setThemeState(id);
    setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
