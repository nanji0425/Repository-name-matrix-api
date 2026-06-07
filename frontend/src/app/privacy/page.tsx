import MarketingLayout from '@/components/marketing/MarketingLayout';

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <LegalPage title="隐私政策" items={['我们仅收集提供服务所必需的账号、用量和请求审计信息。', 'API Key 会以安全方式保存和管理，请不要在公开环境泄露密钥。', '平台会使用请求日志进行计费、风控和故障排查，不会主动公开用户数据。', '如需删除账号或处理数据问题，请联系 MatrixAPI 支持邮箱。']} />
    </MarketingLayout>
  );
}

function LegalPage({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.045] p-8 shadow-xl shadow-black/20 sm:p-10">
        <h1 className="text-3xl font-black text-white">{title}</h1>
        <div className="mt-8 space-y-4 text-base leading-8 text-slate-300">
          {items.map((item) => <p key={item}>• {item}</p>)}
        </div>
      </div>
    </section>
  );
}
