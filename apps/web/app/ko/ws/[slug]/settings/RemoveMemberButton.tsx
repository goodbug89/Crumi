'use client';

import { removeMember } from '@/app/actions/members';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

export default function RemoveMemberButton({
  slug,
  memberId,
  memberName,
}: {
  slug: string;
  memberId: string;
  memberName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('settings.removeMember');

  const handleRemove = () => {
    const confirmed = window.confirm(t('confirmMessage', { memberName }));

    if (!confirmed) return;

    startTransition(async () => {
      const result = await removeMember(slug, memberId);
      if (result.error) {
        alert(t('error', { error: result.error }));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={isPending}
      className="text-danger hover:bg-danger/10 p-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
    >
      {isPending ? t('processing') : t('button')}
    </button>
  );
}
