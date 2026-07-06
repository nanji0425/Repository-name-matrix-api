'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { newsPosts } from '@/components/marketing/marketingData';
import { useLocaleStore } from '@/stores/localeStore';

const pageSize = 6;

const copy = {
  zh: {
    all: '全部',
    title: '资讯',
    desc: 'AI 技术与生态资讯',
    read: '阅读详情',
    prev: '上一页',
    next: '下一页',
    page: '页',
  },
  en: {
    all: 'All',
    title: 'News',
    desc: 'AI technology and ecosystem updates',
    read: 'Read details',
    prev: 'Previous',
    next: 'Next',
    page: 'Page',
  },
} as const;

export default function NewsPage() {
  const locale = useLocaleStore((state) => state.locale);
  const text = copy[locale];
  const [category, setCategory] = useState<string>(text.all);
  const [page, setPage] = useState(1);

  const posts = useMemo(() => newsPosts.map((post) => ({ slug: post.slug, ...post[locale] })), [locale]);
  const categories = useMemo(() => [text.all, ...Array.from(new Set(posts.map((item) => item.category)))], [posts, text.all]);
  const activeCategory = categories.includes(category) ? category : text.all;
  const filtered = useMemo(() => (activeCategory === text.all ? posts : posts.filter((item) => item.category === activeCategory)), [activeCategory, posts, text.all]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visiblePosts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <MarketingLayout>
      <section className="border-b border-white/10 px-6 pb-10 pt-28">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="text-5xl font-black tracking-tight text-white">{text.title}</h1>
          <p className="mt-5 text-lg text-slate-400">{text.desc}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => {
                  setCategory(item);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-2 text-sm font-black transition ${activeCategory === item ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-[1200px] gap-5 md:grid-cols-3">
          {visiblePosts.map((post) => (
            <Link key={post.slug} href={`/news/${post.slug}`} className="rounded-[24px] border border-white/10 bg-white/[0.045] p-6 transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.07]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-300">{post.category}</span>
                <span className="text-xs font-bold text-slate-500">{post.date}</span>
              </div>
              <h2 className="text-xl font-black leading-8 text-white">{post.title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">{post.excerpt}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-300">
                {text.read} <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
        <div className="mx-auto mt-10 flex max-w-[1200px] items-center justify-center gap-5 text-sm text-slate-500">
          <button disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-white/10 px-4 py-2 disabled:opacity-40">
            {text.prev}
          </button>
          <span>
            {currentPage} / {totalPages} {text.page}
          </span>
          <button disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-lg border border-white/10 px-4 py-2 disabled:opacity-40">
            {text.next}
          </button>
        </div>
      </section>
    </MarketingLayout>
  );
}
