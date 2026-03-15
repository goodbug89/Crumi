import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
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
    .order('created_at', { ascending: false });

  // 기본 파이프라인 스테이지 (실제로는 DB의 pipelines 테이블에서 동적으로 가져와야 함)
  const defaultStages = [
    { id: 'lead', name: '리드 (Lead)', color: 'bg-secondary/20 text-secondary' },
    { id: 'contact', name: '접촉 및 제안', color: 'bg-primary/20 text-primary' },
    { id: 'negotiation', name: '협상 중', color: 'bg-warning/20 text-warning-foreground' },
    { id: 'won', name: '계약 수주', color: 'bg-success/20 text-success' },
  ];

  // 스테이지별로 거래 그룹화
  const groupedDeals = defaultStages.map(stage => {
    return {
      ...stage,
      deals: deals?.filter(d => d.stage === stage.id) || [],
    };
  });

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">파이프라인</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            거래(Deal)의 진행 단계를 칸반 보드로 시각화합니다.
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/pipeline/new`}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          + 거래 생성
        </Link>
      </div>

      {groupedDeals.every(group => group.deals.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-border border-dashed border-2 rounded-2xl bg-surface/50 mt-4">
          <div className="text-4xl">📊</div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">진행 중인 거래가 없습니다.</h3>
          <p className="mt-2 text-sm text-muted-foreground w-full max-w-sm">
            파이프라인을 추가하여 고객과의 거래, 계약 수주 등의 영업 진행 상황을 한눈에 파악하세요.
          </p>
          <Link
            href={`/ko/ws/${slug}/pipeline/new`}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 font-semibold text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
          >
            첫 거래 등록하기
          </Link>
        </div>
      )}

      {/* 칸반 보드 영역 */}
      {!groupedDeals.every(group => group.deals.length === 0) && (
        <div className="flex gap-6 overflow-x-auto pb-6 h-full items-start">
          {groupedDeals.map((stage) => (
            <div key={stage.id} className="flex min-w-[280px] sm:min-w-[320px] flex-col gap-4 rounded-xl bg-muted/40 p-4 h-full border border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stage.color.split(' ')[0]}`} />
                  {stage.name}
                </h3>
                <span className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {stage.deals.length}
                </span>
              </div>

              <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
                {stage.deals.map((deal) => (
                  <div key={deal.id} className="group relative flex flex-col gap-3 rounded-xl border border-border bg-background p-4 shadow-sm hover:border-primary/50 transition-colors">
                    <h4 className="font-semibold text-foreground">{deal.title}</h4>
                    
                    {(deal.customers || deal.projects) && (
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {deal.customers && (
                          <div className="flex items-center gap-1">
                            <span>👥</span> {(deal.customers as any).name}
                          </div>
                        )}
                        {deal.projects && (
                          <div className="flex items-center gap-1">
                            <span>📁</span> {(deal.projects as any).name}
                          </div>
                        )}
                      </div>
                    )}

                    {deal.amount !== null && (
                      <div className="mt-1 font-medium text-primary">
                         ₩ {deal.amount.toLocaleString()}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-2 mt-1">
                      <span>승률: {deal.probability}%</span>
                      <span>{new Date(deal.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}

                {stage.deals.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-transparent p-4 text-center py-8 text-muted-foreground text-sm">
                    거래 없음
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
