import MarketingLayout from '@/components/marketing/MarketingLayout';

export default function TermsPage() {
  return (
    <MarketingLayout>
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.045] p-8 shadow-xl shadow-black/20 sm:p-10">
          <h1 className="text-3xl font-black text-white">服务条款</h1>
          <div className="mt-8 space-y-4 text-base leading-8 text-slate-300">
            <p>• 用户应合法合规使用 MatrixAPI，不得用于违法、侵权或破坏性用途。</p>
            <p>• 用户需自行保护账号、密码和 API Key 安全，因泄露造成的调用消耗由账号持有人承担。</p>
            <p>• 平台会根据上游状态、模型价格和服务策略调整可用模型与计费规则。</p>
            <p>• 如遇服务异常，请通过控制台日志和支持邮箱反馈，我们会协助定位问题。</p>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
