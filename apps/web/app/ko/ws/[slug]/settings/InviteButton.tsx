'use client';

import { Check, Link2 } from 'lucide-react';
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
      className={`h-8 px-3 rounded-lg text-[12px] font-semibold transition-all flex items-center gap-1.5 shadow-sm
        ${
          copied
            ? 'bg-success text-white'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
        }
      `}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          {t('copied')}
        </>
      ) : (
        <>
          <Link2 className="w-3.5 h-3.5" />
          {t('copyLink')}
        </>
      )}
    </button>
  );
}
