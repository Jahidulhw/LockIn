const BASE_URL = import.meta.env.VITE_API_URL || '';

function getToken() {
  return localStorage.getItem('lockin_token');
}

async function fetchJSON(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const signup = (username, password) =>
  fetchJSON('/auth/signup', { method: 'POST', body: JSON.stringify({ username, password }) });

export const login = (username, password) =>
  fetchJSON('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });

// ── Challenges ────────────────────────────────────────────────────────────────
export const getChallenges = () => fetchJSON('/api/challenges');

export const getChallenge = (id) => fetchJSON(`/api/challenges/${id}`);

export const createChallenge = (data) =>
  fetchJSON('/api/challenges', { method: 'POST', body: JSON.stringify(data) });

export const updateChallenge = (id, data) =>
  fetchJSON(`/api/challenges/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const toggleHabit = (challengeId, habitId, date) =>
  fetchJSON(`/api/challenges/${challengeId}/habits/${habitId}/complete`, {
    method: 'POST',
    body: JSON.stringify({ date })
  });

export const getProgress = (id) => fetchJSON(`/api/challenges/${id}/progress`);

export const getAnalytics = (id) => fetchJSON(`/api/challenges/${id}/analytics`);

export const resetChallenge = (id) =>
  fetchJSON(`/api/challenges/${id}/reset`, { method: 'POST' });

export const addHabit = (challengeId, habit) =>
  fetchJSON(`/api/challenges/${challengeId}/habits`, {
    method: 'POST',
    body: JSON.stringify(habit),
  });

export const deleteHabit = (challengeId, habitId) =>
  fetchJSON(`/api/challenges/${challengeId}/habits/${habitId}`, { method: 'DELETE' });

export const deleteChallenge = (id) =>
  fetchJSON(`/api/challenges/${id}`, { method: 'DELETE' });

export const saveNote = (challengeId, date, text) =>
  fetchJSON(`/api/challenges/${challengeId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ date, text })
  });
