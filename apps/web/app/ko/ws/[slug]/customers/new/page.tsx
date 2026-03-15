'use client';

import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('customers.new');
  const tCommon = useTranslations('common');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    position: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

      // 워크스페이스 ID 조회
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();

      if (!workspace) throw new Error(t('errors.workspaceNotFound'));

      // 고객 데이터 추가
      const { error: insertError } = await supabase.from('customers').insert({
        workspace_id: workspace.id,
        name: formData.name,
        company_name: formData.company_name || null,
        position: formData.position || null,
        email: formData.email || null,
        phone: formData.phone || null,
        notes: formData.notes || null,
        status: 'active',
      });

      if (insertError) throw insertError;

      router.push(`/ko/ws/${slug}/customers`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-10 animate-fade-in-up pb-20">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <Link
            href={`/ko/ws/${slug}/customers`}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface text-muted-foreground hover:bg-muted transition-all"
          >
            ←
          </Link>
          <h2 className="text-3xl font-black tracking-tight text-foreground">{t('title')}</h2>
        </div>
        <p className="text-muted-foreground font-medium ml-14">{t('subtitle')}</p>
      </div>

      <div className="rounded-[40px] border border-border bg-surface shadow-2xl shadow-black/[0.03] overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-10">
          {error && (
            <div className="rounded-2xl bg-danger/10 px-6 py-4 text-sm font-bold text-danger border border-danger/20">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            <FormInput
              label={t('fields.name')}
              id="name"
              name="name"
              placeholder={t('fields.namePlaceholder')}
              required
              value={formData.name}
              onChange={handleChange}
            />
            <FormInput
              label={t('fields.company')}
              id="company_name"
              name="company_name"
              placeholder={t('fields.companyPlaceholder')}
              value={formData.company_name}
              onChange={handleChange}
            />
            <FormInput
              label={t('fields.position')}
              id="position"
              name="position"
              placeholder={t('fields.positionPlaceholder')}
              value={formData.position}
              onChange={handleChange}
            />
            <FormInput
              label={t('fields.phone')}
              id="phone"
              name="phone"
              placeholder={t('fields.phonePlaceholder')}
              value={formData.phone}
              onChange={handleChange}
            />
            <div className="md:col-span-2">
              <FormInput
                label={t('fields.email')}
                id="email"
                name="email"
                type="email"
                placeholder={t('fields.emailPlaceholder')}
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-3">
              <label
                htmlFor="notes"
                className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
              >
                {t('fields.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder={t('fields.notesPlaceholder')}
                rows={5}
                className="w-full rounded-3xl border border-border bg-muted/20 px-6 py-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none shadow-inner"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-border/50">
            <Link
              href={`/ko/ws/${slug}/customers`}
              className="h-14 px-8 flex items-center justify-center rounded-2xl font-bold text-muted-foreground hover:bg-muted transition-all"
            >
              {t('cancel')}
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="h-14 px-12 bg-primary text-white rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? t('submitting') : t('submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormInput({
  label,
  id,
  name,
  type = 'text',
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  id: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor={id}
        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1"
      >
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="h-14 w-full rounded-2xl border border-border bg-muted/20 px-6 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
      />
    </div>
  );
}
