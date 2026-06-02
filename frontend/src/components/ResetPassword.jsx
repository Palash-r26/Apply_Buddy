import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  const triggerShake = (msg) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      triggerShake('Invalid or missing reset token.');
      return;
    }

    if (!password || !confirmPassword) {
      triggerShake('Both password fields are required.');
      return;
    }

    if (password.length < 6) {
      triggerShake('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      triggerShake('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        triggerShake(data.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      setSuccess('Password reset successfully. Redirecting to login...');
      setTimeout(() => {
        navigate('/');
      }, 2500);
    } catch {
      triggerShake('Cannot connect to server.');
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="landing-content">
        <div className="hero-badge">✦ Secure Reset</div>
        <h1 className="hero-title">
          Reset Your <br />
          <span className="hero-highlight">Password</span>
        </h1>
        <p className="hero-subtitle">
          Please enter your new password below. Make sure it's at least 6 characters long and memorable.
        </p>
      </div>

      <div className="landing-auth-wrapper">
        <motion.div
          className="auth-box"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <img src="/icon.png" alt="ApplyBuddy Logo" className="auth-box-logo" />
          <h2>Create New Password</h2>

          <form onSubmit={handleSubmit} className="auth-form-clean" noValidate>
            <div className="form-group">
              <label htmlFor="auth-password">
                NEW PASSWORD
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
                  autoComplete="new-password"
                  maxLength={128}
                />
                <button
                  type="button"
                  className="password-toggle interactive"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
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
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

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
              {success && (
                <motion.div
                  style={{
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    marginBottom: '16px'
                  }}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              className="submit-btn interactive"
              disabled={loading || !token || !!success}
            >
              {loading ? 'Please wait…' : 'Reset Password'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
