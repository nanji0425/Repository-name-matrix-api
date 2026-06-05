'use client';

import { useEffect, useState } from 'react';
import { commissionsApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { formatCurrency, formatDate, copyToClipboard } from '@/lib/utils';
import { Gift, Copy, Users, DollarSign, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InvitePage() {
  const { user } = useAuthStore();
  const [total, setTotal] = useState<any>({});
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    commissionsApi.getTotal().then((r) => setTotal(r.data || {}));
    commissionsApi.list().then((r) => setCommissions(r.data?.commissions || r.data || []));
  }, []);

  const handleCopy = () => {
    if (user?.inviteCode) {
      copyToClipboard(user.inviteCode);
      toast.success('Invite code copied!');
    }
  };

  const totalEarned = total?.totalEarned ?? total?.total ?? 0;
  const pendingSettlements = total?.pendingSettlements ?? total?.pending ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Invite &amp; Commissions</h1>

      {/* Invite Code */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-gray-500 mb-1">Your Invite Code</div>
            <div className="text-2xl font-mono font-bold tracking-wider text-primary-600">
              {user?.inviteCode || '—'}
            </div>
          </div>
          <button onClick={handleCopy} className="btn-primary flex items-center gap-2">
            <Copy className="w-4 h-4" /> Copy Code
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-3">
          Share this code with friends. You earn commissions when they use the API!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-50">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(totalEarned)}</div>
              <div className="text-xs text-gray-500">Total Earned</div>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-50">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(pendingSettlements)}</div>
              <div className="text-xs text-gray-500">Pending Settlements</div>
            </div>
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Commission History</h3>
        </div>
        <div className="card-body p-0">
          {commissions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No commissions yet. Invite someone to earn!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-gray-500">
                    <th className="px-6 py-3 font-medium">Invited User</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Rate</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {commissions.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          {item.invitedUser?.username || item.username || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-medium text-green-600">
                        +{formatCurrency(item.amount || 0)}
                      </td>
                      <td className="px-6 py-3">{item.rate != null ? `${(item.rate * 100).toFixed(1)}%` : '—'}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.status === 'SETTLED'
                              ? 'bg-green-50 text-green-700'
                              : item.status === 'PENDING'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
