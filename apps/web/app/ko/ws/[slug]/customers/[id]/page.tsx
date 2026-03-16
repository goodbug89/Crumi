import ActivityTimeline from '@/components/activities/ActivityTimeline';
import CustomerActions from '@/components/customers/CustomerActions';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Calendar, ChevronRight, FileText, Mail, Phone } from 'lucide-react';
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
    <div className="flex flex-col gap-5 max-w-6xl mx-auto pb-10 animate-fade-in-up">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/ko/ws/${slug}/customers`}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-muted transition-colors active:scale-90"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-white text-sm font-bold">
              {customer.name.charAt(0)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-foreground">{customer.name}</h2>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm uppercase tracking-wide ${
                    customer.status === 'active'
                      ? 'bg-success/10 text-success'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground">
                {customer.company_name}
                {customer.position && <span className="mx-1.5 opacity-40">|</span>}
                {customer.position}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CustomerActions slug={slug} customerId={id} customerName={customer.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Sidebar: Contact & Info */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-4">
            <h3 className="font-semibold text-[13px] text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
              {t('profile')}
            </h3>
            <div className="flex flex-col gap-3">
              <InfoItem label={t('email')} value={customer.email || tCommon('none')} icon="email" />
              <InfoItem
                label={t('phone')}
                value={customer.phone || tCommon('none')}
                icon="phone"
                isMono
              />
              <InfoItem
                label={t('createdAt')}
                value={new Date(customer.created_at).toLocaleDateString('ko-KR')}
                icon="calendar"
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 flex flex-col gap-3">
            <h3 className="font-semibold text-[13px] text-foreground">{t('systemNotes')}</h3>
            <p className="text-[13px] whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {customer.notes || t('emptyNotes')}
            </p>
            <button
              type="button"
              className="text-[12px] font-medium text-primary hover:underline w-fit"
            >
              {t('editNotes')}
            </button>
          </div>
        </div>

        {/* Right Content: Connected Data & Timeline */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Projects & Deals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
              <div className="border-b border-border px-4 py-2.5 bg-muted/20 flex justify-between items-center">
                <h3 className="font-semibold text-[13px] text-foreground">{t('projects')}</h3>
                <Link
                  href={`/ko/ws/${slug}/projects/new`}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {t('connect')}
                </Link>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {projectRelations && projectRelations.length > 0 ? (
                  projectRelations.map((pj) => {
                    const proj = Array.isArray(pj.projects) ? pj.projects[0] : pj.projects;
                    if (!proj) return null;
                    return (
                      <Link
                        key={proj.id}
                        href={`/ko/ws/${slug}/projects/${proj.id}`}
                        className="group flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex flex-col min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">
                            {proj.name}
                          </p>
                          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                            {proj.status}
                          </p>
                        </div>
                        <ChevronRight
                          className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0"
                          strokeWidth={1.75}
                        />
                      </Link>
                    );
                  })
                ) : (
                  <div className="py-8 text-center text-muted-foreground/60 text-[12px]">
                    {t('noProjects')}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-surface overflow-hidden flex flex-col">
              <div className="border-b border-border px-4 py-2.5 bg-muted/20 flex justify-between items-center">
                <h3 className="font-semibold text-[13px] text-foreground">{t('liveDeals')}</h3>
                <Link
                  href={`/ko/ws/${slug}/pipeline/new?customer_id=${id}`}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {t('newDeal')}
                </Link>
              </div>
              <div className="p-2 flex flex-col gap-1">
                {deals && deals.length > 0 ? (
                  deals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/ko/ws/${slug}/pipeline`}
                      className="group flex flex-col gap-1.5 px-3 py-2.5 rounded-md hover:bg-secondary/5 transition-colors border border-transparent hover:border-secondary/20"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p className="text-[13px] font-medium text-foreground line-clamp-1">
                          {deal.title}
                        </p>
                        <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-sm uppercase font-medium shrink-0">
                          {deal.stage}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] font-semibold text-secondary tabular-nums">
                          ₩ {deal.amount?.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {deal.probability}% {t('win')}
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="py-8 text-center text-muted-foreground/60 text-[12px]">
                    {t('noDeals')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-lg border border-border bg-surface p-4">
            <h3 className="font-semibold text-[13px] text-foreground mb-4">
              {t('activityStream')}
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
}: { label: string; value: string; icon: 'email' | 'phone' | 'calendar'; isMono?: boolean }) {
  const IconComponent = icon === 'email' ? Mail : icon === 'phone' ? Phone : Calendar;
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 uppercase tracking-wide">
        <IconComponent className="h-3 w-3" strokeWidth={1.75} />
        <span>{label}</span>
      </div>
      <span
        className={`text-[13px] font-medium text-foreground ${isMono ? 'font-mono tracking-tight' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}
