import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

export function shortenApiKey(key: string) {
  if (!key || key.length < 12) return key;
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
