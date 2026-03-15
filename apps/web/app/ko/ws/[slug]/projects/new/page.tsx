'use client';

import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewProjectPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('projects');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
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
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();
      if (!workspace) throw new Error(t('new.errors.workspaceNotFound'));

      const { error: insertError } = await supabase.from('projects').insert({
        workspace_id: workspace.id,
        name: formData.name,
        description: formData.description || null,
        status: formData.status,
      });

      if (insertError) throw insertError;

      router.push(`/ko/ws/${slug}/projects`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('new.errors.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-10 animate-fade-in-up pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Link
            href={`/ko/ws/${slug}/projects`}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-muted-foreground hover:bg-muted transition-all"
          >
            ←
          </Link>
          <h2 className="text-3xl font-black tracking-tight text-foreground">{t('new.title')}</h2>
        </div>
        <p className="text-muted-foreground font-medium ml-14">{t('new.subtitle')}</p>
      </div>

      <div className="rounded-[40px] border border-border bg-surface shadow-2xl shadow-black/[0.03] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-10">
          {error && (
            <div className="rounded-2xl bg-danger/10 px-6 py-4 text-sm font-bold text-danger border border-danger/20">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <label
                htmlFor="name"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
              >
                {t('new.fields.name')} <span className="text-danger">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('new.fields.namePlaceholder')}
                required
                className="h-16 w-full rounded-2xl border border-border bg-muted/20 px-8 text-lg font-black text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor="status"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
              >
                {t('new.fields.status')}
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 font-bold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
              >
                <option value="planning">{t('new.fields.statusOptions.planning')}</option>
                <option value="in_progress">{t('new.fields.statusOptions.inProgress')}</option>
                <option value="on_hold">{t('new.fields.statusOptions.onHold')}</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <label
                htmlFor="description"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
              >
                {t('new.fields.description')}
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t('new.fields.descriptionPlaceholder')}
                rows={6}
                className="w-full rounded-[32px] border border-border bg-muted/20 px-8 py-6 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-border/50">
            <Link
              href={`/ko/ws/${slug}/projects`}
              className="h-14 px-8 flex items-center justify-center rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all"
            >
              {t('new.cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="h-14 px-12 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? t('new.submitting') : t('new.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
