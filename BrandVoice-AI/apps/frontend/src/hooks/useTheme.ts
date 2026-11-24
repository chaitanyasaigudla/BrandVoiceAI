import { useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
  useEffect(() => {
    const saved = localStorage.getItem('brandvoice-theme') as Theme | null;
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const theme = saved ?? preferred;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains('dark');
  const next: Theme = isDark ? 'light' : 'dark';
  document.documentElement.classList.toggle('dark', next === 'dark');
  localStorage.setItem('brandvoice-theme', next);
  return next;
}

export function getTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}
