import React from 'react';
import { Link } from 'react-router-dom';
import { Link2 } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-neutral-950 text-neutral-400 border-t border-neutral-800 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-neutral-800/80">
          {/* Brand Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white font-display text-lg font-bold tracking-tight hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-lg bg-white text-neutral-950 flex items-center justify-center font-bold text-xs">
                <Link2 className="w-4 h-4 stroke-[2.4]" />
              </div>
              <span>Linko</span>
            </Link>
            <span className="hidden sm:inline text-neutral-700 py-1">·</span>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm sm:py-0.5">
              Shorten smarter. Share safer.
            </p>
          </div>

          {/* Clean minimal footer links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm">
            <Link to="/" className="text-neutral-400 hover:text-white transition-colors">
              Home
            </Link>
            <Link to="/shorten" className="text-neutral-400 hover:text-white transition-colors">
              Guest Shorten
            </Link>
            <a href="/#features" className="text-neutral-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="/#faq" className="text-neutral-400 hover:text-white transition-colors">
              FAQ
            </a>
            <Link to="/auth/login" className="text-neutral-400 hover:text-white transition-colors">
              Login
            </Link>
          </div>
        </div>

        {/* Bottom copyright & local mode info */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <p className="text-center sm:text-left">
            © {currentYear} Linko. All rights reserved.
          </p>
          <p className="text-center sm:text-right text-[11px] text-neutral-500">
            Link Security & Shortening Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}
