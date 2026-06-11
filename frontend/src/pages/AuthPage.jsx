import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { signup, login } = useAuth();
  const [mode,     setMode]     = useState('login');   // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const submit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirm) {
      setError('passwords do not match');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        await signup(username.trim(), password);
      } else {
        await login(username.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, username, password, confirm, signup, login]);

  const switchMode = useCallback(() => {
    setMode((m) => m === 'login' ? 'signup' : 'login');
    setError('');
    setPassword('');
    setConfirm('');
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🔒</div>
        <div className="auth-app-name">LockIn</div>
        <div className="auth-tagline">
          {mode === 'login' ? 'welcome back' : 'create your account'}
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-field">
            <label className="auth-label">username</label>
            <input
              className="auth-input"
              type="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={30}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">password</label>
            <input
              className="auth-input"
              type="password"
              placeholder={mode === 'signup' ? 'at least 6 characters' : 'your password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {mode === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">confirm password</label>
              <input
                className="auth-input"
                type="password"
                placeholder="repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'log in' : 'create account'}
          </button>
        </form>

        <button className="auth-switch" onClick={switchMode}>
          {mode === 'login'
            ? "don't have an account? sign up"
            : 'already have an account? log in'}
        </button>
      </div>
    </div>
  );
}
