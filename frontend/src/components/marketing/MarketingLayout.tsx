'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight, ChevronDown, Grid2X2, Lock, Menu, Sparkles, User, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LanguageToggle from '@/components/LanguageToggle';
import { useAuthStore } from '@/stores/authStore';
import { TranslationKey, useLocaleStore } from '@/stores/localeStore';
import { brand, navLinks } from './marketingData';

type AuthMode = 'login' | 'register' | null;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, hydrateAuth, hasHydrated, logout, user } = useAuthStore();
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t);

  useEffect(() => {
    if (!hasHydrated) hydrateAuth();
  }, [hasHydrated, hydrateAuth]);

  const title = useMemo(() => (authMode === 'register' ? t('authRegisterTitle') : t('authLoginTitle')), [authMode, t]);

  return (
    <div className="matrix-marketing-shell relative min-h-screen overflow-hidden text-white" data-locale={locale}>
      <div className="matrix-marketing-bg fixed inset-0 -z-10" />
      <div className="pointer-events-none fixed left-1/2 top-0 -z-10 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <header className="sticky top-0 z-40 border-b border-cyan-200/10 bg-[#050506]/76 shadow-2xl shadow-cyan-950/10 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <BrandLogo />

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`text-sm font-medium transition hover:text-white ${pathname === link.href ? 'text-white' : 'text-slate-500'}`}>
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <ThemeToggle />
            <LanguageToggle />
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => router.push('/dashboard')} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-white to-cyan-100 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:-translate-y-0.5 hover:shadow-cyan-300/30">
                  <Grid2X2 className="h-4 w-4" />
                  {t('console')}
                </button>
                <button onClick={() => setUserMenuOpen((open) => !open)} className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label={t('accountMenu')}>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-2xl border border-white/10 bg-[#111216] p-2 shadow-2xl shadow-black/50">
                    <Link href="/dashboard" className="flex h-10 items-center justify-center rounded-xl text-sm font-bold text-slate-200 transition hover:bg-white/8">{t('enterConsole')}</Link>
                    <button onClick={logout} className="h-10 w-full rounded-xl text-sm font-bold text-red-400 transition hover:bg-white/8">{t('logout')}</button>
                    {user?.role === 'ADMIN' && <Link href="/admin" className="mt-1 flex h-10 items-center justify-center rounded-xl text-sm font-bold text-slate-300 transition hover:bg-white/8">{t('admin')}</Link>}
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => setAuthMode('login')} className="text-sm font-semibold text-slate-400 transition hover:text-white">{t('login')}</button>
                <button onClick={() => setAuthMode('register')} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-white to-cyan-100 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:-translate-y-0.5 hover:shadow-cyan-300/30">
                  {t('getApiKey')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen((open) => !open)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 lg:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 bg-[#07080d] px-6 py-4 lg:hidden">
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/8 hover:text-white">
                  {t(link.labelKey)}
                </Link>
              ))}
              <div className="flex gap-2 py-2">
                <ThemeToggle />
                <LanguageToggle />
              </div>
              <button onClick={() => (isAuthenticated ? router.push('/dashboard') : setAuthMode('login'))} className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950">
                {isAuthenticated ? t('enterConsole') : t('loginRegister')}
              </button>
            </div>
          </div>
        )}
      </header>

      {children}

      <SiteFooter />

      {authMode && <AuthModal mode={authMode} title={title} onClose={() => setAuthMode(null)} onSwitch={setAuthMode} onSuccess={() => router.push(authMode === 'register' ? '/dashboard/api-keys' : '/dashboard')} />}
    </div>
  );
}

export function BrandLogo() {
  return (
    <Link href="/" className="flex items-center gap-3 text-xl font-black tracking-tight text-white">
      <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white text-slate-950 shadow-xl shadow-black/30">
        <Image src="/logo-mark.svg" alt="MatrixAPI" width={36} height={36} priority />
      </span>
      {brand.name}
    </Link>
  );
}

