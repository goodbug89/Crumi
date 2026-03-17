'use client';

import { createClient } from '@/lib/supabase/client';
import { ArrowLeft } from 'lucide-react';
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
    <div className="max-w-2xl mx-auto flex flex-col gap-4 animate-fade-in-up pb-10">
      <div className="flex items-center gap-3">
        <Link
          href={`/ko/ws/${slug}/pipeline`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-foreground">{t('new.title')}</h2>
          <p className="text-muted-foreground text-[13px]">{t('new.subtitle')}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-[13px] text-danger border border-danger/20">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            {/* 거래 제목 */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-[12px] font-medium text-foreground">
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
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 진행 단계 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="stage" className="text-[12px] font-medium text-foreground">
                  {t('new.fields.stage')}
                </label>
                <select
                  id="stage"
                  name="stage"
                  value={formData.stage}
                  onChange={handleChange}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="lead">{t('new.fields.stageOptions.lead')}</option>
                  <option value="contact">{t('new.fields.stageOptions.contact')}</option>
                  <option value="negotiation">{t('new.fields.stageOptions.negotiation')}</option>
                  <option value="won">{t('new.fields.stageOptions.won')}</option>
                </select>
              </div>

              {/* 예상 승률 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="probability" className="text-[12px] font-medium text-foreground">
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
                    className="h-9 w-full rounded-lg border border-input bg-background px-3 pr-8 text-[13px] text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>
              </div>

              {/* 예상 금액 */}
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label htmlFor="amount" className="text-[12px] font-medium text-foreground">
                  {t('new.fields.amount')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground pointer-events-none">
                    ₩
                  </span>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder={t('new.fields.amountPlaceholder')}
                    className="h-9 w-full rounded-lg border border-input bg-background pl-7 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                  />
                </div>
              </div>

              {/* 연결된 고객 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="customer_id" className="text-[12px] font-medium text-foreground">
                  {t('new.fields.customer')}
                </label>
                <select
                  id="customer_id"
                  name="customer_id"
                  value={formData.customer_id}
                  onChange={handleChange}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">{t('new.fields.customerDefault')}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 연계 프로젝트 */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="project_id" className="text-[12px] font-medium text-foreground">
                  {t('new.fields.project')}
                </label>
                <select
                  id="project_id"
                  name="project_id"
                  value={formData.project_id}
                  onChange={handleChange}
                  className="h-9 w-full rounded-lg border border-input bg-background px-3 text-[13px] text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all appearance-none cursor-pointer"
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

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Link
              href={`/ko/ws/${slug}/pipeline`}
              className="h-9 px-4 flex items-center justify-center rounded-lg border border-border bg-background text-[13px] font-medium text-muted-foreground hover:bg-muted transition-all"
            >
              {t('new.cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="h-9 px-5 bg-primary text-white rounded-lg text-[13px] font-medium shadow-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? t('new.submitting') : t('new.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
