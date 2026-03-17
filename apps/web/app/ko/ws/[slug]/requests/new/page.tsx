'use client';

import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewRequestPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('requests.new');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t('errors.auth'));

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!workspace) throw new Error(t('errors.workspaceNotFound'));

      const { error: insertError } = await supabase.from('feature_requests').insert({
        workspace_id: workspace.id,
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        status: 'open',
        vote_count: 1, // 본인 자동 1표
      });

      if (insertError) throw insertError;

      router.push(`/ko/ws/${slug}/requests`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/ko/ws/${slug}/requests`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h2>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {error && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-danger shrink-0" />
              {error}
            </p>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                {t('fields.titleLabel')} <span className="text-danger">{t('required')}</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('fields.titlePlaceholder')}
                required
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-sm font-medium text-foreground">
                {t('fields.category')}
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 appearance-none"
              >
                <option value="customer">{t('fields.categories.customer')}</option>
                <option value="pipeline">{t('fields.categories.pipeline')}</option>
                <option value="project">{t('fields.categories.project')}</option>
                <option value="nudge">{t('fields.categories.nudge')}</option>
                <option value="ai">{t('fields.categories.ai')}</option>
                <option value="other">{t('fields.categories.other')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                {t('fields.descriptionLabel')} <span className="text-danger">{t('required')}</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('fields.descriptionPlaceholder')}
                required
                rows={6}
                className="rounded-lg border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href={`/ko/ws/${slug}/requests`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-semibold text-foreground transition-all hover:bg-muted"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.description}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
