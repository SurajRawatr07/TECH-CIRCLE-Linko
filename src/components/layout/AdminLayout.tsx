import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  BarChart3,
  Link as LinkIcon,
  ShieldAlert,
  Ban,
  ArrowLeft,
  AlertTriangle,
  History,
  Activity,
  ScrollText,
  Sliders,
  Menu,
  Sun,
  Moon,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { ToastContainer } from '../ui/ToastContainer';
import { Drawer } from '../ui/Drawer';
import { cn } from '../../lib/utils';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { effectiveTheme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const adminNav = [
    { label: 'Platform Overview', path: '/admin/overview', icon: BarChart3 },
    { label: 'Link Review & Safety', path: '/admin/links', icon: LinkIcon },
    { label: 'Reported Links Queue', path: '/admin/abuse', icon: ShieldAlert },
    { label: 'Blocklist Management', path: '/admin/blocklist', icon: Ban },
    { label: 'Destination-Change Guardian', path: '/admin/destinations', icon: History },
    { label: 'Traffic Anomaly Watch', path: '/admin/anomalies', icon: Activity },
    { label: 'Audit-Event Viewer', path: '/admin/audit', icon: ScrollText },
    { label: 'Policy Configuration', path: '/admin/policies', icon: Sliders },
  ];

  const currentLabel =
    adminNav.find((i) => location.pathname === i.path || location.pathname.startsWith(i.path + '/'))?.label ||
    'Administrative Console';

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
            <Shield className="w-4.5 h-4.5 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold tracking-tight text-white leading-none">
                LinkPulse
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 uppercase tracking-wider border border-amber-400/30">
                Admin Preview
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Platform Safety & Oversight
            </span>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Governance Sections
          </p>
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/admin/overview' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-xl transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-slate-950' : 'text-slate-400')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Exit Preview Footer */}
      <div className="p-3 border-t border-slate-800">
        <Link
          to="/"
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
        >
          <span className="flex items-center gap-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit Admin Preview</span>
          </span>
          <ChevronRight className="w-3 h-3 text-slate-500" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      {/* Permanent Non-Production Admin Disclaimer Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 shadow-sm z-50">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Non-Production Admin UI Preview:</strong> Frontend demonstration only.
            No server-side role verification or authorization is active. Production administrative security will be provided by the future backend.
          </span>
        </div>
        <Link
          to="/admin/signin"
          className="hidden sm:inline-flex items-center gap-1 text-[11px] underline font-semibold hover:opacity-80 shrink-0"
        >
          <span>View Architecture Details</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-800 bg-slate-950 z-20">
          <NavContent />
        </aside>

        {/* Mobile Drawer */}
        <Drawer
          isOpen={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          title="Admin Menu"
        >
          <NavContent />
        </Drawer>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden bg-slate-900 text-slate-100">
          {/* Header */}
          <header className="sticky top-0 z-30 h-14 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileDrawerOpen(true)}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                aria-label="Open administrative navigation"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                <span className="hidden sm:inline">Admin Preview</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
                <span className="font-semibold text-white truncate">
                  {currentLabel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/app/dashboard"
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Go to User Workspace →
              </Link>
              <button
                onClick={toggleTheme}
                aria-label="Toggle dark mode"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {effectiveTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}
