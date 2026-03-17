import { type AIInsight, analyzeSalesData } from '@/lib/ai/coach';
import { createClient } from '@/lib/supabase/server';
import {
  AlertTriangle,
  BotMessageSquare,
  Brain,
  FolderOpen,
  Lightbulb,
  Send,
  Sparkles,
  TrendingUp,
  User,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

// ─── 유틸 함수 ────────────────────────────────────────────────────────────────

function InsightIcon({ type }: { type: string }) {
  if (type === 'URGENT')
    return <AlertTriangle className="h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />;
  if (type === 'OPPORTUNITY')
    return <TrendingUp className="h-4 w-4 shrink-0 text-success" strokeWidth={1.75} />;
  return <Lightbulb className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.75} />;
}

function insightColors(type: string): string {
  if (type === 'URGENT') return 'border-danger/20 bg-danger/5';
  if (type === 'OPPORTUNITY') return 'border-success/20 bg-success/5';
  return 'border-primary/20 bg-primary/5';
}

function insightTypeLabel(type: string): { text: string; className: string } {
  if (type === 'URGENT') return { text: 'URGENT', className: 'text-danger' };
  if (type === 'OPPORTUNITY') return { text: 'OPPORTUNITY', className: 'text-success' };
  return { text: 'TIP', className: 'text-primary' };
}

function getTargetHref(insight: AIInsight, slug: string): string | null {
  if (insight.targetType === 'customer') return `/ko/ws/${slug}/customers/${insight.targetId}`;
  if (insight.targetType === 'deal') return `/ko/ws/${slug}/pipeline/${insight.targetId}/edit`;
  if (insight.targetType === 'project') return `/ko/ws/${slug}/projects/${insight.targetId}`;
  return null;
}

// ─── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

function InsightCard({ insight, slug }: { insight: AIInsight; slug: string }) {
  const label = insightTypeLabel(insight.type);
  const targetHref = getTargetHref(insight, slug);

  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-2 ${insightColors(insight.type)}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <InsightIcon type={insight.type} />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${label.className}`}>
            {label.text}
          </span>
        </div>
        {targetHref && insight.targetId && (
          <Link
            href={targetHref}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {insight.targetType === 'customer' && <User className="h-3 w-3" strokeWidth={1.75} />}
            {insight.targetType === 'deal' && <TrendingUp className="h-3 w-3" strokeWidth={1.75} />}
            {insight.targetType === 'project' && (
              <FolderOpen className="h-3 w-3" strokeWidth={1.75} />
            )}
            <span>바로가기</span>
          </Link>
        )}
      </div>
      <h4 className="font-semibold text-[13px] text-foreground">{insight.title}</h4>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{insight.message}</p>
    </div>
  );
}

function InsightsSummary({
  urgentCount,
  opportunityCount,
}: { urgentCount: number; opportunityCount: number }) {
  if (urgentCount === 0 && opportunityCount === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      <h3 className="font-semibold text-[13px] text-foreground">인사이트 요약</h3>
      {urgentCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-danger" strokeWidth={1.75} />
            <span className="text-[13px] text-foreground">긴급</span>
          </div>
          <span className="text-[13px] font-semibold text-danger tabular-nums">
            {urgentCount}건
          </span>
        </div>
      )}
      {opportunityCount > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-success" strokeWidth={1.75} />
            <span className="text-[13px] text-foreground">기회</span>
          </div>
          <span className="text-[13px] font-semibold text-success tabular-nums">
            {opportunityCount}건
          </span>
        </div>
      )}
    </div>
  );
}

// ─── 페이지 ───────────────────────────────────────────────────────────────────

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

  if (!user) redirect('/ko/login');

  const t = await getTranslations('aiCoach');

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

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

  const insights: AIInsight[] = analyzeSalesData({
    customers: customers || [],
    deals: deals || [],
    activities: activities || [],
  });

  const dealList = deals || [];
  const winRate =
    dealList.length > 0
      ? Math.round((dealList.filter((d) => d.stage === 'won').length / dealList.length) * 100)
      : 0;
  const avgDealSize =
    dealList.length > 0
      ? Math.round(dealList.reduce((acc, d) => acc + (d.amount || 0), 0) / dealList.length)
      : 0;

  const urgentCount = insights.filter((i) => i.type === 'URGENT').length;
  const opportunityCount = insights.filter((i) => i.type === 'OPPORTUNITY').length;

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up pb-10">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
        <p className="text-muted-foreground text-[13px]">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* 왼쪽: 코치 인터페이스 + 인사이트 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* 코치 인사 카드 */}
          <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <BotMessageSquare className="h-5 w-5 text-primary" strokeWidth={1.75} />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="font-semibold text-[13px] text-foreground">{t('crumiCoach')}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  <p className="text-[11px] font-medium text-success">{t('engineActive')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 border border-border p-3">
              <p className="text-[13px] text-foreground leading-relaxed">
                {t('greeting', {
                  dealCount: dealList.length,
                  customerCount: customers?.length || 0,
                })}{' '}
                {insights.length > 0
                  ? t('hasInsights', { firstInsight: insights[0].title })
                  : t('needMoreData')}
              </p>
            </div>

            <div className="relative">
              <textarea
                placeholder={t('askPlaceholder')}
                className="w-full h-24 bg-muted/20 border border-input rounded-lg p-3 text-[13px] text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all resize-none pr-24"
              />
              <button
                type="button"
                className="absolute bottom-3 right-3 h-8 px-3 bg-primary text-white rounded-md text-[12px] font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                <Send className="h-3 w-3" strokeWidth={1.75} />
                {t('askCoach')}
              </button>
            </div>
          </div>

          {/* 인사이트 섹션 */}
          <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <h3 className="font-semibold text-[13px] text-foreground">{t('insightsScan')}</h3>
              {insights.length > 0 && (
                <span className="ml-auto text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-sm">
                  {insights.length}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <InsightCard key={insight.title} insight={insight} slug={slug} />
                ))
              ) : (
                <div className="py-12 text-center border border-dashed border-border rounded-lg bg-muted/20">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <p className="text-[13px] font-medium text-foreground">{t('noInsights')}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    {t('needMoreData')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: Sales Health 사이드바 */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* 핵심 지표 카드 */}
          <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-4">
            <h3 className="font-semibold text-[13px] text-foreground">{t('salesHealth')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/40 border border-border p-3 flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  {t('globalWinRate')}
                </span>
                <span className="text-2xl font-bold text-foreground tabular-nums">{winRate}%</span>
              </div>
              <div className="rounded-lg bg-muted/40 border border-border p-3 flex flex-col gap-1">
                <span className="text-[11px] text-muted-foreground font-medium">
                  {t('avgDealValue')}
                </span>
                <span className="text-lg font-bold text-foreground tabular-nums truncate">
                  ₩{Math.floor(avgDealSize / 10000)}만
                </span>
              </div>
            </div>
            {(urgentCount > 0 || opportunityCount > 0) && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <p className="text-[12px] text-foreground leading-relaxed">
                  {t('healthComment', { count: opportunityCount })}
                </p>
              </div>
            )}
          </div>

          {/* 인사이트 요약 */}
          <InsightsSummary urgentCount={urgentCount} opportunityCount={opportunityCount} />

          {/* Coach Memory */}
          <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
            <h3 className="font-semibold text-[13px] text-foreground">{t('coachMemory')}</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                {t('analyzedCustomers', { count: customers?.length || 0 })}
              </div>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                {t('analyzedDeals', { count: dealList.length })}
              </div>
              <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                {t('recentActivityScan')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
