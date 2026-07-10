'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Bell,
  BarChart3,
  ChevronDown,
  CreditCard,
  Grid2X2,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Search,
  Settings2,
  User,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { brand } from '@/components/marketing/marketingData';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { BrandLogo } from '@/components/marketing/MarketingLayout';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  aliases?: string[];
};

const primaryNav: NavItem[] = [
  { href: '/', label: '主页', icon: LayoutDashboard },
  { href: '/dashboard', label: '控制台', icon: Grid2X2 },
  { href: '/models', label: '模型广场', icon: BarChart3 },
  { href: '/news', label: '排行榜', icon: ScrollText },
  { href: '/docs', label: '教程文档', icon: KeyRound },
];

const sidebarGroups: { title: string; items: NavItem[] }[] = [
  {
    title: '常规',
    items: [
      { href: '/dashboard', label: '概览', icon: LayoutDashboard, aliases: ['/dashboard/overview', '/console', '/console/overview'] },
      { href: '/dashboard/stats', label: '数据看板', icon: BarChart3, aliases: ['/console/activity'] },
      { href: '/dashboard/api-keys', label: 'API 密钥', icon: KeyRound, aliases: ['/console/api-keys', '/console/token'] },
      { href: '/dashboard/logs', label: '使用日志', icon: ScrollText, aliases: ['/console/usage-logs'] },
      { href: '/dashboard/task-logs', label: '任务日志', icon: Menu, aliases: ['/console/task-logs'] },
    ],
  },
  {
    title: '个人',
    items: [
      { href: '/dashboard/balance', label: '钱包充值', icon: CreditCard, aliases: ['/console/recharge'] },
      { href: '/dashboard/settings', label: '个人资料', icon: User, aliases: ['/console/token'] },
    ],
  },
];

export function ConsoleShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, hasHydrated, hydrateAuth, fetchProfile, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const activePrimary = useMemo(
    () => primaryNav.find((item) => pathname === item.href || item.aliases?.includes(pathname))?.href,
    [pathname],
  );

  const onNotify = () => toast('暂无新通知');

  if (!hasHydrated || !isAuthenticated) return null;

  return (
    <div className="console-shell" data-theme="soft-pink">
      <header className="console-topbar">
        <div className="console-topbar-inner">
          <div className="flex items-center gap-3">
            <button className="console-icon-button lg:hidden" type="button" onClick={() => setMobileOpen(true)} aria-label="打开菜单">
              <Menu className="h-4 w-4" />
            </button>
            <BrandLogo />
          </div>

          <nav className="console-topnav hidden lg:flex">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = activePrimary === item.href;
              return (
                <Link key={item.href} href={item.href} className={cn('console-topnav-pill', active && 'is-active')}>
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="console-toolbar">
            <label className="console-search hidden md:flex">
              <Search className="h-4 w-4 text-[#a78b96]" />
              <input placeholder="搜索" aria-label="搜索" />
              <kbd>Ctrl K</kbd>
            </label>
            <ThemeToggle />
            <button className="console-icon-button" type="button" onClick={onNotify} aria-label="通知">
              <Bell className="h-4 w-4" />
            </button>
            <button className="console-icon-button" type="button" onClick={() => setProfileOpen((open) => !open)} aria-label="账户">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button className="console-avatar" type="button" onClick={() => setProfileOpen((open) => !open)} aria-label="用户菜单">
              A
            </button>

            {profileOpen && (
              <div className="console-menu">
                <button type="button" onClick={() => router.push('/dashboard/settings')} className="console-menu-item">
                  <Settings2 className="h-4 w-4" />
                  个人资料
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setProfileOpen(false);
                  }}
                  className="console-menu-item text-rose-600"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="console-body">
        <aside className="console-sidebar">
          {sidebarGroups.map((group) => (
            <div key={group.title} className="console-sidebar-group">
              <div className="console-sidebar-title">{group.title}</div>
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || item.aliases?.includes(pathname);
                  return (
                    <Link key={item.href} href={item.href} className={cn('console-sidebar-item', active && 'is-active')}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <main className="console-main">
          <div className="console-main-frame">{children}</div>
        </main>
      </div>

      {mobileOpen && (
        <div className="console-drawer" role="dialog" aria-modal="true">
          <button className="console-drawer-backdrop" onClick={() => setMobileOpen(false)} aria-label="关闭菜单" type="button" />
          <div className="console-drawer-panel">
            <div className="flex items-center justify-between">
              <BrandLogo />
              <button className="console-icon-button" type="button" onClick={() => setMobileOpen(false)} aria-label="关闭">
                <Menu className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 space-y-6">
              {sidebarGroups.map((group) => (
                <div key={group.title}>
                  <div className="console-sidebar-title">{group.title}</div>
                  <div className="mt-2 space-y-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = pathname === item.href || item.aliases?.includes(pathname);
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn('console-sidebar-item', active && 'is-active')}>
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ConsolePage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('console-page', className)}>
      <div className="console-page-surface">{children}</div>
    </section>
  );
}

export function ConsoleEmpty({ icon, title, desc }: { icon?: ReactNode; title: string; desc?: string }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#f1c8d9] bg-white/60 text-center">
      {icon && <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f8e4ef] text-[#d36b9a]">{icon}</div>}
      <div className="text-xl font-bold text-[#231f27]">{title}</div>
      {desc && <p className="mt-2 max-w-md text-sm text-[#8f7384]">{desc}</p>}
    </div>
  );
}

export function ApiBaseBadge() {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(brand.baseUrl);
      toast.success('API 地址已复制');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <button type="button" onClick={copy} className="api-base-badge">
      <span className="text-[#8d7381]">API 地址</span>
      <code>{brand.baseUrl}</code>
    </button>
  );
}
