import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar({
  sections,
  activeSection,
  onLinkClick,
  onAddSection,
  onToggleTheme,
  theme,
  user,
  onLogout
}) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [sectionTitle, setSectionTitle] = useState('');
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const inputRef = useRef(null);

  const appNameChars = Array.from("ApplyBuddy");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const charVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 200, damping: 12 }
    }
  };

  const handleAddSubmit = () => {
    if (!sectionTitle.trim()) {
      setShakeTrigger(true);
      setTimeout(() => setShakeTrigger(false), 500);
      return;
    }
    onAddSection(sectionTitle.trim());
    setSectionTitle('');
    setShowAddInput(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAddSubmit();
    } else if (e.key === 'Escape') {
      setSectionTitle('');
      setShowAddInput(false);
    }
  };

  useEffect(() => {
    if (showAddInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddInput]);

  return (
    <motion.div
      className="sidebar"
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="sidebar-top">
        <motion.h1
          className="app-name"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {appNameChars.map((char, index) => (
            <motion.span key={index} style={{ display: 'inline-block' }} variants={charVariants}>
              {char}
            </motion.span>
          ))}
        </motion.h1>
      </div>

      <ul className="nav-links">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`nav-link interactive ${isActive ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onLinkClick(section.id);
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="nav-dot"
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  />
                )}
                {section.title}
              </a>
            </li>
          );
        })}
      </ul>

      <div className="sidebar-bottom">
        <AnimatePresence>
          {showAddInput && (
            <motion.div
              className="sidebar-add-section-input-wrapper"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <motion.input
                ref={inputRef}
                type="text"
                className="sidebar-add-section-input interactive"
                placeholder="Section title..."
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                animate={shakeTrigger ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                transition={{ duration: 0.4 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className="add-section-btn interactive"
          onClick={() => setShowAddInput(prev => !prev)}
        >
          + Add Section
        </button>

        <button className="theme-toggle interactive" onClick={onToggleTheme}>
          <motion.div
            animate={{ rotate: theme === 'theme-void' ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ display: 'inline-block', lineHeight: 1 }}
          >
            ✦
          </motion.div>
          <span>{theme === 'theme-void' ? 'VOID' : 'PAPER'}</span>
        </button>
      </div>

      {user && (
        <div className="sidebar-user">
          <span className="sidebar-user-name">✦ {user.username}</span>
          <button className="sidebar-logout-btn interactive" onClick={onLogout}>
            Logout
          </button>
        </div>
      )}
    </motion.div>
  );
}
