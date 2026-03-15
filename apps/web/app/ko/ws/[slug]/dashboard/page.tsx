import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage({
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
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

  // 통계 데이터 동시 조회
  const [
    { count: customerCount },
    { count: projectCount },
    { count: dealCount },
    { data: activeNudges }
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).eq('status', 'active'),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).eq('status', 'in_progress'),
    supabase.from('deals').select('*', { count: 'exact', head: true }).eq('workspace_id', workspace.id).neq('stage', 'won'),
    // 아직 누군가가 조치하지 않은 넛지 목록 (간소화)
    supabase.from('nudges').select('*').eq('workspace_id', workspace.id).eq('status', 'pending').order('created_at', { ascending: false }).limit(3)
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">대시보드</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {workspace.name}의 오늘 업무 현황을 확인하세요.
          </p>
        </div>
      </div>
      
      {/* 주요 통계 (KPIS) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">활성 고객</h3>
            <span className="text-xl">👥</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{customerCount || 0}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">진행중인 프로젝트</h3>
            <span className="text-xl">📁</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{projectCount || 0}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">활성 거래</h3>
            <span className="text-xl">📊</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{dealCount || 0}</div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight text-muted-foreground">새로운 넛지</h3>
            <span className="text-xl">🔔</span>
          </div>
          <div className="text-2xl font-bold text-foreground">{activeNudges?.length || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 새로운 넛지 목록 (알림 센터 역할) */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border p-5 bg-muted/30">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span>🔔</span> 미확인 넛지
            </h3>
          </div>
          
          <div className="p-5 flex-1 flex flex-col gap-4">
            {activeNudges && activeNudges.length > 0 ? (
              activeNudges.map(nudge => (
                 <div key={nudge.id} className="p-4 rounded-lg border border-warning/20 bg-warning/5 flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-semibold text-warning-foreground">{nudge.title}</span>
                     <span className="text-[10px] bg-warning/10 text-warning px-2 py-0.5 rounded uppercase">{nudge.urgency}</span>
                   </div>
                   <p className="text-sm text-muted-foreground">{nudge.message}</p>
                   <div className="flex justify-end gap-2 mt-2">
                     <button className="text-xs font-medium text-muted-foreground hover:text-foreground">다음에 확인</button>
                     <button className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90">조치하기</button>
                   </div>
                 </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                <div className="text-3xl mb-2 text-muted-foreground opacity-50">✨</div>
                <p className="text-sm text-muted-foreground">새로운 일정이나 알림이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        {/* 빈 공간 (또는 최근 활동 내역) */}
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border p-5 bg-muted/30">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <span>📅</span> 오늘의 할 일
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-center h-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-3xl">
              👍
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">모든 업무 완료!</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              팀에 공유할 활동이나 메모를 남겨주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
