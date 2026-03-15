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
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h2>
          <p className="text-slate-500 text-sm font-medium">
            {t('subtitle', { count: deals?.length || 0 })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/ko/ws/${slug}/pipeline/new`}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-6 font-bold text-white shadow-lg shadow-emerald-600/10 transition-all hover:bg-emerald-700 active:scale-[0.98] text-sm"
          >
            {t('addNew')}
          </Link>
        </div>
      </div>

      {deals?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-slate-200 border-dashed border rounded-xl bg-slate-50/50">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6 grayscale opacity-40">
            📊
          </div>
          <h3 className="text-xl font-bold text-slate-900">{t('empty.title')}</h3>
          <p className="mt-2 text-slate-500 max-w-sm font-medium leading-relaxed text-sm">
            {t('empty.description')}
          </p>
          <Link
            href={`/ko/ws/${slug}/pipeline/new`}
            className="mt-8 h-11 px-8 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            {t('empty.action')}
          </Link>
        </div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-8 items-start snap-x scrollbar-hide">
          {pipelineData.map((stage) => (
            <div
              key={stage.id}
              className="flex flex-col gap-5 min-w-[320px] max-w-[320px] rounded-xl bg-slate-100/50 p-4 border border-slate-200/50 snap-center"
            >
              {/* 스테이지 헤더 */}
              <div className="flex flex-col gap-2.5 px-1 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-8 h-8 rounded-lg ${stage.color} flex items-center justify-center text-sm shadow-sm font-bold`}
                    >
                      {stage.emoji}
                    </span>
                    <h3 className="font-bold text-slate-800 tracking-tight text-sm">{stage.name}</h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {stage.deals.length}
                  </span>
                </div>
                <p className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider ml-10">
                  ₩ {stage.totalAmount.toLocaleString()}
                </p>
              </div>

              {/* 거래 카드 리스트 */}
              <div className="flex flex-col gap-3 min-h-[400px]">
                {stage.deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/ko/ws/${slug}/pipeline/${deal.id}/edit`}
                    className="group flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all active:scale-[0.99]"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-900 leading-snug break-words pr-2 text-sm group-hover:text-emerald-700 transition-colors">
                        {deal.title}
                      </h4>
                      <div
                        className={`h-2 w-2 rounded-full ${stage.color} shrink-0 mt-1 shadow-sm`}
                      />
                    </div>

                    {(deal.customers || deal.projects) && (
                      <div className="flex flex-col gap-2">
                        {deal.customers && (
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                            <span className="opacity-70">👤</span>
                            <span className="truncate">
                              {(deal.customers as { name: string }).name}
                            </span>
                          </div>
                        )}
                        {deal.projects && (
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                            <span className="opacity-70">📂</span>
                            <span className="truncate">
                              {(deal.projects as { name: string }).name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-end justify-between mt-1">
                      <div className="flex flex-col">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {t('deal.amount')}
                        </p>
                        <p className="font-bold text-slate-900 text-base tabular-nums tracking-tight">
                          ₩ {deal.amount ? deal.amount.toLocaleString() : '0'}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {t('deal.winRate')}
                        </p>
                        <div className="flex items-center gap-2 font-bold text-[11px] text-slate-600">
                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-1000"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                          <span className="tabular-nums">{deal.probability}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 border-t border-slate-100 pt-3 mt-1">
                      <span className="uppercase tracking-wide">
                        {t('deal.created')} {new Date(deal.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="group-hover:text-emerald-600 transition-colors font-bold">
                        {t('deal.detail')}
                      </span>
                    </div>
                  </Link>
                ))}

                {stage.deals.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/30 py-20 text-center px-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
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
