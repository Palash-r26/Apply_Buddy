import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Globe, Zap, Shield, Mail, Lock, EyeOff, Eye, User } from 'lucide-react';
import { apiFetch } from '../api.js';

const API_BASE = '/api/auth';

export default function Landing({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('user'); // For the toggle in UI (Teacher/Admin in Veda, User/Pro in ApplyBuddy)
  
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

    if (mode === 'register') {
      if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
        triggerShake('All fields are required');
        return;
      }
      if (password !== confirmPassword) {
        triggerShake('Passwords do not match');
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        triggerShake('Email and password are required');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const bodyPayload = mode === 'register' 
        ? { username: username.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const res = await apiFetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();

      if (!res.ok) {
        triggerShake(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      localStorage.setItem('applybuddy_user', JSON.stringify(data.user));
      onAuth(data.user);
    } catch (err) {
      triggerShake('Cannot connect to server');
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Database size={24} className="feature-icon" />,
      title: 'Dynamic Data Vault',
      desc: 'Build custom sections and fields. Store exactly what you need without hardcoded limits.'
    },
    {
      icon: <Globe size={24} className="feature-icon" />,
      title: 'Browser Integration',
      desc: 'Instantly sync your vault to the ApplyBuddy Chrome Extension securely.'
    },
    {
      icon: <Zap size={24} className="feature-icon" />,
      title: 'Universal Autofill',
      desc: 'Map your custom fields to any job application or web form with one click.'
    },
    {
      icon: <Shield size={24} className="feature-icon" />,
      title: 'Privacy First',
      desc: 'Your data is securely stored and isolated. You control your profile vault.'
    }
  ];

  return (
    <div className="landing-container">
      {/* Left Side: Hero & Features */}
      <div className="landing-content">
        <div className="hero-badge">✦ ApplyBuddy Vault Engine</div>
        <h1 className="hero-title">
          ApplyBuddy Profile <br/>
          <span className="hero-highlight">Platform</span>
        </h1>
        <p className="hero-subtitle">
          Stop typing the same information. Build your dynamic profile vault and securely autofill applications across the web with our companion extension.
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

      {/* Right Side: Auth Form */}
      <div className="landing-auth-wrapper">
        <motion.div 
          className="auth-box"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <img src="/icon.png" alt="ApplyBuddy Logo" className="auth-box-logo" />
          <h2>Welcome {mode === 'login' ? 'Back' : 'to Vault'}</h2>
          <p className="auth-box-subtitle">Sign in to access your ApplyBuddy profile.</p>

          <div className="auth-toggle">
            <button 
              className={mode === 'login' ? 'active' : ''} 
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button 
              className={mode === 'register' ? 'active' : ''} 
              onClick={() => { setMode('register'); setError(''); }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form-clean">
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div 
                  className="form-group"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label>USERNAME</label>
                  <div className="input-wrapper">
                    <User size={16} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="palash26" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label>EMAIL ADDRESS</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input 
                  type="email" 
                  placeholder="you@applybuddy.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>PASSWORD</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div 
                  className="form-group"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <label>CONFIRM PASSWORD</label>
                  <div className="input-wrapper">
                    <Lock size={16} className="input-icon" />
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button type="button" className="password-toggle interactive" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  className="auth-error-clean"
                  initial={{ height: 0, opacity: 0 }}
                  animate={shakeError ? { height: 'auto', opacity: 1, x: [-5, 5, -5, 5, 0] } : { height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" className="submit-btn interactive" disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
