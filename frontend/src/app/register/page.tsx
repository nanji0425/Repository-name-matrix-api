'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { KeyRound, Lock, User, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', inviteCode: '' });
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const invite = new URLSearchParams(window.location.search).get('invite');
    if (invite) {
      setForm((current) => ({ ...current, inviteCode: invite }));
    }
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.username.trim().length < 3) {
      toast.error('用户名至少需要 3 个字符');
      return;
    }
    if (form.password.length < 6) {
      toast.error('密码至少需要 6 个字符');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    try {
      await register({ username: form.username.trim(), password: form.password, inviteCode: form.inviteCode.trim() || undefined });
      toast.success('注册成功');
      router.push('/dashboard/api-keys');
    } catch (error: any) {
      toast.error(error.message || '注册失败');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(13,24,67,0.9),transparent_30%),radial-gradient(circle_at_48%_54%,rgba(17,24,39,0.85),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-[470px] rounded-[24px] border border-white/10 bg-[#151518] p-8 shadow-2xl shadow-black/60">
          <button onClick={() => router.push('/')} className="absolute right-6 top-6 text-slate-500 transition hover:text-white" aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-black text-white">创建账户</h1>
          <p className="mt-2 text-sm text-slate-400">注册 API 平台账户，获取 API Key</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Field label="用户名" icon={<User className="h-4 w-4" />}>
              <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="matrix-auth-input" placeholder="请输入用户名" required />
            </Field>
            <Field label="密码" icon={<Lock className="h-4 w-4" />}>
              <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="matrix-auth-input" placeholder="请输入密码" required />
            </Field>
            <Field label="确认密码" icon={<Lock className="h-4 w-4" />}>
              <input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="matrix-auth-input" placeholder="请再次输入密码" required />
            </Field>
            <Field label="邀请码（可选）" icon={<KeyRound className="h-4 w-4" />}>
              <input value={form.inviteCode} onChange={(event) => setForm({ ...form, inviteCode: event.target.value })} className="matrix-auth-input" placeholder="请输入邀请码（可选）" />
            </Field>
            <button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-white text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-60">
              {isLoading ? '正在提交...' : '注册账户'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            已有账户？
            <Link href="/login" className="ml-1 font-black text-white hover:underline">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">{icon}</span>
        {children}
      </span>
    </label>
  );
}
