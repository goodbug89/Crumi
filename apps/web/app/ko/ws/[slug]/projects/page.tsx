import { createClient } from '@/lib/supabase/server';
import { ChevronRight, FolderOpen } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ProjectsPage({
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

  const t = await getTranslations('projects');

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

  // 프로젝트 목록 조회
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-foreground">{t('list.title')}</h2>
          <p className="text-muted-foreground text-[13px]">
            {t('list.subtitle', { count: projects?.length || 0 })}
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/projects/new`}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98]"
        >
          {t('list.addNew')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <Link
              href={`/ko/ws/${slug}/projects/${project.id}`}
              key={project.id}
              className="group flex flex-col justify-between rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/30 hover:bg-muted/20 active:scale-[0.99]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider
                    ${
                      project.status === 'planning'
                        ? 'bg-indigo-50 text-indigo-700'
                        : project.status === 'in_progress'
                          ? 'bg-success/10 text-success'
                          : project.status === 'completed'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {project.status === 'in_progress'
                      ? t('status.inProgress')
                      : project.status === 'planning'
                        ? t('status.planning')
                        : project.status === 'completed'
                          ? t('status.completed')
                          : t('status.onHold')}
                  </span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-[13px] text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                    {project.description || t('list.noDescription')}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-sm bg-muted border border-surface flex items-center justify-center text-[9px] text-muted-foreground font-medium">
                    {project.name[0]}
                  </div>
                </div>
                <span className="text-[12px] font-medium text-primary flex items-center gap-0.5 group-hover:gap-1 transition-all">
                  {t('list.viewProject')}
                  <ChevronRight className="h-3 w-3" strokeWidth={2} />
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border bg-muted/20">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <FolderOpen className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{t('empty.title')}</h3>
            <p className="mt-1 text-muted-foreground max-w-sm text-[13px]">
              {t('empty.description')}
            </p>
            <Link
              href={`/ko/ws/${slug}/projects/new`}
              className="mt-6 inline-flex h-9 items-center justify-center px-6 bg-primary text-white rounded-md text-[13px] font-medium shadow-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              {t('empty.action')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
