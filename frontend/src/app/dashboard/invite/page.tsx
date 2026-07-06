'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Copy, Gift, Link2, Users } from 'lucide-react';
import { ConsolePage } from '@/components/console/ConsoleShell';
import { commissionsApi } from '@/lib/api';
import { copyToClipboard, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '邀请活动',
    desc: '邀请好友注册，双方各获得 ¥5 额度。',
    copyLink: '复制邀请链接',
    noCode: '暂无邀请码',
    codePending: '邀请码尚未生成',
    copied: '邀请链接已复制',
    myCode: '我的邀请码',
    invitedCount: '已邀请人数',
    totalCommission: '累计返佣',
    rules: '活动说明',
    rule1: '好友通过你的邀请链接注册后，双方各获得 ¥5 额度。',
    rule2: '你也可以直接把邀请码发给好友，让对方在注册页填写。',
    records: '邀请记录',
    empty: '暂时还没有邀请记录。',
    registerPage: '去注册页查看',
    unknownUser: '未知用户',
  },
  en: {
    title: 'Invite Rewards',
    desc: 'Invite a friend to register. Both accounts receive ¥5 credit.',
    copyLink: 'Copy Invite Link',
    noCode: 'No invite code yet',
    codePending: 'Invite code has not been generated yet',
    copied: 'Invite link copied',
    myCode: 'My Invite Code',
    invitedCount: 'Invited Users',
    totalCommission: 'Total Commission',
    rules: 'Rules',
    rule1: 'When a friend registers through your invite link, both accounts receive ¥5 credit.',
    rule2: 'You can also send the invite code directly and ask them to enter it on the registration page.',
    records: 'Invite Records',
    empty: 'No invite records yet.',
    registerPage: 'Open Register Page',
    unknownUser: 'Unknown user',
  },
} as const;

export default function InvitePage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
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

  const inviteCode = user?.inviteCode || text.noCode;
  const inviteLink = origin && user?.inviteCode ? `${origin}/register?invite=${user.inviteCode}` : '';

  const copyInviteLink = async () => {
    if (!inviteLink) {
      toast.error(text.codePending);
      return;
    }
    await copyToClipboard(inviteLink);
    toast.success(text.copied);
  };

  return (
    <ConsolePage className="pb-24">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">{text.title}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text.desc}</p>
        </div>
        <button onClick={copyInviteLink} className="console-button-white inline-flex items-center gap-2">
          <Copy className="h-4 w-4" />
          {text.copyLink}
        </button>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="console-card p-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.myCode}</div>
          <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{inviteCode}</div>
        </div>
        <div className="console-card p-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.invitedCount}</div>
          <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">{inviteRecords.length}</div>
        </div>
        <div className="console-card p-6">
          <div className="text-sm text-slate-600 dark:text-slate-400">{text.totalCommission}</div>
          <div className="mt-2 text-2xl font-black text-slate-950 dark:text-white">¥{totalEarned.toFixed(2)}</div>
        </div>
      </div>

      <section className="console-card mt-6 p-7">
        <div className="flex items-center gap-3 text-slate-950 dark:text-white">
          <Gift className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
          <h2 className="text-lg font-black">{text.rules}</h2>
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-2">
          <div className="rounded-2xl bg-white/60 p-4 dark:bg-white/5">{text.rule1}</div>
          <div className="rounded-2xl bg-white/60 p-4 dark:bg-white/5">{text.rule2}</div>
        </div>
      </section>

      <section className="console-card mt-6 p-7">
        <div className="mb-4 flex items-center gap-2 text-slate-950 dark:text-white">
          <Users className="h-5 w-5 text-cyan-500 dark:text-cyan-300" />
          <h2 className="text-lg font-black">{text.records}</h2>
        </div>
        {inviteRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {text.empty}
            <div className="mt-4">
              <Link href="/register" className="console-button-white inline-flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                {text.registerPage}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {inviteRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-cyan-200/20 bg-white/50 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold text-slate-950 dark:text-white">{record.user?.username || text.unknownUser}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{formatDate(record.createdAt)}</div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-300">+¥{Number(record.amount || 0).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </ConsolePage>
  );
}
