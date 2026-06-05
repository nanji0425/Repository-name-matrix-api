'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { Users, Key, Brain, Globe, DollarSign, ShoppingCart, Gift, Bell, Settings, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: Shield },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/api-keys', label: 'API Keys', icon: Key },
  { href: '/admin/models', label: 'Models', icon: Brain },
  { href: '/admin/providers', label: 'Providers', icon: Globe },
  { href: '/admin/finance', label: 'Finance', icon: DollarSign },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/commissions', label: 'Commissions', icon: Gift },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Admin Sidebar */}
        <aside className="w-56 min-h-screen bg-white border-r border-gray-200 p-4 fixed">
          <div className="flex items-center gap-2 mb-6 px-2">
            <Shield className="w-5 h-5 text-primary-600" />
            <span className="font-bold gradient-text">Admin Panel</span>
          </div>
          <nav className="space-y-1">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn('sidebar-link', isActive && 'active')}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-primary-600">
              ← Back to Dashboard
            </Link>
          </div>
        </aside>

        {/* Main */}
        <div className="ml-56 flex-1">
          <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-700 h-16 flex items-center justify-end px-8">
            <ThemeToggle />
          </header>
          <div className="p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
