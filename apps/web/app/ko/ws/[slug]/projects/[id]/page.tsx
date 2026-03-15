import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
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

  // 프로젝트 정보 조회
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single();

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-bold">프로젝트를 찾을 수 없습니다.</h2>
        <Link href={`/ko/ws/${slug}/projects`} className="mt-4 text-primary hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const statusLabel = 
    project.status === 'in_progress' ? '진행중' :
    project.status === 'planning' ? '기획중' :
    project.status === 'completed' ? '완료' : '보류';

  const statusColor = 
    project.status === 'in_progress' ? 'bg-primary/10 text-primary' :
    project.status === 'planning' ? 'bg-secondary/10 text-secondary' :
    project.status === 'completed' ? 'bg-success/10 text-success' : 
    'bg-muted text-muted-foreground';

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* 뒤로가기 및 타이틀 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/ko/ws/${slug}/projects`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted"
          >
            ←
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {project.name}
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${statusColor}`}>
                  {statusLabel}
                </span>
              </h2>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="h-9 px-4 rounded-lg border border-border bg-surface text-sm font-medium transition-colors hover:bg-muted">
            수정
          </button>
          <button className="h-9 px-4 rounded-lg bg-danger/10 text-danger text-sm font-medium transition-colors hover:bg-danger/20">
            삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 기본 정보 패널 */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-semibold text-lg border-b border-border pb-3 mb-4">프로젝트 정보</h3>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">생성일</span>
                <span className="font-medium">{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-muted-foreground">상세 설명</span>
                <p className="whitespace-pre-wrap leading-relaxed text-foreground bg-muted/30 p-3 rounded-lg">
                  {project.description || '작성된 설명이 없습니다.'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="font-semibold text-lg">관계자 (Customers)</h3>
              <button className="text-xs font-medium text-primary hover:underline">+ 연결</button>
            </div>
            <div className="text-center text-muted-foreground text-sm py-4">
              연결된 고객이 없습니다.
            </div>
          </div>
        </div>

        {/* 오른쪽: 연관 데이터 (거래 진행상태, 활동내역) placeholder */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="border-b border-border p-5 bg-muted/30 flex justify-between items-center">
              <h3 className="font-semibold text-lg">연결된 파이프라인 (거래)</h3>
              <button className="text-sm font-medium text-primary hover:underline">+ 생성</button>
            </div>
            <div className="p-8 text-center text-muted-foreground text-sm">
              <div className="text-3xl mb-2">📊</div>
              연결된 거래가 없습니다.
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden flex-1">
            <div className="border-b border-border p-5 bg-muted/30">
              <h3 className="font-semibold text-lg">프로젝트 활동/메모</h3>
            </div>
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col gap-2 items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl">
                📝
              </div>
              프로젝트와 관련된 회의록이나 작업 내역을 남겨보세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
