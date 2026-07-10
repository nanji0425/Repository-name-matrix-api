// 紫粉渐变卡片组件
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className, hover = true, gradient = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[24px] border border-purple-100/50 bg-white/90 p-6 shadow-soft transition-all duration-300',
        hover && 'hover:shadow-soft-lg hover:-translate-y-1',
        gradient && 'bg-gradient-to-br from-purple-50 to-pink-50',
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  gradient?: 'purple' | 'pink' | 'blue' | 'green';
}

export function StatCard({ icon, value, label, trend, gradient = 'purple' }: StatCardProps) {
  const gradients = {
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-rose-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-teal-500',
  };

  return (
    <Card className="relative overflow-hidden">
      <div className={cn('inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white', gradients[gradient])}>
        {icon}
      </div>
      <div className="mt-4 text-3xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-sm text-gray-600">{label}</div>
      {trend && <div className="mt-2 text-xs font-semibold text-purple-600">{trend}</div>}
    </Card>
  );
}

interface ModelCardProps {
  name: string;
  provider: string;
  inputPrice: number;
  outputPrice: number;
  category: string;
  icon?: ReactNode;
}

export function ModelCard({ name, provider, inputPrice, outputPrice, category, icon }: ModelCardProps) {
  return (
    <Card hover className="group">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
          {icon || provider[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{name}</h3>
          <p className="text-xs text-gray-500">{provider}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-purple-600">${inputPrice.toFixed(4)}</span>
          <span className="text-sm text-gray-500">/ 1M tokens 输入</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-pink-600">${outputPrice.toFixed(4)}</span>
          <span className="text-sm text-gray-500">/ 1M tokens 输出</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
          {category}
        </span>
        <button className="ml-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-glow-purple">
          详情
        </button>
      </div>
    </Card>
  );
}

export default Card;
