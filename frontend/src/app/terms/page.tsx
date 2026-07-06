'use client';

import MarketingLayout from '@/components/marketing/MarketingLayout';
import { useLocaleStore } from '@/stores/localeStore';

const copy = {
  zh: {
    title: '服务条款',
    items: [
      '用户应合法合规使用 MatrixAPI，不得用于违法、侵权或破坏性用途。',
      '用户需自行保护账号、密码和 API Key 安全，因泄露造成的调用消耗由账号持有人承担。',
      '平台会根据上游状态、模型价格和服务策略调整可用模型与计费规则。',
      '如遇服务异常，请通过控制台日志和支持邮箱反馈，我们会协助定位问题。',
    ],
  },
  en: {
    title: 'Terms of Service',
    items: [
      'Users must use MatrixAPI lawfully and must not use it for illegal, infringing, or destructive purposes.',
      'Users are responsible for protecting account credentials and API keys. Usage caused by leaked keys is borne by the account owner.',
      'Available models and billing rules may change according to upstream status, model prices, and service policies.',
      'If service issues occur, report them with console logs and support email context so we can help investigate.',
    ],
  },
} as const;

export default function TermsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];

  return (
    <MarketingLayout>
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.045] p-8 shadow-xl shadow-black/20 sm:p-10">
          <h1 className="text-3xl font-black text-white">{text.title}</h1>
          <div className="mt-8 space-y-4 text-base leading-8 text-slate-300">
            {text.items.map((item) => <p key={item}>- {item}</p>)}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
