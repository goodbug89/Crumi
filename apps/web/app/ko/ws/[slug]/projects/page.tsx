import { createClient } from '@/lib/supabase/server';
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
    <div className="flex flex-col gap-10 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t('list.title')}
          </h2>
          <p className="text-muted-foreground font-medium">
            {t('list.subtitle', { count: projects?.length || 0 })}
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/projects/new`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-6 font-bold text-sm text-white shadow-sm transition-all hover:bg-emerald-700 hover:translate-y-[-2px] active:scale-[0.98]"
        >
          {t('list.addNew')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <Link
              href={`/ko/ws/${slug}/projects/${project.id}`}
              key={project.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5 hover:translate-y-[-4px] active:scale-[0.98] h-72 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
                <span className="text-7xl">📁</span>
              </div>

              <div className="z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tighter
                    ${
                      project.status === 'planning'
                        ? 'bg-secondary/10 text-secondary'
                        : project.status === 'in_progress'
                          ? 'bg-primary/10 text-primary'
                          : project.status === 'completed'
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
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
                  <span className="text-[10px] font-black text-muted-foreground uppercase opacity-40">
                    {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors line-clamp-1 break-all">
                    {project.name}
                  </h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-3">
                    {project.description || t('list.noDescription')}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-border/50 flex items-center justify-between z-10">
                <div className="flex -space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-muted border-2 border-surface flex items-center justify-center text-[10px]">
                    👤
                  </div>
                </div>
                <span className="text-xs font-black text-primary group-hover:translate-x-1 transition-transform">
                  {t('list.viewProject')}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-32 text-center rounded-[40px] border-2 border-dashed border-border/60 bg-surface/30 backdrop-blur-sm">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-5xl mb-6">
              📂
            </div>
            <h3 className="text-2xl font-black text-foreground">{t('empty.title')}</h3>
            <p className="mt-2 text-muted-foreground max-w-sm font-medium">
              {t('empty.description')}
            </p>
            <Link
              href={`/ko/ws/${slug}/projects/new`}
              className="mt-10 inline-flex h-11 items-center justify-center px-10 bg-emerald-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-emerald-700 hover:translate-y-[-2px] transition-all active:scale-[0.98]"
            >
              {t('empty.action')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
