import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

export default function PublicLayout() {
  const location = useLocation();
  const isDevPage = location.pathname === '/developers';
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    document.documentElement.className = 'theme-void';
    return () => {
      const savedTheme = localStorage.getItem('applybuddy_theme') || 'theme-void';
      document.documentElement.className = savedTheme;
    };
  }, []);
  return (
    <div className="public-layout">
      {/* Navbar */}
      <nav className="public-nav">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <img src="/icon.png" alt="ApplyBuddy Logo" className="nav-logo" />
            <span>ApplyBuddy</span>
          </Link>
          
          <div className="nav-links">
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
