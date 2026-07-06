'use client';

import { useEffect } from 'react';
import { Languages } from 'lucide-react';
import { useLocaleStore } from '@/stores/localeStore';

export default function LanguageToggle() {
  const locale = useLocaleStore((state) => state.locale);
  const hasHydrated = useLocaleStore((state) => state.hasHydrated);
  const hydrateLocale = useLocaleStore((state) => state.hydrateLocale);
  const toggleLocale = useLocaleStore((state) => state.toggleLocale);
  const t = useLocaleStore((state) => state.t);

  useEffect(() => {
    if (!hasHydrated) hydrateLocale();
  }, [hasHydrated, hydrateLocale]);

  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="matrix-language-toggle"
      title={locale === 'zh' ? t('switchEnglish') : t('switchChinese')}
      aria-label={locale === 'zh' ? t('switchEnglish') : t('switchChinese')}
    >
      <Languages className="h-4 w-4" />
      <span>{locale === 'zh' ? '中' : 'EN'}</span>
    </button>
  );
}
