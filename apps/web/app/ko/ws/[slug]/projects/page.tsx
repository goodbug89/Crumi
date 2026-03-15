import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ProjectsPage({
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

  // 프로젝트 목록 조회
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">프로젝트 관리</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            고객과 연계된 프로젝트를 생성하고 관리합니다.
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/projects/new`}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          + 프로젝트 생성
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {projects.map((project) => (
              <Link 
                href={`/ko/ws/${slug}/projects/${project.id}`} 
                key={project.id}
                className="group flex flex-col justify-between rounded-xl border border-border bg-background p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md h-40"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium 
                      ${project.status === 'planning' ? 'bg-secondary/10 text-secondary' : 
                        project.status === 'in_progress' ? 'bg-primary/10 text-primary' : 
                        project.status === 'completed' ? 'bg-success/10 text-success' : 
                        'bg-muted text-muted-foreground'}`}
                    >
                      {project.status === 'in_progress' ? '진행중' :
                       project.status === 'planning' ? '기획중' :
                       project.status === 'completed' ? '완료' : '보류'}
                    </span>
                    <span className="text-muted-foreground text-xs">{new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {project.description || '프로젝트 설명이 없습니다.'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl">📁</div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">진행 중인 프로젝트가 없습니다.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              고객 문제 해결을 위한 새로운 프로젝트를 시동해보세요!
            </p>
            <Link
              href={`/ko/ws/${slug}/projects/new`}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 font-semibold text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
            >
              프로젝트 생성하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
