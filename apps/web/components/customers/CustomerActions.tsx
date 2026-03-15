'use client';

import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CustomerActionsProps {
  slug: string;
  customerId: string;
  customerName: string;
}

export default function CustomerActions({ slug, customerId, customerName }: CustomerActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations('customers.actions');

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete', { customerName }))) {
      return;
    }

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('customers')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', customerId);

      if (error) throw error;

      router.push(`/ko/ws/${slug}/customers`);
      router.refresh();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert(t('deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => router.push(`/ko/ws/${slug}/customers/${customerId}/edit`)}
        className="h-9 px-4 rounded-lg border border-border bg-surface text-sm font-medium transition-colors hover:bg-muted"
      >
        {t('edit')}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="h-9 px-4 rounded-lg bg-danger/10 text-danger text-sm font-medium transition-colors hover:bg-danger/20 disabled:opacity-50"
      >
        {isDeleting ? t('deleting') : t('delete')}
      </button>
    </div>
  );
}
