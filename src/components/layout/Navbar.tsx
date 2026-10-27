import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Link2, Sun, Moon, Menu, X, ArrowRight } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

export function Navbar() {
  const { effectiveTheme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.hash]);

  // Handle smooth scroll to #features if already on home page
  const handleFeaturesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === '/') {
      e.preventDefault();
      const el = document.getElementById('features');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.hash = 'features';
      }
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo - navigates to / */}
        <Link
          to="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white rounded-lg p-1"
          aria-label="Linko Home"
        >
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shadow-xs group-hover:bg-black dark:group-hover:bg-white transition-colors">
            <Link2 className="w-4.5 h-4.5 stroke-[2.4]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none">
              Linko
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-tight mt-0.5">
              Shorten smarter. Share safer.
            </span>
          </div>
        </Link>

        {/* Minimal Navigation: Guest Shorten, Features, Login */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-300"
        >
          <Link
            to="/shorten"
            className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100 font-semibold hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white rounded-md px-2 py-1"
          >
            <span>Guest Shorten</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 font-normal">
              No Sign Up
            </span>
          </Link>

          <a
            href="/#features"
            onClick={handleFeaturesClick}
            className="hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white rounded-md px-2 py-1"
          >
            Features
          </a>

          <Link
            to="/auth/login"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white rounded-md px-2 py-1"
          >
            Login
          </Link>
        </nav>

        {/* Right side: Theme toggle and quick action */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
          >
            {effectiveTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          <button
            type="button"
            onClick={() => navigate('/shorten')}
            className="pearl-btn-dark inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
          >
            <span>Shorten Link</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
          >
            {effectiveTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Accessible Responsive Mobile Menu (strictly at 320px width without horizontal overflow) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-label="Mobile Navigation"
          className="sm:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 pt-3 pb-6 space-y-3 shadow-lg"
        >
          <nav className="flex flex-col space-y-1 py-1 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
            >
              Home
            </Link>
            <Link
              to="/shorten"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 font-semibold text-neutral-900 dark:text-white flex items-center justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
            >
              <span>Guest Shorten</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-normal">
                No Sign Up
              </span>
            </Link>
            <a
              href="/#features"
              onClick={handleFeaturesClick}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
            >
              Features
            </a>
            <Link
              to="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white"
            >
              Login
            </Link>
          </nav>

          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              className="pearl-btn-dark w-full py-2.5 rounded-xl text-xs font-semibold min-h-[44px]"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/shorten');
              }}
            >
              Start Shortening (Free)
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
