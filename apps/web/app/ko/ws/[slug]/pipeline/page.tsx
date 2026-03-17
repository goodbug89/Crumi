import { createClient } from '@/lib/supabase/server';
import { BarChart2, FolderOpen, User } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

function formatAmountShort(amount: number): string {
  if (amount === 0) return '₩0';
  if (amount >= 100000000) {
    const eok = Math.floor(amount / 100000000);
    const man = Math.floor((amount % 100000000) / 10000);
    return man > 0 ? `₩${eok}억 ${man}만` : `₩${eok}억`;
  }
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    return `₩${man}만`;
  }
  return `₩${amount.toLocaleString()}`;
}

export default async function PipelinePage({
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

  const t = await getTranslations('pipeline');

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

  // 거래(Deal) 목록 조회
  const { data: deals } = await supabase
    .from('deals')
    .select(`
      *,
      customers ( id, name ),
      projects ( id, name )
    `)
    .eq('workspace_id', workspace.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // 기본 파이프라인 스테이지
  const stages = [
    {
      id: 'lead',
      name: t('stages.lead'),
      color: 'bg-muted-foreground/20',
      dotColor: 'bg-slate-400',
      textColor: 'text-muted-foreground',
    },
    {
      id: 'contact',
      name: t('stages.contact'),
      color: 'bg-secondary/40',
      dotColor: 'bg-secondary',
      textColor: 'text-secondary-foreground',
    },
    {
      id: 'negotiation',
      name: t('stages.negotiation'),
      color: 'bg-primary/60',
      dotColor: 'bg-primary',
      textColor: 'text-white',
    },
    {
      id: 'won',
      name: t('stages.won'),
      color: 'bg-success',
      dotColor: 'bg-success',
      textColor: 'text-white',
    },
  ];

  // 스테이지별 데이터 그룹화 및 금액 합계 계산
  const pipelineData = stages.map((stage) => {
    const stageDeals = deals?.filter((d) => d.stage === stage.id) || [];
    const totalAmount = stageDeals.reduce((acc, d) => acc + (d.amount || 0), 0);
    return {
      ...stage,
      deals: stageDeals,
      totalAmount,
    };
  });

  return (
    <div className="flex flex-col gap-4 h-full animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
          <p className="text-muted-foreground text-[13px]">
            {t('subtitle', { count: deals?.length || 0 })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/ko/ws/${slug}/pipeline/new`}
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98]"
          >
            {t('addNew')}
          </Link>
        </div>
      </div>

      {deals?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-border border-dashed border rounded-lg bg-muted/20">
          <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
            <BarChart2 className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-foreground">{t('empty.title')}</h3>
          <p className="mt-1 text-muted-foreground max-w-sm text-[13px] leading-relaxed">
            {t('empty.description')}
          </p>
          <Link
            href={`/ko/ws/${slug}/pipeline/new`}
            className="mt-6 inline-flex h-9 items-center justify-center px-6 bg-primary text-white rounded-md text-[13px] font-medium shadow-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
          >
            {t('empty.action')}
          </Link>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 items-start snap-x scrollbar-hide">
          {pipelineData.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col gap-3 min-w-[280px] max-w-[280px] rounded-lg bg-muted/40 p-3 border border-border snap-center"
            >
              {/* 스테이지 헤더 */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
                  <h3 className="font-medium text-foreground text-[13px]">{stage.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-primary tabular-nums">
                    {formatAmountShort(stage.totalAmount)}
                  </span>
                  <span className="text-[11px] font-medium text-muted-foreground bg-surface px-1.5 py-0.5 rounded-sm border border-border tabular-nums">
                    {stage.deals.length}
                  </span>
                </div>
              </div>

              {/* 거래 카드 리스트 */}
              <div className="flex flex-col gap-2 min-h-[200px]">
                {stage.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/ko/ws/${slug}/pipeline/${deal.id}/edit`}
                    className="group flex flex-col gap-2.5 rounded-md border border-border bg-surface p-3 transition-colors hover:border-primary/30 hover:bg-muted/20 active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-medium text-foreground leading-snug text-[13px] group-hover:text-primary transition-colors line-clamp-2">
                        {deal.title}
                      </h4>
                    </div>

                    {(deal.customers || deal.projects) && (
                      <div className="flex flex-col gap-1">
                        {deal.customers && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <User className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">
                              {(deal.customers as { name: string }).name}
                            </span>
                          </div>
                        )}
                        {deal.projects && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <FolderOpen className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                            <span className="truncate">
                              {(deal.projects as { name: string }).name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <p className="font-semibold text-foreground text-[13px] tabular-nums">
                        {deal.amount ? formatAmountShort(deal.amount) : '₩0'}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-500"
                            style={{ width: `${deal.probability}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {deal.probability}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}

                {stage.deals.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-surface/50 py-10 text-center px-3">
                    <p className="text-[11px] text-muted-foreground/60">{t('emptyStage')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
