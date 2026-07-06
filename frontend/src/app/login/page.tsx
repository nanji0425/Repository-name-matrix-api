'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock, User, X } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';

export default function LoginPage() {
  const locale = useLocaleStore((state) => state.locale);
  const localeHydrated = useLocaleStore((state) => state.hasHydrated);
  const hydrateLocale = useLocaleStore((state) => state.hydrateLocale);
  const t = useLocaleStore((state) => state.t);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!localeHydrated) hydrateLocale();
  }, [localeHydrated, hydrateLocale]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(username.trim(), password);
      if (remember) localStorage.setItem('matrix_remember_login', '1');
      toast.success(t('loginSuccess'));
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || t('loginFailed'));
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-black px-4 text-white" data-locale={locale}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(13,24,67,0.9),transparent_30%),radial-gradient(circle_at_48%_54%,rgba(17,24,39,0.85),transparent_28%)]" />
      <div className="absolute right-6 top-6 z-20 flex items-center gap-3">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
        <div className="relative z-10 w-full max-w-[470px] rounded-[24px] border border-white/10 bg-[#151518] p-8 shadow-2xl shadow-black/60">
          <button onClick={() => router.push('/')} className="absolute right-6 top-6 text-slate-500 transition hover:text-white" aria-label={locale === 'zh' ? '关闭' : 'Close'}>
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-black text-white">{t('authLoginTitle')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('authLoginDesc')}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Field label={t('username')} icon={<User className="h-4 w-4" />}>
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="matrix-auth-input" placeholder={t('usernamePlaceholder')} required />
            </Field>
            <Field label={t('password')} icon={<Lock className="h-4 w-4" />}>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="matrix-auth-input" placeholder={t('passwordPlaceholder')} required />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black" />
              {t('rememberMe')}
            </label>
            <button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-white text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-60">
              {isLoading ? t('submitting') : t('login')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {t('noAccount')}
            <Link href="/register" className="ml-1 font-black text-white hover:underline">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
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