export function SiteFooter() {
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t);

  return (
    <footer className="border-t border-white/10 bg-[#050506] pt-16 pb-8 text-sm text-white" data-locale={locale}>
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <div className="flex items-center gap-3 text-xl font-black">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white text-slate-950">
              <Image src="/logo-mark.svg" alt="MatrixAPI" width={32} height={32} />
            </span>
            {brand.name}
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">{t('footerDesc')}</p>
          <p className="mt-4 text-sm text-slate-500">{t('contactQq')} <span className="font-bold text-white">3315419516</span></p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <FooterGroup titleKey="platformServices" links={[['pricing', '/models'], ['apiRelay', '/api-gateway'], ['solutions', '/solutions']]} />
          <FooterGroup titleKey="developerSupport" links={[['docsOfficial', '/docs'], ['tools', '/tools'], ['console', '/dashboard']]} />
          <FooterGroup titleKey="about" links={[['aboutUs', '/about'], ['latestNews', '/news'], ['privacy', '/privacy'], ['terms', '/terms']]} />
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1200px] border-t border-white/10 px-6 pt-6 text-xs text-slate-600">© 2024-2026 {brand.name}. All rights reserved.</div>
    </footer>
  );
}

function FooterGroup({ titleKey, links }: { titleKey: TranslationKey; links: [TranslationKey, string][] }) {
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t);
  return (
    <div data-locale={locale}>
      <div className="mb-4 text-sm font-black text-white">{t(titleKey)}</div>
      <div className="grid gap-3">
        {links.map(([labelKey, href]) => (
          <Link key={labelKey} href={href} className="text-sm text-slate-500 transition hover:text-white">{t(labelKey)}</Link>
        ))}
      </div>
    </div>
  );
}

function AuthModal({ mode, title, onClose, onSwitch, onSuccess }: { mode: AuthMode; title: string; onClose: () => void; onSwitch: (mode: AuthMode) => void; onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [remember, setRemember] = useState(false);
  const { login, register, isLoading } = useAuthStore();
  const locale = useLocaleStore((state) => state.locale);
  const t = useLocaleStore((state) => state.t);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (mode === 'register') {
        if (password !== confirmPassword) return toast.error(t('passwordMismatch'));
        await register({ username: username.trim(), password, inviteCode: inviteCode.trim() || undefined });
        toast.success(t('registerSuccess'));
      } else {
        await login(username.trim(), password);
        if (remember) localStorage.setItem('matrix_remember_login', '1');
        toast.success(t('loginSuccess'));
      }
      onClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || (mode === 'register' ? t('registerFailed') : t('loginFailed')));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 backdrop-blur-xl" data-locale={locale}>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_36%,rgba(15,23,42,0.85),transparent_32%)]" />
      <div className="relative w-full max-w-[480px] rounded-2xl border border-white/10 bg-[#151518] p-8 text-white shadow-2xl shadow-black/60">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-500 transition hover:text-white"><X className="h-5 w-5" /></button>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{mode === 'register' ? t('authRegisterDesc') : t('authLoginDesc')}</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <DarkField icon={<User className="h-4 w-4" />} label={t('username')}>
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="matrix-auth-input" placeholder={t('usernamePlaceholder')} required />
          </DarkField>
          <DarkField icon={<Lock className="h-4 w-4" />} label={t('password')}>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="matrix-auth-input" placeholder={t('passwordPlaceholder')} required />
          </DarkField>
          {mode === 'login' ? (
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black" />
              {t('rememberMe')}
            </label>
          ) : (
            <>
              <DarkField icon={<Lock className="h-4 w-4" />} label={t('confirmPassword')}>
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="matrix-auth-input" placeholder={t('confirmPasswordPlaceholder')} required />
              </DarkField>
              <DarkField icon={<Sparkles className="h-4 w-4" />} label={t('inviteCode')}>
                <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} className="matrix-auth-input" placeholder={t('invitePlaceholder')} />
              </DarkField>
            </>
          )}
          <button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-white text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-60">
            {isLoading ? t('submitting') : mode === 'register' ? t('createAccount') : t('login')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === 'register' ? t('hasAccount') : t('noAccount')}
          <button onClick={() => onSwitch(mode === 'register' ? 'login' : 'register')} className="ml-1 font-black text-white hover:underline">
            {mode === 'register' ? t('login') : t('register')}
          </button>
        </p>
      </div>
    </div>
  );
}

function DarkField({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
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
