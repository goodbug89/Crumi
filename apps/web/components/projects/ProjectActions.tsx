'use client';

import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProjectActionsProps {
  slug: string;
  projectId: string;
  projectName: string;
}

export default function ProjectActions({ slug, projectId, projectName }: ProjectActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations('projects.actions');

  const handleDelete = async () => {
    if (!confirm(t('confirmDelete', { projectName }))) {
      return;
    }

    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId);

      if (error) throw error;

      router.push(`/ko/ws/${slug}/projects`);
      router.refresh();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(t('deleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => router.push(`/ko/ws/${slug}/projects/${projectId}/edit`)}
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
