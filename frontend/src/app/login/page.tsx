'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Sparkles, User, X } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(username.trim(), password);
      if (remember) localStorage.setItem('matrix_remember_login', '1');
      toast.success('登录成功');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || '登录失败');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(13,24,67,0.9),transparent_30%),radial-gradient(circle_at_48%_54%,rgba(17,24,39,0.85),transparent_28%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-[470px] rounded-[24px] border border-white/10 bg-[#151518] p-8 shadow-2xl shadow-black/60">
          <button onClick={() => router.push('/')} className="absolute right-6 top-6 text-slate-500 transition hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-black text-white">欢迎回来</h1>
          <p className="mt-2 text-sm text-slate-400">登录到您的 API 平台账户</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Field label="邮箱或用户名" icon={<User className="h-4 w-4" />}>
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="matrix-auth-input" placeholder="请输入邮箱或用户名" required />
            </Field>
            <Field label="密码" icon={<Lock className="h-4 w-4" />}>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="matrix-auth-input" placeholder="请输入密码" required />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black" />
              记住我
            </label>
            <button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-white text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-60">
              {isLoading ? '正在提交...' : '登录'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            没有账户？{' '}
            <Link href="/register" className="font-black text-white hover:underline">
              注册
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
