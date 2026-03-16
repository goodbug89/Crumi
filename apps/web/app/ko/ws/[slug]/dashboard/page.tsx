import { analyzeSalesData } from '@/lib/ai/coach';
import { createClient } from '@/lib/supabase/server';
import { Activity, AlertCircle, Bot, Mail, MessageSquare, Phone, TrendingUp } from 'lucide-react';
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
      .limit(5),
    supabase
      .from('activities')
      .select('*, customers(name), projects(name), user_profiles(display_name)')
      .eq('workspace_id', workspace.id)
      .match(activeFilter === 'mine' ? { user_id: user.id } : {})
      .order('created_at', { ascending: false })
      .limit(6),
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

  const totalAmount = deals.reduce((acc, d) => acc + (d.amount || 0), 0);
  const avgWinRate =
    deals.length > 0
      ? Math.round(deals.reduce((acc, d) => acc + (d.probability || 0), 0) / deals.length)
      : 0;
  const conversionRate = deals.length > 0 ? Math.round((dealsByStage.won / deals.length) * 100) : 0;
  const avgDealSize = deals.length > 0 ? Math.round(totalAmount / deals.length / 10000) : 0;

  // SVG 수평 바 차트 데이터
  const stageData = [
    { name: t('pipeline.stages.lead'), count: dealsByStage.lead, color: '#94a3b8' },
    { name: t('pipeline.stages.contact'), count: dealsByStage.contact, color: '#5eead4' },
    { name: t('pipeline.stages.negotiation'), count: dealsByStage.negotiation, color: '#059669' },
    { name: t('pipeline.stages.won'), count: dealsByStage.won, color: '#10b981' },
  ];
  const maxCount = Math.max(...stageData.map((s) => s.count), 1);

  const kpiCards = [
    {
      label: t('stats.activeCustomers'),
      value: customerCount ?? 0,
      trend: t('stats.trendCustomers'),
    },
    {
      label: t('stats.activeProjects'),
      value: projectCount ?? 0,
      trend: t('stats.trendProjects'),
    },
    {
      label: t('stats.activeDeals'),
      value: dealCount ?? 0,
      trend: t('stats.trendDeals'),
    },
    {
      label: t('stats.expectedRevenue'),
      value: `₩${(totalAmount / 10000).toFixed(1)}${t('stats.unit10k')}`,
      trend: t('stats.trendRevenue'),
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-full animate-fade-in-up">
      {/* Row 1 — 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <NudgeScanner slug={slug} />
      </div>

      {/* Row 2 — KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border bg-surface p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {card.label}
            </p>
            <p className="mt-1.5 text-2xl font-bold tabular-nums text-foreground">{card.value}</p>
            <p className="mt-1 text-[11px] text-primary">{card.trend}</p>
          </div>
        ))}
      </div>

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Pipeline Overview — SVG 수평 바 차트 */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-[14px] w-[14px] text-primary" strokeWidth={2} />
              <h3 className="text-[13px] font-semibold text-foreground">{t('pipeline.title')}</h3>
            </div>
            <Link
              href={`/ko/ws/${slug}/pipeline`}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              {t('pipeline.viewDetail')}
            </Link>
          </div>

          {/* SVG 수평 바 차트 */}
          <svg
            width="100%"
            height="120"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            role="img"
          >
            <title>Pipeline overview chart</title>
            {stageData.map((stage, idx) => {
              const barWidth = Math.max((stage.count / maxCount) * 290, 2);
              const y = idx * 28 + 6;
              return (
                <g key={stage.name}>
                  {/* 배경 바 */}
                  <rect x="72" y={y + 1} width="290" height="14" rx="3" fill="#f1f3f5" />
                  {/* 값 바 */}
                  <rect x="72" y={y + 1} width={barWidth} height="14" rx="3" fill={stage.color} />
                  {/* 라벨 */}
                  <text x="0" y={y + 12} fontSize="11" fill="#64748b" fontFamily="inherit">
                    {stage.name}
                  </text>
                  {/* 수치 */}
                  <text
                    x="392"
                    y={y + 12}
                    fontSize="11"
                    fill="#020617"
                    textAnchor="end"
                    fontFamily="inherit"
                    fontWeight="600"
                  >
                    {stage.count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Deal Summary */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="mb-3 flex items-center gap-1.5">
            <Bot className="h-[14px] w-[14px] text-accent" strokeWidth={2} />
            <h3 className="text-[13px] font-semibold text-foreground">Deal Summary</h3>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {t('pipeline.totalAmount')}
              </p>
              <p className="text-lg font-bold tabular-nums text-foreground">
                ₩{totalAmount.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
              <div className="rounded-md bg-muted p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('pipeline.avgWinRate')}
                </p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">
                  {avgWinRate}%
                </p>
              </div>
              <div className="rounded-md bg-muted p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('pipeline.conversionRate')}
                </p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">
                  {conversionRate}%
                </p>
              </div>
              <div className="col-span-2 rounded-md bg-muted p-2.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t('pipeline.avgDealSize')}
                </p>
                <p className="mt-0.5 text-base font-bold tabular-nums text-foreground">
                  ₩{avgDealSize.toLocaleString()}
                  {t('stats.unit10k')}
                </p>
              </div>
            </div>

            {insights.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-accent">
                  AI Insight
                </p>
                <p className="text-[12px] leading-snug text-foreground">{insights[0].message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 4 — Bottom */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Active Nudges */}
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-[14px] w-[14px] text-warning" strokeWidth={2} />
              <h3 className="text-[13px] font-semibold text-foreground">{t('nudges.title')}</h3>
              {activeNudges && activeNudges.length > 0 && (
                <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                  {activeNudges.length}
                </span>
              )}
            </div>
          </div>

          <div className="divide-y divide-border">
            {activeNudges && activeNudges.length > 0 ? (
              activeNudges.map((nudge) => (
                <div
                  key={nudge.id}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{
                          background:
                            nudge.urgency === 'critical'
                              ? '#ef4444'
                              : nudge.urgency === 'urgent'
                                ? '#f59e0b'
                                : '#94a3b8',
                        }}
                      />
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {nudge.title}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {nudge.customers?.name || nudge.projects?.name || t('nudges.other')}
                    </p>
                  </div>
                  <Link
                    href={
                      nudge.customer_id
                        ? `/ko/ws/${slug}/customers/${nudge.customer_id}`
                        : `/ko/ws/${slug}/projects/${nudge.project_id}`
                    }
                    className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    {t('nudges.action')}
                  </Link>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-[12px] text-muted-foreground">{t('nudges.allProcessed')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <Activity className="h-[14px] w-[14px] text-primary" strokeWidth={2} />
              <h3 className="text-[13px] font-semibold text-foreground">
                {t('recentActivity.title')}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded border border-border overflow-hidden">
                <Link
                  href={`/ko/ws/${slug}/dashboard?activities=all`}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tActivities('filterAll')}
                </Link>
                <Link
                  href={`/ko/ws/${slug}/dashboard?activities=mine`}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    activeFilter === 'mine'
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {tActivities('filterMine')}
                </Link>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {recentActivities && recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const ActivityIcon =
                  activity.type === 'call'
                    ? Phone
                    : activity.type === 'email'
                      ? Mail
                      : activity.type === 'meeting'
                        ? MessageSquare
                        : Activity;
                return (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <ActivityIcon
                        className="h-[13px] w-[13px] text-muted-foreground"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {activity.customers?.name ||
                          activity.projects?.name ||
                          t('recentActivity.noDetail')}
                        <span className="mx-1 opacity-40">·</span>
                        <span className="text-primary/70">
                          {activity.user_profiles?.display_name || 'Anonymous'}
                        </span>
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {new Date(activity.created_at).toLocaleDateString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-[12px] text-muted-foreground">{t('recentActivity.empty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
