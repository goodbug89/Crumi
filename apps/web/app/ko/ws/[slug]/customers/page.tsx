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
    <div className="flex flex-col gap-8 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('list.title')}</h2>
          <p className="text-slate-500 font-medium text-sm">
            {t('list.subtitle', { count: customers?.length || 0 })}
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/customers/new`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-6 font-bold text-sm text-white shadow-sm transition-all hover:bg-emerald-700 hover:translate-y-[-2px] active:scale-[0.98]"
        >
          {t('list.addNew')}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {customers && customers.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-slate-500 bg-slate-50/50 uppercase font-bold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">{t('list.columns.nameTitle')}</th>
                    <th className="px-6 py-4">{t('list.columns.company')}</th>
                    <th className="px-6 py-4">{t('list.columns.communication')}</th>
                    <th className="px-6 py-4">{t('list.columns.status')}</th>
                    <th className="px-6 py-4 text-right">{t('list.columns.lastUpdate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/ko/ws/${slug}/customers/${customer.id}`}
                          className="flex items-center gap-4"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-base group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                            {customer.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors truncate">
                              {customer.name}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400 truncate mt-0.5">
                              {customer.position || t('list.noPosition')}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-700 font-semibold text-sm">
                          {customer.company_name || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                            {customer.email || 'N/A'}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                            {customer.phone || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                          ${
                            customer.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : customer.status === 'inactive'
                                ? 'bg-slate-100 text-slate-500'
                                : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[11px] text-slate-400">
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
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6 grayscale opacity-40">
              🏝️
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t('empty.title')}</h3>
            <p className="mt-2 text-slate-500 max-w-sm font-medium text-sm">
              {t('empty.description')}
            </p>
            <Link
              href={`/ko/ws/${slug}/customers/new`}
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
