import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function PublicLayout() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.className = 'theme-void';
    return () => {
      const savedTheme = localStorage.getItem('applybuddy_theme') || 'theme-void';
      document.documentElement.className = savedTheme;
    };
  }, []);

  // Close mobile menu on navigate
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="public-layout">
      {/* Navbar */}
      <nav className="public-nav">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <img src="/icon.png" alt="ApplyBuddy Logo" className="nav-logo" />
            <span>ApplyBuddy</span>
          </Link>
          
          {/* Hamburger button */}
          <button 
            className={`public-hamburger ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/about" className="nav-link">About</Link>
            <Link to="/developers" className="nav-link">Developers</Link>
            <a href="/applybuddy-extension.zip" className="nav-btn-ext interactive" download>
              Extension
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="public-main">
        <Outlet />
      </main>
    </div>
  );
}
