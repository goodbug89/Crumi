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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-[400px]">
        {/* 로고 */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white text-xl font-bold shadow-xl shadow-slate-900/10 transition-transform hover:scale-105">
            C
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('title')}</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">{t('subtitle')}</p>
          </div>
        </div>

        {/* Auth Content */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
