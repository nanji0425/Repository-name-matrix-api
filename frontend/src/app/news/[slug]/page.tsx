import { newsPosts } from '@/components/marketing/marketingData';
import NewsDetailClient from './NewsDetailClient';

export function generateStaticParams() {
  return newsPosts.map((post) => ({ slug: post.slug }));
}

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <NewsDetailClient slug={slug} />;
}
