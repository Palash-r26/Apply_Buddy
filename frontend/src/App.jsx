import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProfile } from './useProfile';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import Cursor from './components/Cursor';
import SectionBlock from './components/SectionBlock';
import AuthScreen from './components/AuthScreen';

function App() {
  // Auth state
  const [user, setUser] = useState({ id: 'local-guest', username: 'Guest' });
  const [isAuthChecking, setIsAuthChecking] = useState(false);

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
    toast,
    loadFromBackend
  } = useProfile();

  // Find first section to default to
  const initialActive = data.length > 0 ? data[0].id : '';
  const [activeSection, setActiveSection] = useState(initialActive);
  
  // Theme state synced with document element class
  const [theme, setTheme] = useState(() => {
    return document.documentElement.className || 'theme-void';
  });
  
  // Flash animation key triggered on theme toggle
  const [flashKey, setFlashKey] = useState(0);

  const observerRef = useRef(null);

  // Check auth session on mount
  useEffect(() => {
    // checkAuth temporarily disabled
  }, []);

  // Auth handler — called from AuthScreen on successful login/register
  const handleAuth = (newUser) => {
    setUser(newUser);
    // Trigger a fresh load from the backend
    loadFromBackend();
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
    localStorage.removeItem('applybuddy_user');
    localStorage.removeItem('applybuddy_data');
    setUser(null);
  };

  // Smooth scroll click handler
  const handleLinkClick = (sectionId) => {
    const targetElement = document.getElementById(sectionId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
    }
  };

  // Toggle Theme helper
  const toggleTheme = () => {
    const currentTheme = document.documentElement.className;
    const nextTheme = currentTheme === 'theme-paper' ? 'theme-void' : 'theme-paper';
    document.documentElement.className = nextTheme;
    setTheme(nextTheme);
    localStorage.setItem('applybuddy_theme', nextTheme);
    setFlashKey(prev => prev + 1);
  };

  // Set up IntersectionObserver to update active navigation links on scroll
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

    const sectionElements = document.querySelectorAll('.section-block');
    sectionElements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [data]);

  // Handle active item adjustment when data items are added or deleted
  useEffect(() => {
    if (data.length > 0 && !data.some(s => s.id === activeSection)) {
      setActiveSection(data[0].id);
    }
  }, [data, activeSection]);

  if (isAuthChecking) {
    return null; // Or a subtle loading spinner
  }

  // If not authenticated, show auth screen
  if (!user) {
    return (
      <>
        <AuthScreen onAuth={handleAuth} />
        <Cursor />
      </>
    );
  }

  return (
    <>
      <div className="app-grid">
        <Sidebar
          sections={data}
          activeSection={activeSection}
          onLinkClick={handleLinkClick}
          onAddSection={addSection}
          onToggleTheme={toggleTheme}
          theme={theme}
          user={user}
          onLogout={handleLogout}
        />

        <div className="content-area">
          <div className="content-inner">
            {data.length > 0 ? (
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08
                    }
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
          </div>
        </div>
      </div>

      <Toast visible={toast.visible} error={toast.error} message={toast.message} />
      <Cursor />
    </>
  );
}

export default App;
