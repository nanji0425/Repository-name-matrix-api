'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock, Mail, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';

export default function RegisterPage() {
  const locale = useLocaleStore((state) => state.locale);
  const localeHydrated = useLocaleStore((state) => state.hasHydrated);
  const hydrateLocale = useLocaleStore((state) => state.hydrateLocale);
  const t = useLocaleStore((state) => state.t);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!localeHydrated) hydrateLocale();
  }, [localeHydrated, hydrateLocale]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }

    if (!agree) {
      toast.error('请同意服务条款');
      return;
    }

    const success = await register(username, email, password);
    if (success) {
      toast.success('注册成功！');
      router.push('/dashboard');
    } else {
      toast.error('注册失败，请重试');
    }
  };

  if (!localeHydrated) return null;

  return (
    <div className="flex min-h-screen">
      {/* 左侧 - 渐变背景 + 品牌信息 */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.15),transparent_60%)]" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="max-w-md text-center">
            <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
              <span className="text-4xl font-bold text-white">M</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">加入 MatrixAPI</h1>
            <p className="text-lg text-white/90 mb-8">开启你的 AI 开发之旅</p>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">🚀</div>
                <div>
                  <div className="font-semibold">即刻开始</div>
                  <div className="text-sm text-white/80">注册即送体验额度</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">💰</div>
                <div>
                  <div className="font-semibold">灵活计费</div>
                  <div className="text-sm text-white/80">用多少付多少</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">🎁</div>
                <div>
                  <div className="font-semibold">邀请返佣</div>
                  <div className="text-sm text-white/80">分享即可获得收益</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 - 注册表单 */}
      <div className="flex flex-1 items-center justify-center p-8 lg:w-1/2 bg-gradient-to-br from-purple-50/50 to-pink-50/30">
        <div className="w-full max-w-md">
          <div className="console-card">
            <div className="mb-8">
              <h2 className="text-3xl font-bold gradient-text mb-2">{t('register')}</h2>
              <p className="text-gray-600">创建您的 MatrixAPI 账户</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label={t('username')} icon={<User className="h-5 w-5" />}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-12"
                  placeholder="请输入用户名"
                  autoComplete="username"
                  required
                />
              </Field>

              <Field label={t('email')} icon={<Mail className="h-5 w-5" />}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="请输入邮箱"
                  autoComplete="email"
                  required
                />
              </Field>

              <Field label={t('password')} icon={<Lock className="h-5 w-5" />}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="请输入密码"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <Field label="确认密码" icon={<Lock className="h-5 w-5" />}>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="请再次输入密码"
                  autoComplete="new-password"
                  required
                />
              </Field>

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  required
                />
                <span className="text-sm text-gray-600">
                  我已阅读并同意
                  <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-semibold">《服务条款》</Link>
                  和
                  <Link href="/privacy" className="text-purple-600 hover:text-purple-700 font-semibold">《隐私政策》</Link>
                </span>
              </label>

              <button type="submit" disabled={isLoading} className="button-primary w-full py-3">
                {isLoading ? '注册中...' : '立即注册'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              已有账户？
              <Link href="/login" className="ml-1 font-semibold text-purple-600 hover:text-purple-700">
                立即登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-gray-700">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        {children}
      </span>
    </label>
  );
}
