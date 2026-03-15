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
    <div className="flex flex-col gap-8 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            {t('list.title')}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects && projects.length > 0 ? (
          projects.map((project) => (
            <Link
              href={`/ko/ws/${slug}/projects/${project.id}`}
              key={project.id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5 hover:translate-y-[-4px] active:scale-[0.98] h-72 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform select-none pointer-events-none">
                <span className="text-7xl">📁</span>
              </div>

              <div className="z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                    ${
                      project.status === 'planning'
                        ? 'bg-indigo-50 text-indigo-700'
                        : project.status === 'in_progress'
                          ? 'bg-emerald-50 text-emerald-700'
                          : project.status === 'completed'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700'
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 break-all">
                    {project.name}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3">
                    {project.description || t('list.noDescription')}
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-5 border-t border-slate-100 flex items-center justify-between z-10">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-md bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-400 font-bold">
                    {project.name[0]}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
                  {t('list.viewProject')}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6 grayscale opacity-40">
              📂
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t('empty.title')}</h3>
            <p className="mt-2 text-slate-500 max-w-sm font-medium text-sm">
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
