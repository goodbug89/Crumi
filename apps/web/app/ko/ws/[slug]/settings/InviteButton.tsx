'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function InviteButton({
  slug,
  inviteCode,
}: {
  slug: string;
  inviteCode: string;
}) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations('settings.invite');

  const handleCopy = () => {
    const url = `${window.location.origin}/ko/join/${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`h-9 px-4 rounded-lg text-sm font-bold transition-all shadow-sm
        ${
          copied
            ? 'bg-success text-white'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
        }
      `}
    >
      {copied ? t('copied') : t('copyLink')}
    </button>
  );
}
