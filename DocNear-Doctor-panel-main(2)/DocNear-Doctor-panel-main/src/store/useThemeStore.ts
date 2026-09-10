import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => {
  const saved = (localStorage.getItem('docnear_theme') as Theme) || 'dark';
  applyTheme(saved);

  return {
    theme: saved,
    setTheme: (newTheme) => {
      localStorage.setItem('docnear_theme', newTheme);
      applyTheme(newTheme);
      set({ theme: newTheme });
    },
  };
});

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
