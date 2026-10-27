import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Sun, Moon, ArrowRight, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

export function Navbar() {
  const { user } = useAuthStore();
  const { effectiveTheme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/90 dark:border-neutral-800 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center shadow-xs group-hover:bg-black dark:group-hover:bg-white transition-colors">
            <Link2 className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold tracking-tight text-neutral-900 dark:text-white leading-none">
              LinkPulse
            </span>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium tracking-tight mt-0.5">
              URL Shortener & Analytics
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600 dark:text-neutral-300">
          <Link to="/" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            Home
          </Link>
          <Link
            to="/guest"
            className="flex items-center gap-1.5 text-neutral-900 dark:text-neutral-100 font-semibold hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
          >
            <span>Guest Shorten</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              No Sign Up
            </span>
          </Link>
          <a href="/#how-it-works" className="hover:text-neutral-900 dark:hover:text-white transition-colors">
            How It Works
          </a>
          <Link
            to="/admin/signin"
            className="hover:text-amber-600 dark:hover:text-amber-400 text-xs text-neutral-500 dark:text-neutral-400 transition-colors"
          >
            Admin UI
          </Link>
        </nav>

        {/* Actions & Theme toggle */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {effectiveTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {user ? (
            <button
              type="button"
              onClick={() => navigate('/app/dashboard')}
              className="pearl-btn-dark inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium cursor-pointer"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/signin')}
                className="pearl-btn-pearl inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium cursor-pointer"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="pearl-btn-dark inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium cursor-pointer"
              >
                Get Started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex sm:hidden items-center gap-1.5">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {effectiveTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drop menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="flex flex-col space-y-1.5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Home
            </Link>
            <Link
              to="/guest"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 font-semibold text-sky-600 dark:text-sky-400 flex items-center justify-between"
            >
              <span>Guest Shortener</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">No login</span>
            </Link>
            <a
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              How It Works
            </a>
            <Link
              to="/admin/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-amber-600 dark:text-amber-400"
            >
              Admin Portal UI Preview
            </Link>
          </div>
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-2">
            {user ? (
              <button
                type="button"
                className="pearl-btn-dark w-full py-2.5 rounded-xl text-sm font-medium"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/app/dashboard');
                }}
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="pearl-btn-pearl w-full py-2.5 rounded-xl text-sm font-medium"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signin');
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className="pearl-btn-dark w-full py-2.5 rounded-xl text-sm font-medium"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/signup');
                  }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
