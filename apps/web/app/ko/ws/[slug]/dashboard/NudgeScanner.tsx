'use client';

import { scanAndGenerateNudges } from '@/app/actions/nudges';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NudgeScanner({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations('dashboard.nudgeScanner');

  const handleScan = async () => {
    setLoading(true);
    try {
      const result = await scanAndGenerateNudges(slug);
      if (result.count && result.count > 0) {
        alert(t('newNudges', { count: result.count }));
      } else {
        alert(t('noNewNudges'));
      }
      router.refresh();
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleScan}
      disabled={loading}
      className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-all hover:bg-muted disabled:opacity-50"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          {t('scanning')}
        </span>
      ) : (
        t('button')
      )}
    </button>
  );
}
