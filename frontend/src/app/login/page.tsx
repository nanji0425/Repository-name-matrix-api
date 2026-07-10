'use client';

import Link from 'next/link';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useLocaleStore } from '@/stores/localeStore';
import { getPostLoginPath } from '@/lib/adminAccess';

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const success = await login(username, password);
    if (success) {
      const user = useAuthStore.getState().user;
      const target = getPostLoginPath(user?.role);
      router.push(target);
    } else {
      toast.error(t('loginFailed'));
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
            <h1 className="text-4xl font-bold mb-4">MatrixAPI</h1>
            <p className="text-lg text-white/90 mb-8">全球 AI 大模型统一 API 平台</p>
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">✓</div>
                <div>
                  <div className="font-semibold">统一接入</div>
                  <div className="text-sm text-white/80">一个 API 调用所有模型</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">✓</div>
                <div>
                  <div className="font-semibold">灵活计费</div>
                  <div className="text-sm text-white/80">按需付费，无最低消费</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">✓</div>
                <div>
                  <div className="font-semibold">企业级</div>
                  <div className="text-sm text-white/80">稳定可靠，7x24 支持</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧 - 登录表单 */}
      <div className="flex flex-1 items-center justify-center p-8 lg:w-1/2 bg-gradient-to-br from-purple-50/50 to-pink-50/30">
        <div className="w-full max-w-md">
          <div className="console-card">
            <div className="mb-8">
              <h2 className="text-3xl font-bold gradient-text mb-2">{t('login')}</h2>
              <p className="text-gray-600">{t('welcomeBack')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Field label={t('username')} icon={<User className="h-5 w-5" />}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field pl-12"
                  placeholder={t('usernamePlaceholder')}
                  autoComplete="username"
                  required
                />
              </Field>

              <Field label={t('password')} icon={<Lock className="h-5 w-5" />}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder={t('passwordPlaceholder')}
                  autoComplete="current-password"
                  required
                />
              </Field>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-600">{t('rememberMe')}</span>
                </label>
                <Link href="/forgot-password" className="text-sm font-semibold text-purple-600 hover:text-purple-700">
                  {t('forgotPassword')}
                </Link>
              </div>

              <button type="submit" disabled={isLoading} className="button-primary w-full py-3">
                {isLoading ? t('submitting') : t('login')}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              {t('noAccount')}
              <Link href="/register" className="ml-1 font-semibold text-purple-600 hover:text-purple-700">
                {t('register')}
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
