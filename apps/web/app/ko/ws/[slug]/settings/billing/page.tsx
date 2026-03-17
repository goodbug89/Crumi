import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, CalendarClock, Check, CreditCard } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function BillingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  const t = await getTranslations('settings.billing');

  // 워크스페이스 정보 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug, plan')
    .eq('slug', slug)
    .single();

  if (!workspace) {
    redirect('/ko/workspace-select');
  }

  const currentPlan = workspace.plan || 'free';

  type PlanKey = 'starter' | 'pro' | 'enterprise';
  const planKeys: PlanKey[] = ['starter', 'pro', 'enterprise'];

  const plans = planKeys.map((key) => ({
    id: key === 'starter' ? 'free' : key === 'enterprise' ? 'business' : key,
    name: t(`plans.${key}.name`),
    price: t(`plans.${key}.price`),
    period: key !== 'starter' ? t(`plans.${key}.period`) : undefined,
    description: t(`plans.${key}.description`),
    features: t.raw(`plans.${key}.features`) as string[],
    button: t(`plans.${key}.button`),
    active:
      key === 'starter'
        ? currentPlan === 'free'
        : key === 'pro'
          ? currentPlan === 'pro'
          : currentPlan === 'business',
    highlight: key === 'pro',
  }));

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href={`/ko/ws/${slug}/settings`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-[13px] text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {/* 현재 구독 정보 */}
      <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[13px] text-foreground">{t('currentSubscription')}</h3>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
            {t('billingOverview')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-primary/60">
              {t('currentPlan')}
            </p>
            <p className="text-lg font-bold text-primary capitalize">{currentPlan}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border border-border flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="w-3 h-3 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('nextBillingDate')}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">{t('nextBillingValue')}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/20 border border-border flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3 h-3 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('paymentMethod')}
              </p>
            </div>
            <p className="text-sm font-semibold text-foreground">{t('paymentMethodValue')}</p>
          </div>
        </div>
      </div>

      {/* 플랜 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col p-5 rounded-xl border-2 transition-all ${
              plan.highlight
                ? 'border-primary bg-card shadow-lg shadow-primary/10 scale-[1.02] z-10'
                : 'border-border bg-card/50 opacity-90'
            }`}
          >
            {plan.highlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow">
                {t('mostPopular')}
              </div>
            )}

            <div className="flex flex-col gap-1 mb-4">
              <h4 className="text-base font-bold text-foreground">{plan.name}</h4>
              <p className="text-[12px] text-muted-foreground">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-black text-foreground">{plan.price}</span>
              {plan.period && (
                <span className="text-[13px] font-medium text-muted-foreground">{plan.period}</span>
              )}
            </div>

            <div className="flex flex-col gap-2.5 mb-5 flex-1">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-2 text-[13px] font-medium text-foreground/80"
                >
                  <Check className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={plan.active}
              className={`w-full py-2.5 rounded-lg font-semibold text-[13px] transition-all active:scale-95 ${
                plan.active
                  ? 'bg-muted text-muted-foreground cursor-default'
                  : plan.highlight
                    ? 'bg-primary text-white shadow-md shadow-primary/20 hover:bg-primary/90'
                    : 'border border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {plan.active ? t('currentlyUsing') : plan.button}
            </button>
          </div>
        ))}
      </div>

      {/* 하단 안내 */}
      <div className="p-4 rounded-xl bg-muted/20 border border-border/50 text-center">
        <p className="text-[13px] text-muted-foreground">
          {t('annualDiscount')}
          <br />
          {t('enterpriseContact')}{' '}
          <a href="mailto:support@crumi.io" className="text-primary font-semibold hover:underline">
            support@crumi.io
          </a>
        </p>
      </div>
    </div>
  );
}
