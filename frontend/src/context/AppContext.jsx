import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallengeState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadChallenges = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getChallenges();
      setChallenges(data);
      // Restore last active challenge from localStorage or default to first
      const savedId = localStorage.getItem('activeChallenge');
      const found = data.find((c) => c._id === savedId) || data[0] || null;
      setActiveChallengeState(found);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  const setActiveChallenge = useCallback((challenge) => {
    setActiveChallengeState(challenge);
    if (challenge) localStorage.setItem('activeChallenge', challenge._id);
  }, []);

  const createChallenge = useCallback(async (data) => {
    const created = await api.createChallenge(data);
    setChallenges((prev) => [created, ...prev]);
    setActiveChallenge(created);
    return created;
  }, [setActiveChallenge]);

  const toggleHabit = useCallback(async (challengeId, habitId, date) => {
    // Optimistic update — flip the habit immediately so the UI responds on first tap
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
    setChallenges((prev) => prev.map(applyToggle));
    setActiveChallengeState((prev) => prev ? applyToggle(prev) : null);

    try {
      const updated = await api.toggleHabit(challengeId, habitId, date);
      setChallenges((prev) => prev.map((c) => (c._id === challengeId ? updated : c)));
      setActiveChallengeState((prev) => (prev?._id === challengeId ? updated : prev));
      return updated;
    } catch (err) {
      // Revert by reloading authoritative state from server
      loadChallenges();
      throw err;
    }
  }, [loadChallenges]);

  const addHabit = useCallback(async (challengeId, habitData) => {
    const updated = await api.addHabit(challengeId, habitData);
    setChallenges((prev) => prev.map((c) => (c._id === challengeId ? updated : c)));
    setActiveChallengeState((prev) => (prev?._id === challengeId ? updated : prev));
    return updated;
  }, []);

  const deleteHabit = useCallback(async (challengeId, habitId) => {
    const updated = await api.deleteHabit(challengeId, habitId);
    setChallenges((prev) => prev.map((c) => (c._id === challengeId ? updated : c)));
    setActiveChallengeState((prev) => (prev?._id === challengeId ? updated : prev));
    return updated;
  }, []);

  const saveNote = useCallback(async (challengeId, date, text) => {
    const updated = await api.saveNote(challengeId, date, text);
    setChallenges((prev) => prev.map((c) => (c._id === challengeId ? updated : c)));
    setActiveChallengeState((prev) => (prev?._id === challengeId ? updated : prev));
    return updated;
  }, []);

  const deleteChallenge = useCallback(async (challengeId) => {
    await api.deleteChallenge(challengeId);
    setChallenges((prev) => prev.filter((c) => c._id !== challengeId));
    setActiveChallengeState((prev) => {
      if (prev?._id !== challengeId) return prev;
      localStorage.removeItem('activeChallenge');
      return null;
    });
  }, []);

  return (
    <AppContext.Provider
      value={{
        challenges,
        activeChallenge,
        loading,
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
