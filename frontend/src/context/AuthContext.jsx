import { createContext, useContext, useState, useCallback } from 'react';
import * as api from '../api/client';

const AuthContext = createContext(null);

const TOKEN_KEY = 'lockin_token';
const USER_KEY  = 'lockin_user';

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user,  setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });

  const persist = useCallback((tokenVal, userVal) => {
    localStorage.setItem(TOKEN_KEY, tokenVal);
    localStorage.setItem(USER_KEY, JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  }, []);

  const signupFn = useCallback(async (username, password) => {
    const data = await api.signup(username, password);
    persist(data.token, { id: data.id, username: data.username });
  }, [persist]);

  const loginFn = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    persist(data.token, { id: data.id, username: data.username });
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('activeChallenge');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isLoggedIn: !!token, signup: signupFn, login: loginFn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
