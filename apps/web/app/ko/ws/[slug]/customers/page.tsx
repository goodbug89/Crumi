import { createClient } from '@/lib/supabase/server';
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
    <div className="flex flex-col gap-10 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            {t('list.title')}
          </h2>
          <p className="text-muted-foreground font-medium">
            {t('list.subtitle', { count: customers?.length || 0 })}
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/customers/new`}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
        >
          {t('list.addNew')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {customers && customers.length > 0 ? (
          <div className="rounded-[32px] border border-border bg-surface shadow-2xl shadow-black/[0.02] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] text-muted-foreground bg-muted/20 uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-8 py-5">{t('list.columns.nameTitle')}</th>
                    <th className="px-8 py-5">{t('list.columns.company')}</th>
                    <th className="px-8 py-5">{t('list.columns.communication')}</th>
                    <th className="px-8 py-5">{t('list.columns.status')}</th>
                    <th className="px-8 py-5 text-right">{t('list.columns.lastUpdate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-muted/30 transition-all group cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <Link
                          href={`/ko/ws/${slug}/customers/${customer.id}`}
                          className="flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-black text-lg shadow-sm border border-secondary/20 group-hover:scale-110 transition-transform">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground text-base group-hover:text-primary transition-colors truncate">
                              {customer.name}
                            </span>
                            <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60 truncate">
                              {customer.position || t('list.noPosition')}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-bold">
                            {customer.company_name || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-[11px] font-bold text-foreground">
                            <span className="opacity-50 text-xs">📧</span> {customer.email || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-bold text-foreground">
                            <span className="opacity-50 text-xs">📱</span> {customer.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tighter
                          ${
                            customer.status === 'active'
                              ? 'bg-success/10 text-success'
                              : customer.status === 'inactive'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-warning/10 text-warning-foreground'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-[10px] text-muted-foreground/60">
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
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-[40px] border-2 border-dashed border-border/60 bg-surface/30 backdrop-blur-sm">
            <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center text-5xl mb-6">
              🏝️
            </div>
            <h3 className="text-2xl font-black text-foreground">{t('empty.title')}</h3>
            <p className="mt-2 text-muted-foreground max-w-sm font-medium">
              {t('empty.description')}
            </p>
            <Link
              href={`/ko/ws/${slug}/customers/new`}
              className="mt-10 h-12 px-10 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.05] transition-all active:scale-95"
            >
              {t('empty.action')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
