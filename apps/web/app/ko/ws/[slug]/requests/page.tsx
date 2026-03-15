import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function FeatureRequestsPage({
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

  // 기능 요청 목록 조회
  const { data: requests } = await supabase
    .from('feature_requests')
    .select(`
      *,
      users:user_id (display_name)
    `)
    .eq('workspace_id', workspace.id)
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">기능 요청 및 피드백</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            제품 개선을 위한 아이디어를 제안하고 투표할 수 있습니다.
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/requests/new`}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          + 아이디어 제안
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {requests && requests.length > 0 ? (
          requests.map((req) => (
            <div key={req.id} className="flex gap-4 p-5 rounded-xl border border-border bg-surface shadow-sm transition-all hover:border-primary/50">
              {/* 투표 컨테이너 */}
              <div className="flex flex-col gap-1 items-center justify-center p-3 rounded-lg bg-muted/30 border border-border w-16 h-16 shrink-0 cursor-pointer hover:bg-muted/50 transition-colors">
                <span className="text-lg">▲</span>
                <span className="font-bold">{req.vote_count}</span>
              </div>
              
              <div className="flex-1 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-lg">{req.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium
                    ${req.status === 'done' ? 'bg-success/10 text-success' : 
                      req.status === 'in_progress' ? 'bg-primary/10 text-primary' : 
                      req.status === 'reviewing' ? 'bg-secondary/10 text-secondary' :
                      'bg-muted text-muted-foreground'}
                  `}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap line-clamp-2">
                  {req.description}
                </p>
                
                <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                  <span>작성자: {(req.users as any)?.display_name || '알 수 없음'}</span>
                  <span>{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border-border border-dashed border-2 rounded-2xl bg-surface/50 mt-4">
            <div className="text-4xl text-muted-foreground">💡</div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">아직 등록된 의견이 없어요.</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              우리가 어떤 기능을 먼저 만들기를 원하시나요? 제일 먼저 제안을 올려주세요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
