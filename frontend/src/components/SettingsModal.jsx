import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Settings } from 'lucide-react';
import { apiFetch } from '../api.js';

export default function SettingsModal({ isOpen, onClose, user, onUpdateUser, showToast }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shakeError, setShakeError] = useState(false);

  // Sync state with user details when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setError('');
    }
  }, [isOpen, user]);

  const triggerShake = (msg) => {
    setError(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      triggerShake('Current password is required to verify changes');
      return;
    }

    if (newPassword && newPassword !== confirmNewPassword) {
      triggerShake('New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      triggerShake('New password must be at least 4 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          currentPassword,
          newPassword: newPassword || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerShake(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Update localStorage & parent state
      localStorage.setItem('applybuddy_user', JSON.stringify(data.user));
      onUpdateUser(data.user);
      
      if (showToast) {
        showToast({ error: false, message: 'Settings updated successfully!' });
      }
      
      setLoading(false);
      onClose();
    } catch (err) {
      triggerShake('Cannot connect to server');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            className="settings-modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <Settings size={18} className="modal-title-icon" />
                <h2>Profile Settings</h2>
              </div>
              <button className="modal-close-btn interactive" onClick={onClose}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-field">
                <label className="form-label">
                  <User size={14} className="field-icon" /> Username
                </label>
                <input
                  type="text"
                  className="form-input interactive"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">
                  <Mail size={14} className="field-icon" /> Email Address
                </label>
                <input
                  type="email"
                  className="form-input interactive"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <hr className="modal-divider" />

              <div className="form-field">
                <label className="form-label">
                  <Lock size={14} className="field-icon" /> New Password (Optional)
                </label>
                <input
                  type="password"
                  className="form-input interactive"
                  placeholder="Leave blank to keep same"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              {newPassword && (
                <div className="form-field">
                  <label className="form-label">
                    <Lock size={14} className="field-icon" /> Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-input interactive"
                    placeholder="Re-type new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <hr className="modal-divider" />

              <div className="form-field required-field">
                <label className="form-label highlight-label">
                  <Lock size={14} className="field-icon" /> Current Password (Required)
                </label>
                <input
                  type="password"
                  className="form-input verify-input interactive"
                  placeholder="Enter current password to verify"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    className="modal-error"
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

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary interactive"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary interactive"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
