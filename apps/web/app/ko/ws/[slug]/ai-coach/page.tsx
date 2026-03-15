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
    <div className="flex flex-col gap-8 animate-fade-in-up pb-10">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h2>
        <p className="text-slate-500 font-medium text-sm">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Coach Interface */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
              <span className="text-[12rem]">🤖</span>
            </div>

            <div className="flex items-center gap-4 z-10">
              <div className="h-10 w-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-600/10 transition-transform">
                🤖
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-lg text-slate-900">{t('crumiCoach')}</h3>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  {t('engineActive')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 z-10">
              <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
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
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
                <button
                  type="button"
                  className="absolute bottom-3 right-3 h-9 px-5 bg-slate-900 text-white rounded-md font-bold text-xs hover:bg-slate-800 transition-all active:scale-[0.98]"
                >
                  {t('askCoach')}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col gap-6">
            <h3 className="font-bold text-lg flex items-center gap-2.5 text-slate-900">
              <span className="text-xl">🧠</span> {t('insightsScan')}
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
                        ? 'text-rose-700 bg-rose-50/50 border-rose-100'
                        : insight.type === 'OPPORTUNITY'
                          ? 'text-emerald-700 bg-emerald-50/50 border-emerald-100'
                          : 'text-indigo-700 bg-indigo-50/50 border-indigo-100'
                    }
                  />
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-lg bg-slate-50/30">
                  <p className="text-sm font-bold text-slate-400">{t('noInsights')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sales Health sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-xl bg-slate-900 p-8 shadow-xl shadow-slate-900/10 text-white flex flex-col gap-8 relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            
            <h3 className="font-bold text-lg text-slate-100">{t('salesHealth')}</h3>
            <div className="flex flex-col gap-6 z-10">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase opacity-50 tracking-wider">
                  {t('globalWinRate')}
                </span>
                <span className="text-4xl font-bold mt-1 tabular-nums tracking-tight">{winRate}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase opacity-50 tracking-wider">
                  {t('avgDealValue')}
                </span>
                <span className="text-2xl font-bold mt-1 tabular-nums tracking-tight">₩ {avgDealSize.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10 z-10 backdrop-blur-sm">
              <p className="text-[11px] font-semibold leading-relaxed italic text-emerald-100 opacity-90">
                &quot;
                {t('healthComment', {
                  count: insights.filter((i) => i.type === 'OPPORTUNITY').length,
                })}
                &quot;
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm flex flex-col gap-5">
            <h3 className="font-bold text-base text-slate-900">{t('coachMemory')}</h3>
            <div className="flex flex-col gap-3.5">
              <div className="text-xs font-semibold text-slate-500 leading-relaxed flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5" />
                <span>{t('analyzedCustomers', { count: customers?.length || 0 })}</span>
              </div>
              <div className="text-xs font-semibold text-slate-500 leading-relaxed flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5" />
                <span>{t('analyzedDeals', { count: deals?.length || 0 })}</span>
              </div>
              <div className="text-xs font-semibold text-slate-500 leading-relaxed flex items-start gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5" /> <span>{t('recentActivityScan')}</span>
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
