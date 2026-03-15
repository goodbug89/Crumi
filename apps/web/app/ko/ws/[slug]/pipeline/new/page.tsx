'use client';

import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function NewDealPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const t = useTranslations('pipeline');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    stage: 'lead',
    amount: '',
    probability: '50',
    customer_id: searchParams.get('customer_id') || '',
    project_id: searchParams.get('project_id') || '',
  });

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();

      if (workspace) {
        const { data: cData } = await supabase
          .from('customers')
          .select('id, name')
          .eq('workspace_id', workspace.id)
          .is('deleted_at', null);
        const { data: pData } = await supabase
          .from('projects')
          .select('id, name')
          .eq('workspace_id', workspace.id)
          .is('deleted_at', null);
        if (cData) setCustomers(cData);
        if (pData) setProjects(pData);
      }
    };
    fetchData();
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

      const { error: insertError } = await supabase.from('deals').insert({
        workspace_id: workspace.id,
        title: formData.title,
        stage: formData.stage,
        currency: 'KRW',
        amount: formData.amount ? Number.parseInt(formData.amount, 10) : null,
        probability: Number.parseInt(formData.probability, 10) || 0,
        customer_id: formData.customer_id || null,
        project_id: formData.project_id || null,
      });

      if (insertError) throw insertError;

      router.push(`/ko/ws/${slug}/pipeline`);
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
            href={`/ko/ws/${slug}/pipeline`}
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
                htmlFor="title"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
              >
                {t('new.fields.title')} <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder={t('new.fields.titlePlaceholder')}
                required
                className="h-16 w-full rounded-2xl border border-border bg-muted/20 px-8 text-lg font-black text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex flex-col gap-3">
                <label
                  htmlFor="stage"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                >
                  {t('new.fields.stage')}
                </label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 font-bold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                >
                  <option value="lead">{t('new.fields.stageOptions.lead')}</option>
                  <option value="contact">{t('new.fields.stageOptions.contact')}</option>
                  <option value="negotiation">{t('new.fields.stageOptions.negotiation')}</option>
                  <option value="won">{t('new.fields.stageOptions.won')}</option>
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <label
                  htmlFor="probability"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                >
                  {t('new.fields.probability')}
                </label>
                <div className="relative">
                  <input
                    id="probability"
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability}
                    onChange={handleChange}
                    className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 font-bold text-foreground focus:border-primary transition-all shadow-inner"
                  />
                  <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black">
                    %
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:col-span-2">
                <label
                  htmlFor="amount"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                >
                  {t('new.fields.amount')}
                </label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground font-black">
                    ₩
                  </span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder={t('new.fields.amountPlaceholder')}
                    className="h-16 w-full rounded-2xl border border-border bg-muted/20 pl-12 pr-6 text-xl font-black text-primary focus:border-primary transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label
                  htmlFor="customer_id"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                >
                  {t('new.fields.customer')}
                </label>
                <select
                  id="customer_id"
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 font-bold text-foreground focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="">{t('new.fields.customerDefault')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3">
                <label
                  htmlFor="project_id"
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
                >
                  {t('new.fields.project')}
                </label>
                <select
                  id="project_id"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 font-bold text-foreground focus:border-primary transition-all appearance-none cursor-pointer"
                >
                  <option value="">{t('new.fields.projectDefault')}</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-border/50">
            <Link
              href={`/ko/ws/${slug}/pipeline`}
              className="h-14 px-8 flex items-center justify-center rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all"
            >
              {t('new.cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.title}
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
