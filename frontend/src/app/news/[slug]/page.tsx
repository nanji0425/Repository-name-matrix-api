import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { CTASection } from '@/components/marketing/MarketingSections';
import { newsPosts } from '@/components/marketing/marketingData';

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }));
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = newsPosts.find((item) => item.slug === slug);
  if (!post) notFound();

  return (
    <MarketingLayout>
      <article className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/[0.045] p-8 shadow-xl shadow-black/20 sm:p-10">
          <Link href="/news" className="mb-8 inline-flex items-center gap-2 text-sm font-black text-cyan-700">
            <ArrowLeft className="h-4 w-4" />
            返回资讯
          </Link>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-300">{post.category}</span>
            <span className="text-sm font-bold text-slate-400">{post.date}</span>
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">{post.title}</h1>
          <p className="mt-6 text-lg leading-8 text-slate-400">{post.excerpt}</p>
          <div className="mt-8 space-y-5 text-base leading-8 text-slate-300">
            <p>在生产环境接入大模型时，稳定性、成本和权限边界往往比单次调用更重要。MatrixAPI 的核心价值，是把多家模型供应商沉淀到统一网关里，让开发者不再为每个上游重复维护接入逻辑。</p>
            <p>推荐按项目创建独立 API Key，并结合模型价格、日志统计和额度策略持续优化。对高并发应用，可以优先选择响应更稳定、成本更可控的模型组合。</p>
            <p>后续你可以在控制台查看请求日志、用户用量和模型状态，把 AI 能力作为可运营的基础设施长期管理。</p>
          </div>
        </div>
      </article>
      <CTASection />
    </MarketingLayout>
  );
}
