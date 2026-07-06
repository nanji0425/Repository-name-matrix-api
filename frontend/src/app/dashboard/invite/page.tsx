'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Copy, Gift, Link2, Users } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { commissionsApi } from '@/lib/api';
import { copyToClipboard, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

export default function InvitePage() {
  const { user } = useAuthStore();
  const [origin, setOrigin] = useState('');
  const [totalEarned, setTotalEarned] = useState(0);
  const [inviteRecords, setInviteRecords] = useState<any[]>([]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    Promise.all([commissionsApi.getTotal(), commissionsApi.listInvitedBy()])
      .then(([totalResponse, recordsResponse]) => {
        setTotalEarned(Number(totalResponse.data?.totalEarned || 0));
        setInviteRecords(recordsResponse.data?.items || []);
      })
      .catch(() => {
        setTotalEarned(0);
        setInviteRecords([]);
      });
  }, []);

  const inviteCode = user?.inviteCode || '暂无邀请码';
  const inviteLink = origin && user?.inviteCode ? `${origin}/register?invite=${user.inviteCode}` : '';

  const copyInviteLink = async () => {
    if (!inviteLink) {
      toast.error('邀请码尚未生成');
      return;
    }
    await copyToClipboard(inviteLink);
    toast.success('邀请链接已复制');
  };

  return (
    <ConsolePage className="pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">邀请活动</h1>
          <p className="mt-2 text-sm text-slate-400">邀请好友注册，双方各获得 ￥5 额度。</p>
        </div>
        <button onClick={copyInviteLink} className="console-button-white inline-flex items-center gap-2">
          <Copy className="h-4 w-4" />
          复制邀请链接
        </button>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="console-card p-6">
          <div className="text-sm text-slate-400">我的邀请码</div>
          <div className="mt-2 text-2xl font-black text-white">{inviteCode}</div>
        </div>
        <div className="console-card p-6">
          <div className="text-sm text-slate-400">已邀请人数</div>
          <div className="mt-2 text-2xl font-black text-white">{inviteRecords.length}</div>
        </div>
        <div className="console-card p-6">
          <div className="text-sm text-slate-400">累计返佣</div>
          <div className="mt-2 text-2xl font-black text-white">￥{totalEarned.toFixed(2)}</div>
        </div>
      </div>

      <section className="console-card mt-6 p-7">
        <div className="flex items-center gap-3 text-white">
          <Gift className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-black">活动说明</h2>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-4">好友通过你的邀请链接注册后，双方各获得 ￥5 额度。</div>
          <div className="rounded-2xl bg-white/5 p-4">你也可以直接把邀请码发给好友，让对方在注册页填写。</div>
        </div>
      </section>

      <section className="console-card mt-6 p-7">
        <div className="mb-4 flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-cyan-300" />
          <h2 className="text-lg font-black">邀请记录</h2>
        </div>
        {inviteRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            暂时还没有邀请记录。
            <div className="mt-4">
              <Link href="/register" className="console-button-white inline-flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                去注册页查看
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {inviteRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold text-white">{record.user?.username || '未知用户'}</div>
                    <div className="text-sm text-slate-400">{formatDate(record.createdAt)}</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-300">+￥{Number(record.amount || 0).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ConsolePage>
  );
}
