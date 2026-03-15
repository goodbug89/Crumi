import { createClient } from '@/lib/supabase/server';
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
    .select(`
      id, name, slug, plan,
      subscription_status:subscription_events(plan, status, created_at)
    `)
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
    <div className="flex flex-col gap-10 animate-fade-in-up pb-20">
      <div className="flex items-center gap-6">
        <Link
          href={`/ko/ws/${slug}/settings`}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface text-muted-foreground hover:bg-muted transition-all"
        >
          ←
        </Link>
        <div className="flex flex-col">
          <h2 className="text-3xl font-black tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
        </div>
      </div>

      <div className="rounded-[40px] border border-border bg-surface p-8 shadow-sm flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-xl">{t('currentSubscription')}</h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
            {t('billingOverview')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-primary/5 border border-primary/20 flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">
              {t('currentPlan')}
            </p>
            <p className="text-2xl font-black text-primary capitalize">{currentPlan}</p>
          </div>
          <div className="p-6 rounded-3xl bg-muted/20 border border-border flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t('nextBillingDate')}
            </p>
            <p className="text-xl font-bold text-foreground">{t('nextBillingValue')}</p>
          </div>
          <div className="p-6 rounded-3xl bg-muted/20 border border-border flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t('paymentMethod')}
            </p>
            <p className="text-xl font-bold text-foreground">{t('paymentMethodValue')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col p-10 rounded-[48px] border-2 transition-all hover-lift ${
              plan.highlight
                ? 'border-primary bg-surface shadow-2xl shadow-primary/10 scale-105 z-10'
                : 'border-border bg-surface/50 grayscale-[0.2] opacity-90'
            }`}
          >
            {plan.highlight && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg">
                {t('mostPopular')}
              </div>
            )}

            <div className="flex flex-col gap-2 mb-8">
              <h4 className="text-xl font-black text-foreground">{plan.name}</h4>
              <p className="text-xs font-medium text-muted-foreground">{plan.description}</p>
            </div>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black text-foreground">{plan.price}</span>
              {plan.period && (
                <span className="text-sm font-bold text-muted-foreground">{plan.period}</span>
              )}
            </div>

            <div className="flex flex-col gap-4 mb-10">
              {plan.features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 text-sm font-medium text-foreground/80"
                >
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={plan.active}
              className={`mt-auto w-full py-5 rounded-3xl font-black text-sm transition-all active:scale-95 ${
                plan.active
                  ? 'bg-muted text-muted-foreground cursor-default'
                  : plan.highlight
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary/90'
                    : 'border-2 border-border bg-background text-foreground hover:bg-muted'
              }`}
            >
              {plan.active ? t('currentlyUsing') : plan.button}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-10 p-8 rounded-[40px] bg-muted/20 border border-border/50 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          {t('annualDiscount')} <br />
          {t('enterpriseContact')}{' '}
          <a href="mailto:support@crumi.io" className="text-primary font-bold hover:underline">
            support@crumi.io
          </a>
        </p>
      </div>
    </div>
  );
}
