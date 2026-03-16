import { createClient } from '@/lib/supabase/server';
import { Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function CustomersPage({
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

  // 워크스페이스 정보 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) {
    redirect('/ko/workspace-select');
  }

  const t = await getTranslations('customers');

  // 고객 목록 조회
  const { data: customers } = await supabase
    .from('customers')
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
            {t('list.subtitle', { count: customers?.length || 0 })}
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/customers/new`}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98]"
        >
          {t('list.addNew')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {customers && customers.length > 0 ? (
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-[11px] text-muted-foreground bg-muted/50 uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5">{t('list.columns.nameTitle')}</th>
                    <th className="px-4 py-2.5">{t('list.columns.company')}</th>
                    <th className="px-4 py-2.5">{t('list.columns.communication')}</th>
                    <th className="px-4 py-2.5">{t('list.columns.status')}</th>
                    <th className="px-4 py-2.5 text-right">{t('list.columns.lastUpdate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/ko/ws/${slug}/customers/${customer.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="w-8 h-8 rounded-md bg-muted text-muted-foreground flex items-center justify-center font-semibold text-[13px] group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-foreground text-[13px] group-hover:text-primary transition-colors truncate">
                              {customer.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate">
                              {customer.position || t('list.noPosition')}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-foreground text-[13px]">
                          {customer.company_name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] text-muted-foreground">
                            {customer.email || 'N/A'}
                          </span>
                          <span className="text-[12px] text-muted-foreground">
                            {customer.phone || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider
                          ${
                            customer.status === 'active'
                              ? 'bg-success/10 text-success'
                              : customer.status === 'inactive'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-warning/10 text-warning'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-[12px] text-muted-foreground tabular-nums">
                        {new Date(customer.updated_at || customer.created_at).toLocaleDateString(
                          'ko-KR',
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border bg-muted/20">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{t('empty.title')}</h3>
            <p className="mt-1 text-muted-foreground max-w-sm text-[13px]">
              {t('empty.description')}
            </p>
            <Link
              href={`/ko/ws/${slug}/customers/new`}
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
