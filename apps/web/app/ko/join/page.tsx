'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function JoinWorkspacePage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('join');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError(t('errorEmpty'));
      return;
    }

    setLoading(true);

    // TODO: Supabase RPC 또는 API 라우트를 통한 초대 코드 검증 및 멤버 합류 로직
    // 현재는 더미 처리하여 뒤로가기 유도
    setTimeout(() => {
      setLoading(false);
      setError(t('errorPreparing'));
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-3xl text-success">
            🤝
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-center text-muted-foreground">{t('description')}</p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <form onSubmit={handleJoin} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-lg bg-warning/10 px-4 py-3 text-sm text-warning-foreground border border-warning/20">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="code" className="text-sm font-medium text-foreground">
                {t('codeLabel')}
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('codePlaceholder')}
                required
                className="h-11 rounded-lg border border-input bg-background px-3 text-center text-lg tracking-widest text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 uppercase"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code}
              className="mt-2 h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('checking') : t('submit')}
            </button>

            <Link
              href="/ko/workspace-select"
              className="mt-1 flex h-11 items-center justify-center rounded-xl font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
            >
              {t('cancel')}
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
