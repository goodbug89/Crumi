import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: '로그인 — Crumi',
  description: 'Crumi에 로그인하여 고객 관리를 시작하세요.',
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('auth');

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* 로고 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-3xl">
            💬
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>

        {/* Auth Content */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
