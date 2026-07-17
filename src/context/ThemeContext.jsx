import { createContext, useContext, useEffect, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/constants';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const prefersDark = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.THEME, prefersDark === false ? 'light' : 'dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', theme === 'light');
    root.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
      setTheme,
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
