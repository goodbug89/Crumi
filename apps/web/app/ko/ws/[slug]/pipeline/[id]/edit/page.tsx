'use client';

import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const t = useTranslations('pipelineEdit');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    probability: '50',
    stage: 'lead',
    customer_id: '',
    project_id: '',
  });

  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const STAGES = [
    { id: 'lead', name: t('fields.stageOptions.lead') },
    { id: 'contact', name: t('fields.stageOptions.contact') },
    { id: 'negotiation', name: t('fields.stageOptions.negotiation') },
    { id: 'won', name: t('fields.stageOptions.won') },
    { id: 'lost', name: t('fields.stageOptions.lost') },
  ];

  useEffect(() => {
    const supabase = createClient();

    async function loadWorkspace() {
      const { data } = await supabase.from('workspaces').select('id').eq('slug', slug).single();
      if (!data) throw new Error(t('errors.loadFailed'));
      return data;
    }

    async function loadDeal() {
      const { data, error: dealError } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();
      if (dealError) throw dealError;
      return data;
    }

    async function loadOptions(workspaceId: string) {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase
          .from('customers')
          .select('id, name')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null),
        supabase
          .from('projects')
          .select('id, name')
          .eq('workspace_id', workspaceId)
          .is('deleted_at', null),
      ]);
      return { customers: c || [], projects: p || [] };
    }

    loadWorkspace()
      .then(async (workspace) => {
        const [deal, options] = await Promise.all([loadDeal(), loadOptions(workspace.id)]);
        if (deal) {
          setFormData({
            title: deal.title || '',
            amount: deal.amount?.toString() || '',
            probability: deal.probability?.toString() || '50',
            stage: deal.stage || 'lead',
            customer_id: deal.customer_id || '',
            project_id: deal.project_id || '',
          });
        }
        setCustomers(options.customers);
        setProjects(options.projects);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('errors.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [id, slug, t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from('deals')
        .update({
          title: formData.title,
          amount: formData.amount ? Number.parseInt(formData.amount) : null,
          probability: Number.parseInt(formData.probability),
          stage: formData.stage,
          customer_id: formData.customer_id || null,
          project_id: formData.project_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      router.push(`/ko/ws/${slug}/pipeline`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/ko/ws/${slug}/pipeline`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h2>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                {t('fields.title')} <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('fields.titlePlaceholder')}
                required
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="stage" className="text-sm font-medium text-foreground">
                  {t('fields.stage')}
                </label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="probability" className="text-sm font-medium text-foreground">
                  {t('fields.probability')}
                </label>
                <input
                  id="probability"
                  name="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={handleChange}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="amount" className="text-sm font-medium text-foreground">
                  {t('fields.amount')}
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder={t('fields.amountPlaceholder')}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="customer_id" className="text-sm font-medium text-foreground">
                  {t('fields.customer')}
                </label>
                <select
                  id="customer_id"
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">{t('fields.customerDefault')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="project_id" className="text-sm font-medium text-foreground">
                  {t('fields.project')}
                </label>
                <select
                  id="project_id"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
                >
                  <option value="">{t('fields.projectDefault')}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href={`/ko/ws/${slug}/pipeline`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-semibold text-foreground transition-all hover:bg-muted"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.title}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
