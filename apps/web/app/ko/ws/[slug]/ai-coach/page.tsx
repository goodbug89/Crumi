import { type AIInsight, analyzeSalesData } from '@/lib/ai/coach';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AICoachPage({
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

  const t = await getTranslations('aiCoach');

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

  // 분석을 위한 데이터 동시 조회
  const [{ data: deals }, { data: customers }, { data: activities }] = await Promise.all([
    supabase.from('deals').select('*').eq('workspace_id', workspace.id).is('deleted_at', null),
    supabase.from('customers').select('*').eq('workspace_id', workspace.id).is('deleted_at', null),
    supabase
      .from('activities')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  // AI 엔진(Mock) 가동
  const insights: AIInsight[] = analyzeSalesData({
    customers: customers || [],
    deals: deals || [],
    activities: activities || [],
  });

  const winRate =
    deals && deals.length > 0
      ? Math.round((deals.filter((d) => d.stage === 'won').length / deals.length) * 100)
      : 0;

  const avgDealSize =
    deals && deals.length > 0
      ? Math.round(deals.reduce((acc, d) => acc + (d.amount || 0), 0) / deals.length)
      : 0;

  return (
    <div className="flex flex-col gap-10 animate-fade-in-up pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{t('title')}</h2>
        <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coach Interface */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-[40px] border border-border bg-surface p-8 shadow-2xl shadow-black/[0.03] flex flex-col gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <span className="text-9xl">🤖</span>
            </div>

            <div className="flex items-center gap-4 z-10">
              <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl shadow-lg shadow-primary/20 animate-float">
                🤖
              </div>
              <div className="flex flex-col">
                <h3 className="font-black text-xl">{t('crumiCoach')}</h3>
                <p className="text-xs font-bold text-success uppercase tracking-widest">
                  {t('engineActive')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 z-10">
              <div className="bg-muted/40 p-6 rounded-[28px] border border-border/50">
                <p className="text-sm font-medium leading-relaxed">
                  {t('greeting', {
                    dealCount: deals?.length || 0,
                    customerCount: customers?.length || 0,
                  })}{' '}
                  <br />
                  {insights.length > 0
                    ? t('hasInsights', { firstInsight: insights[0].title })
                    : t('needMoreData')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 z-10">
              <div className="relative">
                <textarea
                  placeholder={t('askPlaceholder')}
                  className="w-full h-32 bg-muted/20 border border-border rounded-3xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none shadow-inner"
                />
                <button
                  type="button"
                  className="absolute bottom-4 right-4 h-10 px-6 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  {t('askCoach')}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[40px] border border-border bg-surface p-8 shadow-sm flex flex-col gap-6">
            <h3 className="font-black text-xl flex items-center gap-2">
              <span>🧠</span> {t('insightsScan')}
            </h3>
            <div className="flex flex-col gap-4">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <InsightCard
                    key={insight.title}
                    type={insight.type}
                    title={insight.title}
                    message={insight.message}
                    insightLabel={t('insight')}
                    color={
                      insight.type === 'URGENT'
                        ? 'text-danger bg-danger/5 border-danger/10'
                        : insight.type === 'OPPORTUNITY'
                          ? 'text-success bg-success/5 border-success/10'
                          : 'text-primary bg-primary/5 border-primary/10'
                    }
                  />
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-border rounded-[32px] bg-muted/10">
                  <p className="text-sm font-bold text-muted-foreground">{t('noInsights')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Health sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-[40px] border border-border bg-gradient-to-br from-primary to-primary/80 p-8 shadow-xl shadow-primary/20 text-white flex flex-col gap-6">
            <h3 className="font-black text-lg">{t('salesHealth')}</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase opacity-60 tracking-widest">
                  {t('globalWinRate')}
                </span>
                <span className="text-4xl font-black">{winRate}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase opacity-60 tracking-widest">
                  {t('avgDealValue')}
                </span>
                <span className="text-2xl font-black">₩ {avgDealSize.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/10 rounded-2xl border border-white/20">
              <p className="text-[10px] font-bold leading-relaxed italic opacity-90">
                &quot;
                {t('healthComment', {
                  count: insights.filter((i) => i.type === 'OPPORTUNITY').length,
                })}
                &quot;
              </p>
            </div>
          </div>

          <div className="rounded-[40px] border border-border bg-surface p-8 shadow-sm flex flex-col gap-4">
            <h3 className="font-black text-lg">{t('coachMemory')}</h3>
            <div className="flex flex-col gap-3">
              <div className="text-xs font-medium text-muted-foreground leading-relaxed flex items-start gap-2">
                <span className="text-primary">•</span>{' '}
                <span>{t('analyzedCustomers', { count: customers?.length || 0 })}</span>
              </div>
              <div className="text-xs font-medium text-muted-foreground leading-relaxed flex items-start gap-2">
                <span className="text-primary">•</span>{' '}
                <span>{t('analyzedDeals', { count: deals?.length || 0 })}</span>
              </div>
              <div className="text-xs font-medium text-muted-foreground leading-relaxed flex items-start gap-2">
                <span className="text-primary">•</span> <span>{t('recentActivityScan')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  type,
  title,
  message,
  color,
  insightLabel,
}: { type: string; title: string; message: string; color: string; insightLabel: string }) {
  return (
    <div
      className={`p-6 rounded-3xl ${color} flex flex-col gap-2 border shadow-sm transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{type}</span>
        <span className="text-[10px] font-bold opacity-60">{insightLabel}</span>
      </div>
      <h4 className="font-black text-lg">{title}</h4>
      <p className="text-sm font-medium leading-relaxed opacity-90">{message}</p>
    </div>
  );
}
