import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind CSS 클래스 병합 유틸리티 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 날짜를 로컬 포맷으로 변환 */
export function formatDate(date: string | Date, locale = 'ko-KR'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/** 날짜+시간을 로컬 포맷으로 변환 */
export function formatDateTime(date: string | Date, locale = 'ko-KR'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/** 통화 포맷 (Intl API) */
export function formatCurrency(amount: number, currency = 'KRW', locale = 'ko-KR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** 상대 시간 (예: "3일 전") */
export function formatRelativeTime(date: string | Date, locale = 'ko-KR'): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return rtf.format(-diffMinutes, 'minute');
    }
    return rtf.format(-diffHours, 'hour');
  }
  if (diffDays < 30) {
    return rtf.format(-diffDays, 'day');
  }
  if (diffDays < 365) {
    return rtf.format(-Math.floor(diffDays / 30), 'month');
  }
  return rtf.format(-Math.floor(diffDays / 365), 'year');
}

/** 쿨타임 진행률 계산 (0~1, 1 이상이면 초과) */
export function calculateCooltimeProgress(
  lastActivityAt: string | Date | null,
  cooltimeDays: number,
): number {
  if (!lastActivityAt) return 1;
  const now = new Date();
  const last = new Date(lastActivityAt);
  const elapsed = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
  return elapsed / cooltimeDays;
}

/** 쿨타임 진행률 → 넛지 긴급도 */
export function getUrgencyFromProgress(progress: number): 'info' | 'warning' | 'urgent' | 'critical' {
  if (progress >= 4) return 'critical';
  if (progress >= 2) return 'urgent';
  if (progress >= 1) return 'warning';
  return 'info';
}
