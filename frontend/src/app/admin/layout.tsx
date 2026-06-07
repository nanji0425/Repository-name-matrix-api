'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { Users, Key, Brain, Globe, DollarSign, ShoppingCart, Gift, Bell, Settings, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin', label: '运营总览', icon: Shield },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/api-keys', label: '密钥审计', icon: Key },
  { href: '/admin/models', label: '模型管理', icon: Brain },
  { href: '/admin/providers', label: '上游通道', icon: Globe },
  { href: '/admin/finance', label: '财务统计', icon: DollarSign },
  { href: '/admin/orders', label: '订单管理', icon: ShoppingCart },
  { href: '/admin/commissions', label: '佣金管理', icon: Gift },
  { href: '/admin/announcements', label: '公告管理', icon: Bell },
  { href: '/admin/settings', label: '系统参数', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hasHydrated, hydrateAuth, fetchProfile } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

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
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#f8fbff_0%,#eef7f6_45%,#f7f2ff_100%)] text-slate-600">
        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-5 py-4 shadow-xl shadow-slate-900/10 backdrop-blur">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
          正在校验管理员权限...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fbff_0%,#eef7f6_45%,#f7f2ff_100%)]">
      <aside className="fixed left-0 top-0 z-40 min-h-screen w-64 border-r border-white/10 bg-slate-950 p-4 text-white shadow-2xl shadow-slate-950/30">
        <div className="mb-7 rounded-2xl border border-cyan-400/20 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300 font-black text-slate-950">M</span>
            <div>
              <div className="text-sm font-black">MatrixAPI</div>
              <div className="text-xs text-cyan-100/70">管理员控制台</div>
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
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white',
                  isActive && 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/20 hover:bg-cyan-300 hover:text-slate-950',
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Link href="/dashboard" className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回用户控制台
          </Link>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/60 bg-white/70 px-8 backdrop-blur-xl">
          <div>
            <div className="text-sm font-bold text-slate-950">MatrixAPI 管理中心</div>
            <div className="text-xs text-slate-500">运营、计费、上游通道与模型参数统一管理</div>
          </div>
          <ThemeToggle />
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
