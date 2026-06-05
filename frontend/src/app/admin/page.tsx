'use client';

import { useEffect, useState } from 'react';
import { adminApi, ordersApi, announcementsApi } from '@/lib/api';
import { Users, ShoppingCart, DollarSign, Activity } from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, orders: 0, revenue: 0, models: 0 });

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data || {})).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Overview</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Users', value: stats.users, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Orders', value: stats.orders, icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Revenue', value: `$${(stats.revenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Active Models', value: stats.models, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="card p-5">
              <div className={`p-2 rounded-lg ${card.bg} inline-flex mb-3`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-sm text-gray-500">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="card p-8 text-center text-gray-400">
        <p className="text-lg font-medium mb-2">Welcome to MatrixAPI Admin</p>
        <p className="text-sm">Use the sidebar to manage users, models, providers, and finances.</p>
      </div>
    </div>
  );
}
