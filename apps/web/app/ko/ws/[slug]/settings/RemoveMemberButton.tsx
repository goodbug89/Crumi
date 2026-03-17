'use client';

import { removeMember } from '@/app/actions/members';
import { UserMinus } from 'lucide-react';
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
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-danger hover:bg-danger/10 px-2 py-1 rounded-lg text-[12px] font-medium transition-all disabled:opacity-50"
    >
      <UserMinus className="w-3.5 h-3.5" />
      {isPending ? t('processing') : t('button')}
    </button>
  );
}
