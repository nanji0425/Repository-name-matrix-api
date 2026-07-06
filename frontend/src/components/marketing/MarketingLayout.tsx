'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowRight, ChevronDown, Grid2X2, Lock, Menu, Sparkles, User, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { brand, navLinks } from './marketingData';

type AuthMode = 'login' | 'register' | null;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, hydrateAuth, hasHydrated, logout, user } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) hydrateAuth();
  }, [hasHydrated, hydrateAuth]);

  const title = useMemo(() => (authMode === 'register' ? '创建账户' : '欢迎回来'), [authMode]);

  return (
    <div className="min-h-screen overflow-hidden bg-[#050506] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.14),transparent_28%),linear-gradient(180deg,#090b12_0%,#050506_48%,#030304_100%)]" />
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050506]/86 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
          <BrandLogo />

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={`text-sm font-medium transition hover:text-white ${pathname === link.href ? 'text-white' : 'text-slate-500'}`}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="relative">
                <button onClick={() => setUserMenuOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950">
                  <Grid2X2 className="h-4 w-4" />
                  控制台
                  <ChevronDown className="h-4 w-4" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-2xl border border-white/10 bg-[#111216] p-2 shadow-2xl shadow-black/50">
                    <button onClick={logout} className="h-10 w-full rounded-xl text-sm font-bold text-red-400 transition hover:bg-white/8">退出登录</button>
                    {user?.role === 'ADMIN' && <Link href="/admin" className="mt-1 flex h-10 items-center justify-center rounded-xl text-sm font-bold text-slate-300 transition hover:bg-white/8">管理后台</Link>}
                  </div>
                )}
              </div>
            ) : (
              <>
                <button onClick={() => setAuthMode('login')} className="text-sm font-semibold text-slate-400 transition hover:text-white">登录</button>
                <button onClick={() => setAuthMode('register')} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-slate-200">
                  获取 API Key
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
                  {link.label}
                </Link>
              ))}
              <button onClick={() => (isAuthenticated ? router.push('/dashboard') : setAuthMode('login'))} className="mt-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-slate-950">
                {isAuthenticated ? '进入控制台' : '登录 / 注册'}
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
  return (
    <footer className="border-t border-white/10 bg-[#050506] pt-16 pb-8 text-sm text-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <div className="flex items-center gap-3 text-xl font-black">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white text-slate-950">
              <Image src="/logo-mark.svg" alt="MatrixAPI" width={32} height={32} />
            </span>
            {brand.name}
          </div>
          <p className="mt-4 max-w-md text-sm leading-7 text-slate-500">您的企业级 AI 网关底座。一次接入，便可拥抱不断演进、全球最顶级的大模型推理时代。</p>
          <p className="mt-4 text-sm text-slate-500">联系 QQ： <span className="font-bold text-white">3315419516</span></p>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          <FooterGroup title="平台服务" links={[["模型与定价", '/models'], ['API 中转服务', '/api-gateway'], ['解决方案中心', '/solutions']]} />
          <FooterGroup title="开发者支持" links={[["API 官方文档", '/docs'], ['在线创作', '/tools'], ['控制台', '/dashboard']]} />
          <FooterGroup title="关于" links={[["关于我们", '/about'], ['最新资讯', '/news'], ['隐私政策', '/privacy'], ['服务条款', '/terms']]} />
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-[1200px] border-t border-white/10 px-6 pt-6 text-xs text-slate-600">© 2024-2026 {brand.name}. All rights reserved.</div>
    </footer>
  );
}

function FooterGroup({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mb-4 text-sm font-black text-white">{title}</div>
      <div className="grid gap-3">
        {links.map(([label, href]) => (
          <Link key={label} href={href} className="text-sm text-slate-500 transition hover:text-white">{label}</Link>
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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      if (mode === 'register') {
        if (password !== confirmPassword) return toast.error('两次输入的密码不一致');
        await register({ username: username.trim(), password, inviteCode: inviteCode.trim() || undefined });
        toast.success('注册成功');
      } else {
        await login(username.trim(), password);
        if (remember) localStorage.setItem('matrix_remember_login', '1');
        toast.success('登录成功');
      }
      onClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || (mode === 'register' ? '注册失败' : '登录失败'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 px-4 backdrop-blur-xl">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_36%,rgba(15,23,42,0.85),transparent_32%)]" />
      <div className="relative w-full max-w-[480px] rounded-2xl border border-white/10 bg-[#151518] p-8 text-white shadow-2xl shadow-black/60">
        <button onClick={onClose} className="absolute right-6 top-6 text-slate-500 transition hover:text-white"><X className="h-5 w-5" /></button>
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="mt-2 text-sm text-slate-400">{mode === 'register' ? '注册 API 平台账户，获取 API Key' : '登录到您的 API 平台账户'}</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <DarkField icon={<User className="h-4 w-4" />} label="用户名">
            <input value={username} onChange={(event) => setUsername(event.target.value)} className="matrix-auth-input" placeholder="请输入用户名" required />
          </DarkField>
          <DarkField icon={<Lock className="h-4 w-4" />} label="密码">
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="matrix-auth-input" placeholder="请输入密码" required />
          </DarkField>
          {mode === 'login' ? (
            <label className="flex items-center gap-2 text-sm text-slate-400">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-white/20 bg-black" />
              记住我
            </label>
          ) : (
            <>
              <DarkField icon={<Lock className="h-4 w-4" />} label="确认密码">
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="matrix-auth-input" placeholder="请再次输入密码" required />
              </DarkField>
              <DarkField icon={<Sparkles className="h-4 w-4" />} label="邀请码（可选）">
                <input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} className="matrix-auth-input" placeholder="请输入邀请码（可选）" />
              </DarkField>
            </>
          )}
          <button type="submit" disabled={isLoading} className="h-12 w-full rounded-full bg-white text-sm font-black text-slate-950 transition hover:bg-slate-200 disabled:opacity-60">
            {isLoading ? '正在提交...' : mode === 'register' ? '注册账号' : '登录'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {mode === 'register' ? '已有账号？' : '没有账户？'}
          <button onClick={() => onSwitch(mode === 'register' ? 'login' : 'register')} className="ml-1 font-black text-white hover:underline">
            {mode === 'register' ? '登录' : '注册'}
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
