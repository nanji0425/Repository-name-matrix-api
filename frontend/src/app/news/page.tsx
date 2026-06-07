'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { newsPosts } from '@/components/marketing/marketingData';

export default function NewsPage() {
  return (
    <MarketingLayout>
      <section className="border-b border-white/10 px-6 pb-10 pt-28">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-5xl font-black tracking-tight text-white">资讯</h1>
          <p className="mt-5 text-lg text-slate-400">AI 技术与生态资讯</p>
          <button className="mt-6 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-200">全部</button>
        </div>
      </section>
      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-[1200px] gap-5 md:grid-cols-3">
          {newsPosts.map((post) => (
            <Link key={post.slug} href={`/news/${post.slug}`} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-300">{post.category}</span>
                <span className="text-xs font-bold text-slate-500">{post.date}</span>
              </div>
              <h2 className="text-xl font-black leading-8 text-white">{post.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">{post.excerpt}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-300">
                阅读详情 <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-[1200px] items-center justify-center gap-5 text-sm text-slate-500">
          <button className="rounded-lg border border-white/10 px-4 py-2">上一页</button>
          <span>1 / 1 页</span>
          <button className="rounded-lg border border-white/10 px-4 py-2">下一页</button>
        </div>
      </section>
    </MarketingLayout>
  );
}
