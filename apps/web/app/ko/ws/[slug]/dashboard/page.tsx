import { analyzeSalesData } from '@/lib/ai/coach';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import NudgeScanner from './NudgeScanner';

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const activeFilter = sp.activities === 'mine' ? 'mine' : 'all';

  const t = await getTranslations('dashboard');
  const tActivities = await getTranslations('activities');
  const tCommon = await getTranslations('common');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

  // 통계 데이터 동시 조회
  const [
    { count: customerCount },
    { count: projectCount },
    { count: dealCount },
    { data: activeNudges },
    { data: recentActivities },
    { data: dealList },
    { data: allCustomers },
  ] = await Promise.all([
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .eq('status', 'active'),
    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .eq('status', 'in_progress'),
    supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspace.id)
      .neq('stage', 'won'),
    supabase
      .from('nudges')
      .select('*, customers(name), projects(name)')
      .eq('workspace_id', workspace.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(3),
    supabase
      .from('activities')
      .select('*, customers(name), projects(name), user_profiles(display_name)')
      .eq('workspace_id', workspace.id)
      .match(activeFilter === 'mine' ? { user_id: user.id } : {})
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('deals').select('*').eq('workspace_id', workspace.id).is('deleted_at', null),
    supabase.from('customers').select('*').eq('workspace_id', workspace.id).is('deleted_at', null),
  ]);

  const deals = dealList || [];

  // AI 인사이트 도출
  const insights = analyzeSalesData({
    customers: allCustomers || [],
    deals: deals,
    activities: recentActivities || [],
  });

  const dealsByStage = {
    lead: deals.filter((d) => d.stage === 'lead').length,
    contact: deals.filter((d) => d.stage === 'contact').length,
    negotiation: deals.filter((d) => d.stage === 'negotiation').length,
    won: deals.filter((d) => d.stage === 'won').length,
  };

  const maxDeals = Math.max(...Object.values(dealsByStage), 1);

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full pb-12 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-slate-500 mt-1.5 text-sm font-medium">
            {t('subtitle', { workspaceName: workspace.name })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NudgeScanner slug={slug} />
        </div>
      </div>

      {/* 주요 통계 (KPIS) */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('stats.activeCustomers')}
          value={customerCount || 0}
          icon="👥"
          trend={t('stats.trendCustomers')}
        />
        <StatCard
          title={t('stats.activeProjects')}
          value={projectCount || 0}
          icon="📁"
          trend={t('stats.trendProjects')}
        />
        <StatCard
          title={t('stats.activeDeals')}
          value={dealCount || 0}
          icon="📊"
          trend={t('stats.trendDeals')}
        />
        <StatCard
          title={t('stats.expectedRevenue')}
          value={`₩ ${(deals.reduce((acc, d) => acc + (d.amount || 0), 0) / 10000).toFixed(1)}${t('stats.unit10k')}`}
          icon="💰"
          trend={t('stats.trendRevenue')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 영업 파이프라인 시각화 */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col gap-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span className="text-xl">📈</span> {t('pipeline.title')}
            </h3>
            <Link
              href={`/ko/ws/${slug}/pipeline`}
              className="text-xs text-primary hover:underline font-semibold bg-primary/5 px-2.5 py-1 rounded-md"
            >
              {t('pipeline.viewDetail')}
            </Link>
          </div>

          <div className="flex items-end gap-3 sm:gap-6 h-48 px-4 border-b border-slate-100 pb-4">
            <Bar
              label={t('pipeline.stages.lead')}
              count={dealsByStage.lead}
              max={maxDeals}
              color="bg-slate-100"
            />
            <Bar
              label={t('pipeline.stages.contact')}
              count={dealsByStage.contact}
              max={maxDeals}
              color="bg-slate-200"
            />
            <Bar
              label={t('pipeline.stages.negotiation')}
              count={dealsByStage.negotiation}
              max={maxDeals}
              color="bg-primary/40"
            />
            <Bar
              label={t('pipeline.stages.won')}
              count={dealsByStage.won}
              max={maxDeals}
              color="bg-primary text-white"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-2">
            <div className="text-center">
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wide mb-1">
                {t('pipeline.totalAmount')}
              </p>
              <p className="text-lg font-bold text-slate-900">
                ₩ {deals.reduce((acc, d) => acc + (d.amount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center border-l border-slate-100">
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wide mb-1">
                {t('pipeline.avgWinRate')}
              </p>
              <p className="text-lg font-bold text-slate-900">
                {deals.length > 0
                  ? Math.round(
                      deals.reduce((acc, d) => acc + (d.probability || 0), 0) / deals.length,
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="text-center border-l border-slate-100 hidden sm:block">
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wide mb-1">
                {t('pipeline.avgDealSize')}
              </p>
              <p className="text-lg font-bold text-slate-900">
                ₩{' '}
                {deals.length > 0
                  ? Math.round(
                      deals.reduce((acc, d) => acc + (d.amount || 0), 0) / deals.length / 10000,
                    ).toLocaleString()
                  : 0}
                {t('stats.unit10k')}
              </p>
            </div>
            <div className="text-center border-l border-slate-100 hidden sm:block">
              <p className="text-[11px] text-slate-500 uppercase font-bold tracking-wide mb-1">
                {t('pipeline.conversionRate')}
              </p>
              <p className="text-lg font-bold text-slate-900">
                {deals.length > 0 ? Math.round((dealsByStage.won / deals.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* AI 코치 추천 */}
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
            <span className="text-6xl">🤖</span>
          </div>
          <h3 className="font-semibold text-lg flex items-center gap-2 z-10">
            <span className="text-xl">✨</span> {t('aiCoach.title')}
          </h3>
          <div className="flex flex-col gap-4 z-10 flex-1">
            {insights.length > 0 ? (
              insights.slice(0, 2).map((insight) => (
                <div
                  key={insight.title}
                  className="p-4 bg-white/90 backdrop-blur-sm rounded-lg border border-emerald-100 shadow-sm transition-all hover:border-emerald-200"
                >
                  <p className="text-[10px] font-bold text-emerald-600 mb-1.5 uppercase tracking-wider">
                    {insight.type}
                  </p>
                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {insight.message}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic p-4 text-center">
                {t('aiCoach.noData')}
              </p>
            )}
          </div>
          <Link
            href={`/ko/ws/${slug}/ai-coach`}
            className="mt-auto inline-flex h-11 items-center justify-center w-full bg-emerald-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-emerald-700 transition-all active:scale-[0.98]"
          >
            {t('aiCoach.viewReport')}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 미확인 넛지 */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
          <div className="border-b border-border p-6 bg-muted/20">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>🔔</span> {t('nudges.title')}
            </h3>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-4">
            {activeNudges && activeNudges.length > 0 ? (
              activeNudges.map((nudge) => (
                <div
                  key={nudge.id}
                  className="p-4 rounded-2xl border border-warning/20 bg-warning/5 flex flex-col gap-2 hover:border-warning/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-warning-foreground">{nudge.title}</span>
                    <span className="text-[10px] bg-warning/20 text-warning-foreground px-2 py-0.5 rounded-full uppercase font-black">
                      {nudge.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed italic border-l-2 border-warning/30 pl-3 py-1">
                    "{nudge.message}"
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground font-medium">
                      {t('nudges.target')}{' '}
                      <span className="font-bold text-foreground">
                        {nudge.customers?.name || nudge.projects?.name || t('nudges.other')}
                      </span>
                    </span>
                    <Link
                      href={
                        nudge.customer_id
                          ? `/ko/ws/${slug}/customers/${nudge.customer_id}`
                          : `/ko/ws/${slug}/projects/${nudge.project_id}`
                      }
                      className="inline-flex items-center justify-center text-xs font-bold bg-warning text-white px-4 h-9 rounded-lg hover:brightness-110 transition-all shadow-sm active:scale-95"
                    >
                      {t('nudges.action')}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/10 text-4xl mb-4 grayscale opacity-50">
                  🏝️
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {t('nudges.allProcessed')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
          <div className="border-b border-border p-6 bg-muted/20 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>📅</span> {t('recentActivity.title')}
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
                <Link
                  href={`/ko/ws/${slug}/dashboard?activities=all`}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    activeFilter === 'all'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tActivities('filterAll')}
                </Link>
                <Link
                  href={`/ko/ws/${slug}/dashboard?activities=mine`}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                    activeFilter === 'mine'
                      ? 'bg-white text-emerald-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tActivities('filterMine')}
                </Link>
              </div>
              <Link
                href={`/ko/ws/${slug}/dashboard`}
                className="text-xs text-primary hover:underline font-bold"
              >
                {t('recentActivity.record')}
              </Link>
            </div>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-1 overflow-y-auto">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 items-center py-3.5 px-3 border-b border-border/30 last:border-0 hover:bg-muted/40 rounded-2xl transition-all group active:scale-[0.98]"
                >
                  <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                    {activity.type === 'call'
                      ? '📞'
                      : activity.type === 'email'
                        ? '📧'
                        : activity.type === 'meeting'
                          ? '🤝'
                          : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold truncate text-foreground">{activity.title}</p>
                      <span className="text-[10px] text-muted-foreground font-black whitespace-nowrap ml-2">
                        {new Date(activity.created_at).toLocaleDateString('ko-KR', {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                      {activity.customers?.name ||
                        activity.projects?.name ||
                        t('recentActivity.noDetail')}{' '}
                      <span className="opacity-30 mx-1">•</span>{' '}
                      <span className="text-emerald-600/70">
                        {activity.user_profiles?.display_name || 'Anonymous'}
                      </span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-4xl mb-4 grayscale opacity-30">
                  ✍️
                </div>
                <p className="text-sm font-bold text-muted-foreground">
                  {t('recentActivity.empty')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: { title: string; value: string | number; icon: string; trend: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all group active:scale-[0.98]">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      </div>
      <div>
        <div className="text-3xl font-bold text-slate-900 tabular-nums tracking-tight">
          {value}
        </div>
        <p className="text-[11px] font-bold text-emerald-600 mt-1.5 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {trend}
        </p>
      </div>
    </div>
  );
}

function Bar({
  label,
  count,
  max,
  color,
}: { label: string; count: number; max: number; color: string }) {
  const height = (count / max) * 100;
  return (
    <div className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
      <div className="text-[11px] font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white px-2 py-0.5 rounded shadow-sm">
        {count}
      </div>
      <div
        className={`w-full max-w-[44px] rounded-t-md transition-all duration-700 ease-in-out cursor-pointer ${color} hover:brightness-95`}
        style={{ height: `${Math.max(height, 8)}%` }}
      />
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );
}
