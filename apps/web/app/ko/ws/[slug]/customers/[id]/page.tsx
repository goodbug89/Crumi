import ActivityTimeline from '@/components/activities/ActivityTimeline';
import CustomerActions from '@/components/customers/CustomerActions';
import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function CustomerDetailPage({
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

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

  // 고객 정보 조회
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single();

  if (!customer) {
    redirect(`/ko/ws/${slug}/customers`);
  }

  const t = await getTranslations('customers.detail');
  const tCommon = await getTranslations('common');

  // 연관 프로젝트 및 거래 정보 동시 조회
  const [{ data: projectRelations }, { data: deals }] = await Promise.all([
    supabase
      .from('project_customers')
      .select('projects(id, name, status, start_date, end_date)')
      .eq('customer_id', id),
    supabase
      .from('deals')
      .select('*')
      .eq('customer_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-10 max-w-6xl mx-auto pb-20 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link
            href={`/ko/ws/${slug}/customers`}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface text-muted-foreground hover:bg-muted transition-all active:scale-90"
          >
            ←
          </Link>
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[24px] bg-secondary text-white text-2xl font-black shadow-xl shadow-secondary/20">
              {customer.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {customer.name}
                </h2>
                <span
                  className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                    customer.status === 'active'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <p className="text-base font-bold text-muted-foreground mt-1">
                {customer.company_name}{' '}
                {customer.position && <span className="mx-2 opacity-30">|</span>}{' '}
                {customer.position}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CustomerActions slug={slug} customerId={id} customerName={customer.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Sidebar: Contact & Info */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="rounded-[40px] border border-border bg-surface p-8 shadow-sm flex flex-col gap-8">
            <h3 className="font-black text-xl flex items-center gap-2">
              <span>🗂️</span> {t('profile')}
            </h3>
            <div className="flex flex-col gap-6">
              <InfoItem label={t('email')} value={customer.email || tCommon('none')} icon="📧" />
              <InfoItem
                label={t('phone')}
                value={customer.phone || tCommon('none')}
                icon="📱"
                isMono
              />
              <InfoItem
                label={t('createdAt')}
                value={new Date(customer.created_at).toLocaleDateString('ko-KR')}
                icon="📅"
              />
            </div>
          </div>

          <div className="rounded-[40px] border border-border bg-muted/20 p-8 shadow-sm flex flex-col gap-4">
            <h3 className="font-black text-lg">{t('systemNotes')}</h3>
            <p className="text-sm font-medium whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {customer.notes || t('emptyNotes')}
            </p>
            <button
              type="button"
              className="mt-4 text-xs font-black text-primary hover:underline w-fit"
            >
              {t('editNotes')}
            </button>
          </div>
        </div>

        {/* Right Content: Connected Data & Timeline */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          {/* Projects & Deals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-[40px] border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-border p-6 bg-muted/20 flex justify-between items-center">
                <h3 className="font-black text-lg">{t('projects')}</h3>
                <Link
                  href={`/ko/ws/${slug}/projects/new`}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {t('connect')}
                </Link>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {projectRelations && projectRelations.length > 0 ? (
                  projectRelations.map((pj) => {
                    const proj = Array.isArray(pj.projects) ? pj.projects[0] : pj.projects;
                    if (!proj) return null;
                    return (
                      <Link
                        key={proj.id}
                        href={`/ko/ws/${slug}/projects/${proj.id}`}
                        className="group flex items-center justify-between p-4 rounded-3xl hover:bg-muted/50 transition-all border border-transparent hover:border-border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl group-hover:scale-125 transition-transform">
                            📁
                          </span>
                          <div className="flex flex-col">
                            <p className="text-sm font-bold text-foreground truncate max-w-[150px]">
                              {proj.name}
                            </p>
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                              {proj.status}
                            </p>
                          </div>
                        </div>
                        <span className="text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity">
                          →
                        </span>
                      </Link>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-muted-foreground/60 text-xs font-bold uppercase tracking-widest">
                    {t('noProjects')}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[40px] border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
              <div className="border-b border-border p-6 bg-muted/20 flex justify-between items-center">
                <h3 className="font-black text-lg">{t('liveDeals')}</h3>
                <Link
                  href={`/ko/ws/${slug}/pipeline/new?customer_id=${id}`}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  {t('newDeal')}
                </Link>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {deals && deals.length > 0 ? (
                  deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/ko/ws/${slug}/pipeline`}
                      className="group flex flex-col gap-2 p-5 rounded-3xl hover:bg-secondary/5 transition-all border border-transparent hover:border-secondary/20"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-foreground line-clamp-1">
                          {deal.title}
                        </p>
                        <span className="text-[8px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full uppercase font-black">
                          {deal.stage}
                        </span>
                      </div>
                      <div className="flex justify-between items-end mt-1">
                        <span className="text-base font-black text-secondary">
                          ₩ {deal.amount?.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {deal.probability}% {t('win')}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground/60 text-xs font-bold uppercase tracking-widest">
                    {t('noDeals')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-[40px] border border-border bg-surface p-8 shadow-sm">
            <h3 className="font-black text-xl mb-8 flex items-center gap-2">
              <span>🕒</span> {t('activityStream')}
            </h3>
            <ActivityTimeline workspaceId={workspace.id} customerId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
  isMono = false,
}: { label: string; value: string; icon: string; isMono?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
        <span>{icon}</span> <span>{label}</span>
      </div>
      <span
        className={`text-base font-bold text-foreground ${isMono ? 'font-mono tracking-tighter' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
