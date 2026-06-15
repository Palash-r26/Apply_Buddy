import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useProfile } from './useProfile';
import Sidebar from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import Cursor from './components/Cursor';
import SectionBlock from './components/SectionBlock';
import PublicLayout from './components/PublicLayout';
import Landing from './components/Landing';
import About from './components/About';
import Developers from './components/Developers';
import ResetPassword from './components/ResetPassword';
import SandboxLab from './components/SandboxLab';
import { apiFetch } from './api.js';

function App() {
  // Auth state - start null so we know we're checking
  const [user, setUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const {
    data,
    isLoaded,
    addSection,
    renameSection,
    deleteSection,
    addField,
    updateFieldMeta,
    updateFieldValue,
    deleteField,
    saveChanges,
    hasUnsavedChanges,
    toast,
    loadFromBackend,
    triggerToast
  } = useProfile(user);

  const [showSettings, setShowSettings] = useState(false);
  const initialActive = data && data.length > 0 ? data[0].id : '';
  const [activeSection, setActiveSection] = useState(initialActive);
  
  const [theme, setTheme] = useState(() => {
    return document.documentElement.className || 'theme-void';
  });
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [flashKey, setFlashKey] = useState(0);
  const observerRef = useRef(null);
  const sectionObserverSignature = (data || []).map(section => section.id).join('|');

  useEffect(() => {
    // Check if we have a saved user
    const savedUser = localStorage.getItem('applybuddy_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        setUser(null);
      }
    }
    setIsAuthChecking(false);
  }, []);

  const handleAuth = (newUser) => {
    setUser(newUser);
    loadFromBackend();
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem('applybuddy_user');
    localStorage.removeItem('applybuddy_data');
    setUser(null);
  };

  const handleLinkClick = (sectionId) => {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  const toggleTheme = () => {
    const currentTheme = document.documentElement.className;
    const nextTheme = currentTheme === 'theme-paper' ? 'theme-void' : 'theme-paper';
    document.documentElement.className = nextTheme;
    setTheme(nextTheme);
    localStorage.setItem('applybuddy_theme', nextTheme);
    setFlashKey(prev => prev + 1);
  };

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section-id');
            if (sectionId) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      {
        threshold: 0.3,
        rootMargin: '-5% 0px -50% 0px'
      }
    );

    // Only observe if we are on the vault page
    const sectionElements = document.querySelectorAll('.section-block');
    if (sectionElements.length > 0) {
      sectionElements.forEach((el) => observerRef.current.observe(el));
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [sectionObserverSignature]);

  useEffect(() => {
    if (data && data.length > 0 && !data.some(s => s.id === activeSection)) {
      setActiveSection(data[0].id);
    }
  }, [data, activeSection]);

  if (isAuthChecking) {
    return null;
  }

  const vaultElement = (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Mobile overlay backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <Sidebar
        sections={data || []}
        activeSection={activeSection}
        onLinkClick={handleLinkClick}
        onAddSection={addSection}
        onToggleTheme={toggleTheme}
        theme={theme}
        user={user}
        onLogout={handleLogout}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onOpenSettings={() => setShowSettings(true)}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div
        className="vault-content-area"
        style={{ 
          flex: 1, 
          marginLeft: isSidebarCollapsed ? 80 : 240, 
          height: '100vh', 
          overflowY: 'auto', 
          backgroundColor: 'var(--bg)',
          transition: 'margin-left 0.3s ease'
        }}
      >
        {/* Mobile hamburger button */}
        <button
          className="mobile-menu-btn interactive"
          onClick={() => setIsMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>

        <div className="content-inner">
          {activeSection === 'sandbox' ? (
            <SandboxLab data={data} />
          ) : data && data.length > 0 ? (
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08 }
                }
              }}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence>
                {data.map((section) => (
                  <SectionBlock
                    key={section.id}
                    section={section}
                    onRename={renameSection}
                    onDelete={deleteSection}
                    onAddField={addField}
                    onUpdateFieldMeta={updateFieldMeta}
                    onUpdateFieldValue={updateFieldValue}
                    onDeleteField={deleteField}
                    flashKey={flashKey}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="empty-state">
              <motion.span
                className="empty-plus"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                ✦
              </motion.span>
              <p>No sections yet. Add one from the sidebar.</p>
            </div>
          )}

          {hasUnsavedChanges && (
            <div
              style={{
                position: 'sticky',
                bottom: '16px',
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '16px',
                zIndex: 10,
                pointerEvents: 'none'
              }}
            >
              <button
                className="btn-primary interactive"
                onClick={saveChanges}
                style={{ pointerEvents: 'auto', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.22)' }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
      <Toast visible={toast.visible} error={toast.error} message={toast.message} />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        onUpdateUser={setUser}
        showToast={({ error, message }) => triggerToast(message, error)}
      />
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/vault" replace /> : <PublicLayout theme={theme} onToggleTheme={toggleTheme} />}>
          <Route index element={<Landing onAuth={handleAuth} />} />
          <Route path="about" element={<About />} />
          <Route path="developers" element={<Developers />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Route>
        
        <Route path="/vault" element={user ? vaultElement : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Cursor />
    </BrowserRouter>
  );
}

export default App;
