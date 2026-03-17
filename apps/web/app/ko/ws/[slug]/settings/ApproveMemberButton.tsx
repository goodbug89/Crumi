'use client';

import { approveMember } from '@/app/actions/members';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export default function ApproveMemberButton({
  slug,
  memberId,
  action,
}: {
  slug: string;
  memberId: string;
  action: 'approve' | 'reject';
}) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('settings.approveMember');

  const handleClick = () => {
    startTransition(async () => {
      const result = await approveMember(slug, memberId, action);
      if (result.error) {
        alert(result.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50 ${
        action === 'approve'
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : 'border border-border text-muted-foreground hover:bg-danger/10 hover:text-danger hover:border-danger/30'
      }`}
    >
      {isPending ? t('processing') : action === 'approve' ? t('approve') : t('reject')}
    </button>
  );
}
