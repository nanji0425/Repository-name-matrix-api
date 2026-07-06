'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { KeyRound, Lock, User, X } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    usernameShort: '用户名至少需要 3 个字符',
    passwordShort: '密码至少需要 6 个字符',
    close: '关闭',
  },
  en: {
    usernameShort: 'Username must be at least 3 characters',
    passwordShort: 'Password must be at least 6 characters',
    close: 'Close',
  },
} as const;

export default function RegisterPage() {
  const locale = useLocaleStore((state) => state.locale);
  const localeHydrated = useLocaleStore((state) => state.hasHydrated);
  const hydrateLocale = useLocaleStore((state) => state.hydrateLocale);
  const t = useLocaleStore((state) => state.t);
  const text = copy[locale];
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', inviteCode: '' });
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!localeHydrated) hydrateLocale();
    const invite = new URLSearchParams(window.location.search).get('invite');
    if (invite) setForm((current) => ({ ...current, inviteCode: invite }));
  }, [localeHydrated, hydrateLocale]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.username.trim().length < 3) return toast.error(text.usernameShort);
    if (form.password.length < 6) return toast.error(text.passwordShort);
    if (form.password !== form.confirmPassword) return toast.error(t('passwordMismatch'));

    try {
      await register({ username: form.username.trim(), password: form.password, inviteCode: form.inviteCode.trim() || undefined });
      toast.success(t('registerSuccess'));
      router.push('/dashboard/api-keys');
    } catch (error: any) {
      toast.error(error.message || t('registerFailed'));
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
          <button onClick={() => router.push('/')} className="absolute right-6 top-6 text-slate-500 transition hover:text-white" aria-label={text.close}>
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-black text-white">{t('authRegisterTitle')}</h1>
          <p className="mt-2 text-sm text-slate-400">{t('authRegisterDesc')}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Field label={t('username')} icon={<User className="h-4 w-4" />}>
              <input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} className="matrix-auth-input" placeholder={t('usernamePlaceholder')} required />
            </Field>
            <Field label={t('password')} icon={<Lock className="h-4 w-4" />}>
              <input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="matrix-auth-input" placeholder={t('passwordPlaceholder')} required />
            </Field>
            <Field label={t('confirmPassword')} icon={<Lock className="h-4 w-4" />}>
              <input type="password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} className="matrix-auth-input" placeholder={t('confirmPasswordPlaceholder')} required />
            </Field>
            <Field label={t('inviteCode')} icon={<KeyRound className="h-4 w-4" />}>
              <input value={form.inviteCode} onChange={(event) => setForm({ ...form, inviteCode: event.target.value })} className="matrix-auth-input" placeholder={t('invitePlaceholder')} />
            </Field>
            <button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-white text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-60">
              {isLoading ? t('submitting') : t('createAccount')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {t('hasAccount')}
            <Link href="/login" className="ml-1 font-black text-white hover:underline">
              {t('login')}
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
