'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import {
  LayoutDashboard, Key, ScrollText, Gift, Wallet, Settings,
  LogOut, Menu, X, ChevronDown, ChevronRight, MessageSquare,
  MessageCircle, Activity, Image, ClipboardList, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface SubmenuGroup {
  type: 'submenu';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavItem[];
}

type NavEntry = NavItem | SubmenuGroup;

interface NavSection {
  title: string;
  items: NavEntry[];
}

const navSections: NavSection[] = [
  {
    title: 'CHAT',
    items: [
      { href: '/dashboard/playground', label: 'Playground', icon: MessageSquare },
      {
        type: 'submenu',
        label: 'Chat',
        icon: MessageCircle,
        children: [
          { href: '/dashboard/chat/conversations', label: 'Conversations', icon: MessageCircle },
          { href: '/dashboard/chat/history', label: 'History', icon: MessageCircle },
        ],
      },
    ],
  },
  {
    title: 'CONSOLE',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/dashboard/channel-status', label: 'Channel Status', icon: Activity, adminOnly: true },
      { href: '/dashboard/token-management', label: 'Token Management', icon: Key },
      { href: '/dashboard/logs', label: 'Usage Logs', icon: ScrollText },
      { href: '/dashboard/drawing-logs', label: 'Drawing Logs', icon: Image },
      { href: '/dashboard/task-logs', label: 'Task Logs', icon: ClipboardList },
    ],
  },
  {
    title: 'PROFILE',
    items: [
      { href: '/dashboard/invite', label: 'Invite & Rewards', icon: Gift },
      { href: '/dashboard/balance', label: 'Recharge', icon: Wallet },
      { href: '/dashboard/subscription', label: 'Subscription', icon: CreditCard },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const breadcrumbLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/playground': 'Playground',
  '/dashboard/chat': 'Chat',
  '/dashboard/chat/conversations': 'Conversations',
  '/dashboard/chat/history': 'History',
  '/dashboard/channel-status': 'Channel Status',
  '/dashboard/token-management': 'Token Management',
  '/dashboard/logs': 'Usage Logs',
  '/dashboard/drawing-logs': 'Drawing Logs',
  '/dashboard/task-logs': 'Task Logs',
  '/dashboard/invite': 'Invite & Rewards',
  '/dashboard/balance': 'Recharge',
  '/dashboard/subscription': 'Subscription',
  '/dashboard/settings': 'Settings',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, fetchProfile, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchProfile();
  }, []);

  // Auto-open Chat submenu when on a chat sub-route
  useEffect(() => {
    if (pathname.startsWith('/dashboard/chat')) {
      setChatOpen(true);
    }
  }, [pathname]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  if (!isAuthenticated) return null;

  const initial = user?.username?.charAt(0).toUpperCase() || 'U';

  // Build breadcrumb trail
  const breadcrumbPath = useMemo(() => {
    const parts: { label: string; href: string }[] = [{ label: 'Console', href: '/dashboard' }];
    if (pathname === '/dashboard') return parts;

    // Match the deepest path in breadcrumbLabels
    const candidates = Object.keys(breadcrumbLabels)
      .filter((p) => p !== '/dashboard' && pathname.startsWith(p))
      .sort((a, b) => b.length - a.length);

    if (candidates.length > 0) {
      parts.push({ label: breadcrumbLabels[candidates[0]], href: candidates[0] });
    } else {
      const seg = pathname.split('/').pop() || '';
      parts.push({ label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '), href: pathname });
    }
    return parts;
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="ant-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ===== Sidebar ===== */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full overflow-y-auto',
          'transform transition-transform duration-200 ease-in-out',
          'lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{ width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', flexShrink: 0 }}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/dashboard" className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            CodeToken AI
          </Link>
        </div>

        {/* Navigation */}
        <nav className="py-2">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="ant-menu-submenu">{section.title}</div>
              {section.items.map((entry) => {
                if ('type' in entry && entry.type === 'submenu') {
                  const SubIcon = entry.icon;
                  return (
                    <div key={entry.label}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatOpen((prev) => !prev);
                        }}
                        className={cn(
                          'ant-menu-item w-full text-left',
                          chatOpen && 'ant-menu-item-selected',
                        )}
                      >
                        <SubIcon className="w-4 h-4" />
                        <span className="flex-1">{entry.label}</span>
                        {chatOpen ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                      </button>
                      {/* Submenu items */}
                      <div className={cn('overflow-hidden transition-all duration-200', chatOpen ? 'max-h-96' : 'max-h-0')}>
                        <div className="ml-6">
                          {entry.children.map((sub) => {
                            const SubItemIcon = sub.icon;
                            const active = isActive(sub.href);
                            return (
                              <Link
                                key={sub.href}
                                href={sub.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn('ant-menu-item', active && 'ant-menu-item-selected')}
                              >
                                <SubItemIcon className="w-4 h-4" />
                                <span>{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Regular nav item
                const item = entry as NavItem;
                if (item.adminOnly && user?.role !== 'ADMIN') return null;
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn('ant-menu-item', active && 'ant-menu-item-selected')}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="mt-auto p-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                {user?.username}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                ${user?.balance?.toFixed(2)}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)';
              (e.currentTarget as HTMLButtonElement).style.background = '#fff2f0';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ===== Main Area ===== */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center h-16 px-4 lg:px-6 border-b"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
        >
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm ml-3 lg:ml-0" style={{ color: 'var(--text-secondary)' }}>
            {breadcrumbPath.map((part, i) => (
              <div key={part.href} className="flex items-center gap-2">
                {i > 0 && <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />}
                {i < breadcrumbPath.length - 1 ? (
                  <Link href={part.href} style={{ color: 'var(--text-tertiary)' }} className="hover:underline">
                    {part.label}
                  </Link>
                ) : (
                  <span style={{ color: 'var(--text-primary)' }} className="font-medium">
                    {part.label}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1" />

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User avatar + dropdown */}
          <div className="relative ml-3" ref={userMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen((prev) => !prev);
              }}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                style={{ background: 'var(--primary)' }}
              >
                {initial}
              </div>
              <span className="text-sm font-medium hidden sm:inline" style={{ color: 'var(--text-primary)' }}>
                {user?.username}
              </span>
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 py-2 rounded-lg shadow-lg z-50"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border-light)' }}>
                  <div className="text-sm font-medium">{user?.username}</div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {user?.email}
                  </div>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f5f5f5'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--error)';
                    (e.currentTarget as HTMLButtonElement).style.background = '#fff2f0';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="ant-layout-content" style={{ background: 'var(--bg-page)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
