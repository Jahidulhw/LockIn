import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

const CACHE_KEY = 'lockin_challenges_cache';
const CACHE_TTL = 2 * 60 * 1000; // 2 min — skip background refresh if cache is this fresh

function readCache(userId) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.uid !== userId) return null;
    return { data: parsed.data, ts: parsed.ts };
  } catch {
    return null;
  }
}

function writeCache(userId, data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now(), uid: userId }));
  } catch {}
}

export function AppProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;

  // Hydrate immediately from cache — returning users see data instantly, no spinner
  const [cachedOnMount] = useState(() => readCache(userId));

  const [challenges, setChallenges] = useState(() => cachedOnMount?.data ?? []);
  const [activeChallenge, setActiveChallengeState] = useState(() => {
    if (!cachedOnMount) return null;
    const savedId = localStorage.getItem('activeChallenge');
    return cachedOnMount.data.find((c) => c._id === savedId) || cachedOnMount.data[0] || null;
  });
  // loading=false if we have a cache to show immediately
  const [loading, setLoading] = useState(!cachedOnMount);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Helper: update challenges + keep cache in sync
  const setChallengesAndCache = useCallback((updater) => {
    setChallenges((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (userId) writeCache(userId, next);
      return next;
    });
  }, [userId]);

  // Apply fresh data from the server, preserving the user's current active selection
  const applyFreshData = useCallback((data) => {
    if (userId) writeCache(userId, data);
    setChallenges(data);
    setActiveChallengeState((prev) => {
      if (prev) {
        const still = data.find((c) => c._id === prev._id);
        if (still) return still;
      }
      const savedId = localStorage.getItem('activeChallenge');
      return data.find((c) => c._id === savedId) || data[0] || null;
    });
  }, [userId]);

  const loadChallenges = useCallback(async (opts = {}) => {
    const background = opts.background ?? false;
    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await api.getChallenges();
      applyFreshData(data);
      if (!background) setError(null);
    } catch (err) {
      if (!background) setError(err.message);
    } finally {
      if (background) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [applyFreshData]);

  useEffect(() => {
    if (cachedOnMount) {
      const age = Date.now() - cachedOnMount.ts;
      if (age < CACHE_TTL) {
        // Cache is still fresh — defer background refresh a bit so page paints first
        const timer = setTimeout(() => loadChallenges({ background: true }), 1500);
        return () => clearTimeout(timer);
      }
      // Stale cache — show it instantly but refresh immediately in background
      loadChallenges({ background: true });
    } else {
      // No cache at all — blocking load with spinner
      loadChallenges();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setActiveChallenge = useCallback((challenge) => {
    setActiveChallengeState(challenge);
    if (challenge) localStorage.setItem('activeChallenge', challenge._id);
  }, []);

  const createChallenge = useCallback(async (data) => {
    const created = await api.createChallenge(data);
    setChallengesAndCache((prev) => [created, ...prev]);
    setActiveChallenge(created);
    return created;
  }, [setChallengesAndCache, setActiveChallenge]);

  const toggleHabit = useCallback(async (challengeId, habitId, date) => {
    function applyToggle(challenge) {
      if (challenge._id !== challengeId) return challenge;
      const completions = challenge.completions ? [...challenge.completions] : [];
      const dayIdx = completions.findIndex((c) => c.date === date);
      if (dayIdx === -1) {
        return { ...challenge, completions: [...completions, { date, habits: [{ habitId, completed: true }] }] };
      }
      const day = completions[dayIdx];
      const hIdx = day.habits.findIndex((h) => h.habitId === habitId);
      const newHabits = hIdx === -1
        ? [...day.habits, { habitId, completed: true }]
        : day.habits.map((h) => h.habitId === habitId ? { ...h, completed: !h.completed } : h);
      return { ...challenge, completions: completions.map((c, i) => i === dayIdx ? { ...c, habits: newHabits } : c) };
    }
    // Optimistic update
    setChallenges((prev) => prev.map(applyToggle));
    setActiveChallengeState((prev) => prev ? applyToggle(prev) : null);

    try {
      const updated = await api.toggleHabit(challengeId, habitId, date);
      setChallengesAndCache((prev) => prev.map((c) => (c._id === challengeId ? updated : c)));
      setActiveChallengeState((prev) => (prev?._id === challengeId ? updated : prev));
      return updated;
    } catch (err) {
      loadChallenges({ background: true });
      throw err;
    }
  }, [setChallengesAndCache, loadChallenges]);

  const addHabit = useCallback(async (challengeId, habitData) => {
    const updated = await api.addHabit(challengeId, habitData);
    setChallengesAndCache((prev) => prev.map((c) => (c._id === challengeId ? updated : c)));
    setActiveChallengeState((prev) => (prev?._id === challengeId ? updated : prev));
    return updated;
  }, [setChallengesAndCache]);

  const deleteHabit = useCallback(async (challengeId, habitId) => {
    const updated = await api.deleteHabit(challengeId, habitId);
    setChallengesAndCache((prev) => prev.map((c) => (c._id === challengeId ? updated : c)));
    setActiveChallengeState((prev) => (prev?._id === challengeId ? updated : prev));
    return updated;
  }, [setChallengesAndCache]);

  const saveNote = useCallback(async (challengeId, date, text) => {
    const updated = await api.saveNote(challengeId, date, text);
    setChallengesAndCache((prev) => prev.map((c) => (c._id === challengeId ? updated : c)));
    setActiveChallengeState((prev) => (prev?._id === challengeId ? updated : prev));
    return updated;
  }, [setChallengesAndCache]);

  const deleteChallenge = useCallback(async (challengeId) => {
    await api.deleteChallenge(challengeId);
    setChallengesAndCache((prev) => prev.filter((c) => c._id !== challengeId));
    setActiveChallengeState((prev) => {
      if (prev?._id !== challengeId) return prev;
      localStorage.removeItem('activeChallenge');
      return null;
    });
  }, [setChallengesAndCache]);

  return (
    <AppContext.Provider
      value={{
        challenges,
        activeChallenge,
        loading,
        refreshing,
        error,
        setActiveChallenge,
        createChallenge,
        toggleHabit,
        addHabit,
        deleteHabit,
        saveNote,
        deleteChallenge,
        reload: loadChallenges
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
