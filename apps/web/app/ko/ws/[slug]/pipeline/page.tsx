import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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
      emoji: '🔍',
      color: 'bg-muted-foreground/20',
      textColor: 'text-muted-foreground',
    },
    {
      id: 'contact',
      name: t('stages.contact'),
      emoji: '📧',
      color: 'bg-secondary/40',
      textColor: 'text-secondary-foreground',
    },
    {
      id: 'negotiation',
      name: t('stages.negotiation'),
      emoji: '🤝',
      color: 'bg-primary/60',
      textColor: 'text-white',
    },
    { id: 'won', name: t('stages.won'), emoji: '🎉', color: 'bg-success', textColor: 'text-white' },
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
    <div className="flex flex-col gap-8 h-full animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {t('subtitle', { count: deals?.length || 0 })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/ko/ws/${slug}/pipeline/new`}
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
          >
            {t('addNew')}
          </Link>
        </div>
      </div>

      {deals?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-border border-dashed border-2 rounded-[40px] bg-surface/30 backdrop-blur-sm">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-5xl mb-6">
            📊
          </div>
          <h3 className="text-2xl font-black text-foreground">{t('empty.title')}</h3>
          <p className="mt-2 text-muted-foreground max-w-sm font-medium leading-relaxed">
            {t('empty.description')}
          </p>
          <Link
            href={`/ko/ws/${slug}/pipeline/new`}
            className="mt-8 h-12 px-8 bg-foreground text-background rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all"
          >
            {t('empty.action')}
          </Link>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 items-start snap-x scrollbar-hide">
          {pipelineData.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col gap-5 min-w-[320px] max-w-[320px] rounded-[32px] bg-muted/30 p-5 border border-border/50 snap-center hover:bg-muted/50 transition-colors"
            >
              {/* 스테이지 헤더 */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-8 h-8 rounded-xl ${stage.color} flex items-center justify-center text-sm shadow-sm`}
                    >
                      {stage.emoji}
                    </span>
                    <h3 className="font-black text-foreground tracking-tight">{stage.name}</h3>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground/60 tracking-widest bg-background/50 px-2 py-1 rounded-full border border-border/40">
                    {stage.deals.length}
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase text-primary/80 tracking-widest ml-10">
                  ₩ {stage.totalAmount.toLocaleString()}
                </p>
              </div>

              {/* 거래 카드 리스트 */}
              <div className="flex flex-col gap-4 min-h-[400px]">
                {stage.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/ko/ws/${slug}/pipeline/${deal.id}/edit`}
                    className="group flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5 shadow-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all hover-lift active-tap"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-foreground leading-snug break-words pr-2">
                        {deal.title}
                      </h4>
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${stage.color} shadow-sm group-hover:scale-150 transition-transform`}
                      />
                    </div>

                    {(deal.customers || deal.projects) && (
                      <div className="flex flex-col gap-1.5">
                        {deal.customers && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                            <span className="opacity-70">👤</span>{' '}
                            <span className="truncate">
                              {(deal.customers as { name: string }).name}
                            </span>
                          </div>
                        )}
                        {deal.projects && (
                          <div className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                            <span className="opacity-70">📂</span>{' '}
                            <span className="truncate">
                              {(deal.projects as { name: string }).name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-1">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-0.5">
                          {t('deal.amount')}
                        </p>
                        <p className="font-black text-primary text-base">
                          ₩ {deal.amount ? deal.amount.toLocaleString() : '0'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-0.5">
                          {t('deal.winRate')}
                        </p>
                        <div className="flex items-center gap-1.5 font-black text-[11px]">
                          <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-secondary"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                          <span>{deal.probability}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground/60 border-t border-border/50 pt-3 mt-1">
                      <span className="uppercase tracking-tighter">
                        {t('deal.created')} {new Date(deal.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="group-hover:text-primary transition-colors">
                        {t('deal.detail')}
                      </span>
                    </div>
                  </Link>
                ))}

                {stage.deals.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-transparent py-20 text-center px-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                      {t('emptyStage')}
                    </p>
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
