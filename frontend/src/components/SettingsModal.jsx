import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Lock, Settings, Download, Upload, FileJson } from 'lucide-react';
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
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImportFile(e.dataTransfer.files[0]);
    }
  };

  const handleExport = () => {
    try {
      const storageKey = user && user.username ? `applybuddy_data_${user.username}` : 'applybuddy_data';
      const rawData = localStorage.getItem(storageKey);
      if (!rawData) {
        showToast({ error: true, message: 'No profile data found to export.' });
        return;
      }
      
      const blob = new Blob([rawData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `applybuddy_profile_${user?.username || 'local'}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast({ error: false, message: 'Profile exported successfully!' });
    } catch (err) {
      showToast({ error: true, message: 'Failed to export profile.' });
    }
  };

  const handleImportFile = (file) => {
    if (!file) return;
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showToast({ error: true, message: 'Please upload a valid JSON file.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        
        // Validation logic
        if (!Array.isArray(parsed)) {
          throw new Error('Data must be a sections array.');
        }

        for (const section of parsed) {
          if (!section.id || !section.title || !Array.isArray(section.fields)) {
            throw new Error('Invalid section structure. Must contain id, title, and fields.');
          }
          for (const field of section.fields) {
            if (!field.id || !field.label || field.value === undefined) {
              throw new Error('Invalid field structure inside sections.');
            }
          }
        }

        const storageKey = user && user.username ? `applybuddy_data_${user.username}` : 'applybuddy_data';
        
        // Save to storage
        localStorage.setItem(storageKey, JSON.stringify(parsed));
        localStorage.setItem('applybuddy_data', JSON.stringify(parsed));
        
        // Notify of changes to extension
        window.postMessage({ type: 'APPLYBUDDY_LOCAL_UPDATE' }, '*');

        showToast({ error: false, message: 'Profile imported successfully! Reloading...' });
        
        setTimeout(() => {
          window.location.reload();
        }, 1200);

      } catch (err) {
        showToast({ error: true, message: `Import failed: ${err.message}` });
      }
    };
    reader.readAsText(file);
  };

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

              <div className="portability-section" style={{ padding: '4px 0 12px' }}>
                <h3 className="settings-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', margin: '0 0 6px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <FileJson size={14} className="field-icon" style={{ color: 'var(--accent)' }} /> Vault Portability
                </h3>
                <p className="settings-section-desc" style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 12px', lineHeight: 1.4 }}>
                  Export your dynamic sections and fields to a backup JSON file or import them from a previous backup.
                </p>
                
                <div className="portability-buttons">
                  <button
                    type="button"
                    className="btn-secondary portability-btn interactive"
                    onClick={handleExport}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', width: '100%', marginBottom: '12px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500, fontSize: '12px' }}
                  >
                    <Download size={14} /> Export Backup JSON
                  </button>
                  
                  <div 
                    className={`import-dropzone ${dragActive ? "drag-active" : ""}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    style={{
                      border: '2px dashed var(--border)',
                      borderRadius: '6px',
                      padding: '16px',
                      textAlign: 'center',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: dragActive ? 'var(--accent-dim)' : 'transparent',
                      borderColor: dragActive ? 'var(--accent)' : 'var(--border)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Upload size={16} className="dropzone-icon" style={{ color: 'var(--text-secondary)' }} />
                    <span>Drag & drop backup JSON here or </span>
                    <label className="import-label interactive" style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}>
                      Browse Files
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImportFile(e.target.files[0]);
                          }
                        }} 
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                </div>
              </div>

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
