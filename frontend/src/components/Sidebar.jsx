import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

export default function Sidebar({
  sections,
  activeSection,
  onLinkClick,
  onAddSection,
  onToggleTheme,
  theme,
  user,
  onLogout,
  isCollapsed,
  onToggleCollapse,
  onOpenSettings,
  isMobileSidebarOpen,
  onMobileClose
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

  // On mobile drawer, always show expanded view regardless of desktop collapse state
  const effectivelyCollapsed = isCollapsed && !isMobileSidebarOpen;

  return (
    <motion.div
      className={`sidebar${isMobileSidebarOpen ? ' sidebar-mobile-open' : ''}`}
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: effectivelyCollapsed ? 80 : 240 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className={`sidebar-top ${effectivelyCollapsed ? 'sidebar-top-collapsed' : ''}`}>
        {effectivelyCollapsed ? (
          <img
            src="/icon.png"
            alt="ApplyBuddy"
            className="sidebar-collapsed-logo"
          />
        ) : (
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
        )}
        <button 
          className="sidebar-collapse-btn interactive" 
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <ul className="nav-links">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`nav-link interactive ${isActive ? 'active' : ''} ${effectivelyCollapsed ? 'nav-link-collapsed' : ''}`}
                title={effectivelyCollapsed ? section.title : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onLinkClick(section.id);
                  if (onMobileClose) onMobileClose();
                }}
              >
                {effectivelyCollapsed ? (
                  <div className={`nav-dot-collapsed ${isActive ? 'nav-dot-collapsed--active' : ''}`} />
                ) : (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="active-dot"
                        className="nav-dot"
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      />
                    )}
                    {section.title}
                  </>
                )}
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
              style={{ overflow: 'hidden', marginBottom: '8px' }}
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

        {!effectivelyCollapsed && (
          <button
            className="add-section-btn interactive"
            onClick={() => setShowAddInput(prev => !prev)}
          >
            + Add Section
          </button>
        )}

        <a 
          href="/applybuddy-extension.zip" 
          className="download-ext-btn interactive" 
          download
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: effectivelyCollapsed ? 'center' : 'flex-start',
            gap: '8px',
            color: 'var(--accent)',
            fontSize: '11px',
            textDecoration: 'none',
            margin: '8px 0 12px',
            padding: '8px 10px',
            borderRadius: '8px',
            border: '1px dashed var(--accent)',
            background: 'var(--accent-dim)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
          title="Download Chrome Extension (.zip)"
        >
          {effectivelyCollapsed ? (
            <span style={{ fontWeight: 800, fontSize: '9px', letterSpacing: '0.5px' }}>EXT</span>
          ) : (
            <span style={{ fontWeight: 500, letterSpacing: '0.3px' }}>Download Extension</span>
          )}
        </a>

        <button className="theme-toggle interactive" onClick={onToggleTheme}>
          <motion.div
            animate={{ rotate: theme === 'theme-void' ? 0 : 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{ display: 'inline-block', lineHeight: 1 }}
          >
            ✦
          </motion.div>
          {!effectivelyCollapsed && <span>{theme === 'theme-void' ? 'VOID' : 'PAPER'}</span>}
        </button>
      </div>

      {user && (
        <div className={`sidebar-user ${effectivelyCollapsed ? 'collapsed' : ''}`}>
          {!effectivelyCollapsed ? (
            <>
              <span className="sidebar-user-name" title={user.username}>✦ {user.username}</span>
              <button 
                className="sidebar-settings-btn interactive" 
                onClick={onOpenSettings} 
                title="Settings"
                style={{ flexShrink: 0 }}
              >
                <Settings size={14} />
              </button>
              <button className="sidebar-logout-btn interactive" onClick={onLogout} title="Logout">
                Logout
              </button>
            </>
          ) : (
            <div className="sidebar-user-collapsed">
              <button className="sidebar-settings-btn interactive" onClick={onOpenSettings} title="Settings">
                <Settings size={14} />
              </button>
              <button className="sidebar-logout-btn-collapsed interactive" onClick={onLogout} title="Logout">
                ✕
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
