'use client';

import { useEffect, useState } from 'react';
import { Moon, SunMedium } from 'lucide-react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem('theme');
    const isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    window.localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  if (!mounted) {
    return <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-base bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200" aria-label="Alternar tema" />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Alternar modo de tema"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-base bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
    >
      {dark ? <SunMedium size={18} /> : <Moon size={18} />}
    </button>
  );
}
