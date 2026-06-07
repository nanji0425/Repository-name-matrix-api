'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { Activity, ChevronDown, CreditCard, Grid2X2, Key, List, LogOut, Moon, ReceiptText } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { brand, navLinks } from '@/components/marketing/marketingData';
import { BrandLogo, SiteFooter } from '@/components/marketing/MarketingLayout';
import { cn } from '@/lib/utils';

const consoleTabs = [
  { href: '/dashboard', aliases: ['/console', '/console/overview'], label: '总览', icon: Grid2X2 },
  { href: '/dashboard/api-keys', aliases: ['/console/api-keys', '/console/token'], label: 'API 密钥', icon: Key },
  { href: '/dashboard/logs', aliases: ['/console/usage-logs'], label: '消费日志', icon: ReceiptText },
  { href: '/dashboard/task-logs', aliases: ['/console/task-logs'], label: '任务日志', icon: List },
  { href: '/dashboard/balance', aliases: ['/console/recharge'], label: '充值', icon: CreditCard },
  { href: '/dashboard/invite', aliases: ['/console/activity'], label: '活动', icon: Activity },
];

export function ConsoleShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasHydrated, hydrateAuth, fetchProfile, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
    <div className="console-shell">
      <header className="border-b border-white/10 bg-[#070708]">
        <div className="console-container flex h-16 items-center justify-between">
          <BrandLogo />
          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-500 transition hover:text-white">{link.label}</Link>
            ))}
          </nav>
          <div className="relative flex items-center gap-5">
            <Moon className="h-4 w-4 text-slate-500" />
            <button onClick={() => setOpen((value) => !value)} className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-950">
              <Grid2X2 className="h-4 w-4" />
              控制台
              <ChevronDown className="h-4 w-4" />
            </button>
            {open && (
              <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-2xl border border-white/10 bg-[#111216] p-2 shadow-2xl shadow-black/50">
                <button onClick={logout} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-red-400 transition hover:bg-white/8">
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-white/10 bg-[#151517]">
        <nav className="console-container flex h-[58px] items-center justify-center gap-5 overflow-x-auto">
          {consoleTabs.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || item.aliases.includes(pathname);
            return (
              <Link key={item.href} href={item.href} className={cn('inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-bold transition', active ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/6 hover:text-white')}>
                <Icon className="h-4 w-4" />
                {item.label}
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
      {icon && <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-slate-400">{icon}</div>}
      <div className="text-2xl font-black text-white">{title}</div>
      {desc && <p className="mt-3 text-sm text-slate-400">{desc}</p>}
    </div>
  );
}

export function ApiBaseBadge() {
  const copy = async () => navigator.clipboard.writeText(brand.baseUrl);
  return (
    <button onClick={copy} className="inline-flex h-9 items-center gap-3 rounded-full border border-white/15 bg-white/[0.03] px-4 text-sm text-slate-300">
      <span className="text-slate-500">API地址：</span>
      <code className="font-mono text-slate-100">{brand.baseUrl}</code>
      <span className="text-slate-400">⧉</span>
    </button>
  );
}
