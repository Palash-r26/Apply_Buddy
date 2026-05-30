import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Globe, Zap, Shield, Mail, Lock, EyeOff, Eye, User } from 'lucide-react';
import { apiFetch } from '../api.js';

const API_BASE = '/api/auth';

export default function Landing({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  const [username,        setUsername]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const firstInputRef = useRef(null);

  // Reset form on mode switch
  useEffect(() => {
    setUsername(''); setEmail(''); setPassword(''); setConfirmPassword('');
    setError(''); setShowPassword(false); setShowConfirmPassword(false);
    setTimeout(() => firstInputRef.current?.focus(), 50);
  }, [mode]);

  const triggerShake = (msg) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!username.trim() || !email.trim() || !password || !confirmPassword) {
        triggerShake('All fields are required');
        return;
      }
      if (password.length < 6) {
        triggerShake('Password must be at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        triggerShake('Passwords do not match');
        return;
      }
    } else {
      if (!email.trim() || !password) {
        triggerShake('Email and password are required');
        return;
      }
      if (password.length < 6) {
        triggerShake('Password must be at least 6 characters');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const body = mode === 'register'
        ? { username: username.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res  = await apiFetch(`${API_BASE}${endpoint}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        triggerShake(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      localStorage.setItem('applybuddy_user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch {
      triggerShake('Cannot connect to server');
      setLoading(false);
    }
  };

  const features = [
    {
      icon:  <Database size={20} />,
      title: 'Dynamic Data Vault',
      desc:  'Build custom sections and fields. Store exactly what you need.',
    },
    {
      icon:  <Globe size={20} />,
      title: 'Browser Integration',
      desc:  'Instantly sync your vault to the ApplyBuddy Chrome Extension.',
    },
    {
      icon:  <Zap size={20} />,
      title: 'Universal Autofill',
      desc:  'Map your custom fields to any job application with one click.',
    },
    {
      icon:  <Shield size={20} />,
      title: 'Privacy First',
      desc:  'Your data is securely stored and isolated. You control it.',
    },
  ];

  return (
    <div className="landing-container">

      {/* ── Left: Hero + Features ── */}
      <div className="landing-content">
        <div className="hero-badge">✦ ApplyBuddy Vault Engine</div>
        <h1 className="hero-title">
          ApplyBuddy Profile <br />
          <span className="hero-highlight">Platform</span>
        </h1>
        <p className="hero-subtitle">
          Stop typing the same information. Build your dynamic profile vault and
          securely autofill applications across the web with our companion extension.
        </p>

        <div className="feature-grid">
          {features.map((f, idx) => (
            <div key={idx} className="feature-card">
              <div className="feature-icon-wrapper">{f.icon}</div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Auth Form ── */}
      <div className="landing-auth-wrapper">
        <motion.div
          className="auth-box"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <img src="/icon.png" alt="ApplyBuddy Logo" className="auth-box-logo" />
          <h2>Welcome {mode === 'login' ? 'Back' : 'to Vault'}</h2>
          <p className="auth-box-subtitle">
            {mode === 'login'
              ? 'Sign in to access your ApplyBuddy profile.'
              : 'Create your account to get started.'}
          </p>

          <div className="auth-toggle">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => setMode('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => setMode('register')}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-clean" noValidate>

            {/* Username — register only */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  className="form-group"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label htmlFor="auth-username">USERNAME</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input
                      id="auth-username"
                      ref={mode === 'register' ? firstInputRef : undefined}
                      type="text"
                      placeholder="palash26"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="auth-email">EMAIL ADDRESS</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="auth-email"
                  ref={mode === 'login' ? firstInputRef : undefined}
                  type="email"
                  placeholder="you@applybuddy.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="auth-password">
                PASSWORD
                <span className="field-hint">min. 6 characters</span>
              </label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  maxLength={128}
                />
                <button
                  type="button"
                  className="password-toggle interactive"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password — register only */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  className="form-group"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label htmlFor="auth-confirm-password">CONFIRM PASSWORD</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="auth-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      maxLength={128}
                    />
                    <button
                      type="button"
                      className="password-toggle interactive"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global error banner with shake */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="auth-error-clean"
                  initial={{ height: 0, opacity: 0 }}
                  animate={
                    shakeError
                      ? { height: 'auto', opacity: 1, x: [-6, 6, -6, 6, 0] }
                      : { height: 'auto', opacity: 1, x: 0 }
                  }
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="submit-btn interactive"
              disabled={loading}
            >
              {loading
                ? 'Please wait…'
                : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
