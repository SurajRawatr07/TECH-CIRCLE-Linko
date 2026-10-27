import { create } from 'zustand';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'system',
  effectiveTheme: 'light',

  initTheme: () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = (localStorage.getItem('linko_theme') || localStorage.getItem('linkpulse_theme')) as ThemeMode | null;
      const initialTheme = stored || 'system';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effective = initialTheme === 'system' ? (prefersDark ? 'dark' : 'light') : initialTheme;

      if (effective === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      set({ theme: initialTheme, effectiveTheme: effective });
    } catch {
      // fallback
    }
  },

  setTheme: (theme: ThemeMode) => {
    try {
      localStorage.setItem('linko_theme', theme);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

      if (effective === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      set({ theme, effectiveTheme: effective });
    } catch {}
  },

  toggleTheme: () => {
    const current = get().effectiveTheme;
    const next = current === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
