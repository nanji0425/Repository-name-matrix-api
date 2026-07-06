'use client';

import { useEffect, useState } from 'react';
import { Moon, SunMedium } from 'lucide-react';
import { useLocaleStore } from '@/stores/localeStore';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
    setDark(isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  if (!mounted) return <div className="h-10 w-10" />;

  return (
    <button
      type="button"
      onClick={toggle}
      className="matrix-icon-toggle"
      data-locale={locale}
      title={dark ? t('themeLight') : t('themeDark')}
      aria-label={dark ? t('themeLight') : t('themeDark')}
    >
      {dark ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
