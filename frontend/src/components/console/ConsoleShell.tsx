'use client';

import toast from 'react-hot-toast';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { Activity, ChevronDown, CreditCard, Grid2X2, Key, List, LogOut, ReceiptText } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { brand, navLinks } from '@/components/marketing/marketingData';
import { BrandLogo, SiteFooter } from '@/components/marketing/MarketingLayout';
import { cn } from '@/lib/utils';

const consoleTabs = [
  { href: '/dashboard', aliases: ['/console', '/console/overview'], labelKey: 'overview', icon: Grid2X2 },
  { href: '/dashboard/api-keys', aliases: ['/console/api-keys', '/console/token'], labelKey: 'apiKeys', icon: Key },
  { href: '/dashboard/logs', aliases: ['/console/usage-logs'], labelKey: 'usageLogs', icon: ReceiptText },
  { href: '/dashboard/task-logs', aliases: ['/console/task-logs'], labelKey: 'taskLogs', icon: List },
  { href: '/dashboard/balance', aliases: ['/console/recharge'], labelKey: 'recharge', icon: CreditCard },
  { href: '/dashboard/invite', aliases: ['/console/activity'], labelKey: 'activity', icon: Activity },
] as const;

export function ConsoleShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasHydrated, hydrateAuth, fetchProfile, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const locale = useLocaleStore((state) => state.locale);
  const localeHydrated = useLocaleStore((state) => state.hasHydrated);
  const hydrateLocale = useLocaleStore((state) => state.hydrateLocale);
  const t = useLocaleStore((state) => state.t);

  useEffect(() => {
    if (!localeHydrated) hydrateLocale();
  }, [localeHydrated, hydrateLocale]);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    fetchProfile();
  }, [fetchProfile, hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div className="console-shell" data-locale={locale}>
      <header className="relative z-20 border-b border-cyan-700/15 bg-white/82 shadow-2xl shadow-cyan-950/10 backdrop-blur-2xl dark:border-cyan-200/10 dark:bg-[#070708]/78">
        <div className="console-container flex h-16 items-center justify-between">
          <BrandLogo />
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-500 dark:hover:text-white">{t(link.labelKey)}</Link>
            ))}
          </nav>
          <div className="relative flex items-center gap-5">
            <ThemeToggle />
            <LanguageToggle />
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-white to-cyan-100 px-5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:-translate-y-0.5"
            >
              <Grid2X2 className="h-4 w-4" />
              {t('console')}
            </button>
            <button onClick={() => setOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-700/15 bg-white/70 text-slate-700 transition hover:bg-white hover:text-slate-950 dark:border-cyan-200/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white">
              <ChevronDown className="h-4 w-4" />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-2xl border border-cyan-700/15 bg-white p-2 shadow-2xl shadow-slate-900/15 dark:border-white/10 dark:bg-[#111216] dark:shadow-black/50">
                <button onClick={logout} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-red-500 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-white/8">
                  <LogOut className="h-4 w-4" />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 border-b border-cyan-700/15 bg-cyan-50/70 backdrop-blur-xl dark:border-cyan-200/10 dark:bg-[#111827]/58">
        <nav className="console-container flex h-[58px] items-center justify-center gap-5 overflow-x-auto">
          {consoleTabs.map((item) => {
            const Icon = item.icon;
            const aliases: readonly string[] = item.aliases;
            const active = pathname === item.href || aliases.includes(pathname);
            return (
              <Link key={item.href} href={item.href} className={cn('inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold transition', active ? 'bg-cyan-100 text-slate-950 dark:bg-white/10 dark:text-white' : 'text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-white/6 dark:hover:text-white')}>
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>
      </div>

      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function ConsolePage({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('console-page py-10', className)}><div className="console-container">{children}</div></section>;
}

export function ConsoleEmpty({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      {icon && <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">{icon}</div>}
      <div className="text-2xl font-black text-slate-950 dark:text-white">{title}</div>
      {desc && <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">{desc}</p>}
    </div>
  );
}

export function ApiBaseBadge() {
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brand.baseUrl);
      toast.success(t('apiCopied'));
    } catch {
      toast.error(t('copyFailed'));
    }
  };
  return (
    <button type="button" onClick={copy} className="inline-flex h-9 items-center gap-3 rounded-full border border-cyan-700/15 bg-white/70 px-4 text-sm text-slate-700 dark:border-white/15 dark:bg-white/[0.03] dark:text-slate-300" data-locale={locale}>
      <span className="text-slate-500">{t('apiAddress')}</span>
      <code className="font-mono text-slate-950 dark:text-slate-100">{brand.baseUrl}</code>
      <span className="text-slate-400">⧉</span>
    </button>
  );
}
