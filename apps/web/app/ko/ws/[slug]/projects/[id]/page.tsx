import ActivityTimeline from '@/components/activities/ActivityTimeline';
import ConnectCustomerButton from '@/components/projects/ConnectCustomerButton';
import ProjectActions from '@/components/projects/ProjectActions';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
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

  // 프로젝트 정보 및 거래 정보 조회
  const [{ data: project }, { data: deals }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, project_customers(customer_id, role, customers(*))')
      .eq('id', id)
      .eq('workspace_id', workspace.id)
      .single(),
    supabase
      .from('deals')
      .select('*')
      .eq('project_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  if (!project) {
    redirect(`/ko/ws/${slug}/projects`);
  }

  const connectedCustomers = project.project_customers || [];
  const dealList = deals || [];

  const statusMap: Record<string, { label: string; color: string; icon: string }> = {
    planning: { label: t('status.planning'), color: 'bg-secondary/10 text-secondary', icon: '📝' },
    in_progress: { label: t('status.inProgress'), color: 'bg-primary/10 text-primary', icon: '⚡' },
    completed: { label: t('status.completed'), color: 'bg-success/10 text-success', icon: '✅' },
    on_hold: { label: t('status.onHold'), color: 'bg-muted text-muted-foreground', icon: '⏸️' },
  };

  const currentStatus = statusMap[project.status] || statusMap.planning;

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto pb-20 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link
            href={`/ko/ws/${slug}/projects`}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface text-muted-foreground hover:bg-muted transition-all active:scale-90"
          >
            ←
          </Link>
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-primary text-white text-2xl font-black shadow-xl shadow-primary/20">
              {currentStatus.icon}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black tracking-tight text-foreground line-clamp-1">
                  {project.name}
                </h2>
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${currentStatus.color}`}
                >
                  {currentStatus.label}
                </span>
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1 truncate">
                {new Date(project.created_at).toLocaleDateString('ko-KR')} {t('detail.created')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ProjectActions slug={slug} projectId={id} projectName={project.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 flex flex-col gap-8">
          {/* Details Card */}
          <div className="rounded-[40px] border border-border bg-surface p-8 shadow-sm flex flex-col gap-8">
            <h3 className="font-black text-xl flex items-center gap-2">
              <span>📋</span> {t('detail.details')}
            </h3>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                  {t('detail.description')}
                </span>
                <p className="text-sm font-medium leading-relaxed text-foreground bg-muted/30 p-5 rounded-[24px] border border-border/50">
                  {project.description || t('detail.noDescription')}
                </p>
              </div>
            </div>
          </div>

          {/* Stakeholders Card */}
          <div className="rounded-[40px] border border-border bg-surface p-8 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-xl">{t('detail.stakeholders')}</h3>
              <ConnectCustomerButton
                slug={slug}
                projectId={id}
                workspaceId={workspace.id}
                alreadyConnectedIds={connectedCustomers.map(
                  (c: { customer_id: string }) => c.customer_id,
                )}
              />
            </div>
            {connectedCustomers.map(
              (pc: { customer_id: string; role: string; customers: { name: string } }) => (
                <Link
                  key={pc.customer_id}
                  href={`/ko/ws/${slug}/customers/${pc.customer_id}`}
                  className="group flex items-center justify-between p-3 rounded-[24px] hover:bg-muted/50 transition-all border border-transparent hover:border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-sm font-black text-secondary group-hover:scale-110 transition-transform">
                      {pc.customers?.name?.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-black text-foreground">{pc.customers?.name}</p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">
                        {pc.role}
                      </p>
                    </div>
                  </div>
                  <span className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </Link>
              ),
            )}
            {connectedCustomers.length === 0 && (
              <div className="py-8 text-center text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest">
                {t('detail.noStakeholders')}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* Associated Deals */}
          <div className="rounded-[40px] border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
            <div className="border-b border-border p-7 bg-muted/20 flex justify-between items-center">
              <h3 className="font-black text-xl">{t('detail.projectPipeline')}</h3>
              <Link
                href={`/ko/ws/${slug}/pipeline/new?project_id=${id}`}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                {t('detail.addDeal')}
              </Link>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {dealList.map((deal) => (
                <Link
                  key={deal.id}
                  href={`/ko/ws/${slug}/pipeline`}
                  className="group flex flex-col gap-3 p-6 rounded-[32px] hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-black text-foreground break-all">{deal.title}</p>
                    <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-black">
                      {deal.stage}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-1">
                    <span className="text-lg font-black text-primary">
                      ₩ {deal.amount?.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1.5 font-bold text-[10px] text-muted-foreground">
                      <div className="w-10 h-1 bg-muted rounded-full">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                      <span>{deal.probability}%</span>
                    </div>
                  </div>
                </Link>
              ))}
              {dealList.length === 0 && (
                <div className="col-span-full py-16 text-center text-muted-foreground/40 text-[10px] font-black uppercase tracking-widest">
                  {t('detail.noDeals')}
                </div>
              )}
            </div>
          </div>

          {/* Big Timeline */}
          <div className="rounded-[40px] border border-border bg-surface p-8 shadow-sm">
            <h3 className="font-black text-xl mb-8 flex items-center gap-2">
              <span>⚡</span> {t('detail.projectActivity')}
            </h3>
            <ActivityTimeline workspaceId={workspace.id} projectId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
