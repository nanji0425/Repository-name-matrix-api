'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { useLocaleStore } from '@/stores/localeStore';
import { Users, Key, Brain, Globe, DollarSign, ShoppingCart, Gift, Bell, Settings, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin', labelKey: 'adminOverview', icon: Shield },
  { href: '/admin/users', labelKey: 'userManagement', icon: Users },
  { href: '/admin/api-keys', labelKey: 'keyAudit', icon: Key },
  { href: '/admin/models', labelKey: 'modelManagement', icon: Brain },
  { href: '/admin/providers', labelKey: 'providerChannels', icon: Globe },
  { href: '/admin/finance', labelKey: 'financeStats', icon: DollarSign },
  { href: '/admin/orders', labelKey: 'orderManagement', icon: ShoppingCart },
  { href: '/admin/commissions', labelKey: 'commissionManagement', icon: Gift },
  { href: '/admin/announcements', labelKey: 'announcementManagement', icon: Bell },
  { href: '/admin/settings', labelKey: 'systemParams', icon: Settings },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hasHydrated, hydrateAuth, fetchProfile } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!user) {
      fetchProfile();
      return;
    }
    if (user.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [fetchProfile, hasHydrated, isAuthenticated, router, user]);

  if (!hasHydrated || !isAuthenticated || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fbff_0%,#eef7f6_45%,#f7f2ff_100%)] text-slate-600 dark:bg-[linear-gradient(135deg,#020617_0%,#07111f_45%,#0f172a_100%)]">
        <div className="tech-surface flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl shadow-slate-900/10 backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          {t('validatingAdmin')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#eef7f6_45%,#f7f2ff_100%)] dark:bg-[linear-gradient(135deg,#020617_0%,#07111f_45%,#0f172a_100%)]" data-locale={locale}>
      <aside className="fixed left-0 top-0 z-40 min-h-screen w-64 border-r border-cyan-200/10 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-950/30 dark:bg-black/70">
        <div className="tech-surface mb-7 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 font-black text-slate-950">M</span>
            <div>
              <div className="text-sm font-black">MatrixAPI</div>
              <div className="text-xs text-cyan-100/70">{t('adminConsole')}</div>
            </div>
          </div>
        </div>

        <nav className="space-y-1.5">
          {adminLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-cyan-950/20',
                  isActive && 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20 hover:bg-cyan-300 hover:text-slate-950',
                )}
              >
                <Icon className="h-4 w-4" />
                {t(link.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('backToDashboard')}
          </Link>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-cyan-200/20 bg-white/72 px-8 shadow-lg shadow-cyan-950/5 backdrop-blur-xl dark:bg-slate-950/72">
          <div>
            <div className="text-sm font-bold text-slate-950 dark:text-white">{t('adminCenter')}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('adminSubtitle')}</div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
