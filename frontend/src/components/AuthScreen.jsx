import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../api.js';

const API_BASE = '/api/auth';

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const usernameRef = useRef(null);

  useEffect(() => {
    if (usernameRef.current) usernameRef.current.focus();
  }, [mode]);

  const triggerShake = (msg) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      triggerShake('Username and password are required');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      triggerShake('Passwords do not match');
      return;
    }

    if (password.length < 4) {
      triggerShake('Password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const res = await apiFetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerShake(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Token is set via httpOnly cookie, just store user and notify
      localStorage.setItem('applybuddy_user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      triggerShake('Cannot connect to server');
      setLoading(false);
    }
  };

  const titleChars = Array.from('ApplyBuddy');

  return (
    <div className="auth-screen">
      <motion.div
        className="auth-card"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 18 }}
      >
        <div className="auth-brand">
          <motion.h1
            className="auth-app-name"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.04 }
              }
            }}
          >
            {titleChars.map((ch, i) => (
              <motion.span
                key={i}
                style={{ display: 'inline-block' }}
                variants={{
                  hidden: { y: 12, opacity: 0 },
                  visible: { y: 0, opacity: 1 }
                }}
              >
                {ch}
              </motion.span>
            ))}
          </motion.h1>
          <p className="auth-subtitle">Your personal profile vault</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab interactive ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab interactive ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            onSubmit={handleSubmit}
            className="auth-form"
            initial={{ x: mode === 'login' ? -20 : 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: mode === 'login' ? 20 : -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <input
                ref={usernameRef}
                type="text"
                className="auth-input interactive"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                type="password"
                className="auth-input interactive"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  className="auth-field"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label className="auth-label">Confirm Password</label>
                  <input
                    type="password"
                    className="auth-input interactive"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="auth-error"
                  initial={{ height: 0, opacity: 0 }}
                  animate={shakeError
                    ? { height: 'auto', opacity: 1, x: [0, -6, 6, -6, 6, 0] }
                    : { height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="auth-submit interactive"
              disabled={loading}
            >
              {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
