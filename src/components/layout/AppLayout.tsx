import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Link2,
  BarChart3,
  Link as LinkIcon,
  PlusCircle,
  FileSpreadsheet,
  FolderKanban,
  Tags,
  Settings,
  Shield,
  Users,
  Ban,
  LogOut,
  Sun,
  Moon,
  Menu,
  ChevronRight,
  QrCode,
  Sparkles,
  Sliders,
  Clock,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { ToastContainer } from '../ui/ToastContainer';
import { Drawer } from '../ui/Drawer';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { API_CONFIG } from '../../config/api';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuthStore();
  const { effectiveTheme, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // In local mode without a backend, provide seamless access via a Local Workspace session
  const isBackendConnected = API_CONFIG.isBackendConnected;
  const activeUser = user || {
    id: 'local_workspace_user',
    name: 'Local Workspace',
    email: 'local@browser.storage',
    role: 'user' as const,
  };

  const userNav = [
    { label: 'Overview', path: '/app/dashboard', icon: BarChart3 },
    { label: 'My Links', path: '/app/links', icon: LinkIcon },
    { label: 'Create Link', path: '/app/links/new', icon: PlusCircle },
    { label: 'QR Studio', path: '/app/qr', icon: QrCode },
    { label: 'Link-in-Bio', path: '/app/bio', icon: Sparkles },
    { label: 'Policy Lab', path: '/app/policy-lab', icon: Sliders },
    { label: 'Link Lifecycle', path: '/app/lifecycle', icon: Clock },
    { label: 'Campaigns', path: '/app/campaigns', icon: FolderKanban },
    { label: 'Tags', path: '/app/tags', icon: Tags },
    { label: 'Bulk CSV Import', path: '/app/links/import', icon: FileSpreadsheet },
    { label: 'Trust & Safety', path: '/app/trust-center', icon: Shield },
    { label: 'Workspace Settings', path: '/app/settings', icon: Settings },
  ];

  const currentLabel =
    userNav.find(
      (i) =>
        location.pathname === i.path ||
        (i.path !== '/app/links' && i.path !== '/app/dashboard' && location.pathname.startsWith(i.path))
    )?.label || 'Workspace';

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#faf9f6] dark:bg-neutral-900/90 text-neutral-900 dark:text-neutral-100">
      {/* Brand Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="Linko Home">
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs transition-colors">
            <Link2 className="w-4.5 h-4.5 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold tracking-tight text-neutral-900 dark:text-white leading-none block">
                Linko
              </span>
              {!isBackendConnected && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  Local Mode
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-500 font-medium">
              Shorten smarter. Share safer.
            </span>
          </div>
        </Link>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        <div>
          <p className="px-3 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            User Workspace
          </p>
          <nav className="space-y-1">
            {userNav.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/app/links' && item.path !== '/app/dashboard' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-xl transition-all whitespace-nowrap',
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold shadow-2xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white dark:text-neutral-900' : 'text-neutral-500')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Link to Admin Preview */}
        <div className="pt-2 px-1">
          <Link
            to="/admin"
            onClick={() => setMobileDrawerOpen(false)}
            className="w-full flex items-center justify-between p-2.5 text-xs rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-semibold">Admin Preview</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800">
          <div className="min-w-0 pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {activeUser.name}
              </span>
              <Badge variant={isBackendConnected ? 'success' : 'outline'} size="sm">
                {isBackendConnected ? 'Online' : 'Local'}
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate font-mono">
              {activeUser.email}
            </p>
          </div>

          {user && (
            <button
              onClick={async () => {
                await logout();
                navigate('/auth/login');
              }}
              title="Log out"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {/* Desktop Sidebar (240px) */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-[#faf9f6] dark:bg-neutral-900/90 z-20">
        <NavContent />
      </aside>

      {/* Mobile Drawer */}
      <Drawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="Menu"
      >
        <NavContent />
      </Drawer>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 truncate">
              <span className="hidden sm:inline">Workspace</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 hidden sm:inline" />
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                {currentLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/shorten"
              className="text-xs px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              Guest Shorten
            </Link>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {effectiveTheme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </header>

        {/* Local Mode Notice banner if offline */}
        {!isBackendConnected && (
          <div className="bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-4 py-2 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <Info className="w-3.5 h-3.5 text-neutral-800 dark:text-neutral-200 shrink-0" />
              <span>
                <strong>Local Workspace Mode:</strong> Storing links, QR codes, and click simulations in browser storage.
              </span>
            </div>
            <Link
              to="/admin"
              className="text-[11px] font-semibold text-neutral-900 dark:text-white underline hover:opacity-80 shrink-0"
            >
              Preview Admin Portal →
            </Link>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
