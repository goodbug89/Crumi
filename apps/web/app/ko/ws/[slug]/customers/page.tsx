import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CustomersPage({
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

  // 워크스페이스 정보 조회 (slug로 ID 가져오기)
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!workspace) {
    redirect('/ko/workspace-select');
  }

  // 고객 목록 조회
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">고객 관리</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            등록된 고객 연락처와 정보를 관리합니다.
          </p>
        </div>
        <Link
          href={`/ko/ws/${slug}/customers/new`}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          + 고객 추가
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        {customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-muted/30 uppercase border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-medium">이름</th>
                  <th className="px-5 py-3 font-medium">회사/소속</th>
                  <th className="px-5 py-3 font-medium">연락처</th>
                  <th className="px-5 py-3 font-medium">이메일</th>
                  <th className="px-5 py-3 font-medium">상태</th>
                  <th className="px-5 py-3 font-medium text-right">등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-5 py-4 font-medium">
                      <Link href={`/ko/ws/${slug}/customers/${customer.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                          {customer.name.charAt(0)}
                        </div>
                        {customer.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {customer.company_name || '-'}
                      {customer.position && <span className="text-xs bg-muted px-1.5 py-0.5 rounded ml-2">{customer.position}</span>}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {customer.email || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-medium 
                        ${customer.status === 'active' ? 'bg-success/10 text-success' : 
                          customer.status === 'inactive' ? 'bg-muted text-muted-foreground' : 'bg-warning/10 text-warning'}`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right text-muted-foreground text-xs">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl">👥</div>
            <h3 className="mt-4 text-lg font-semibold text-foreground">등록된 고객이 없습니다.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              첫 고객을 추가하고 연락처와 관련된 거래, 프로젝트를 하나의 공간에서 관리하세요.
            </p>
            <Link
              href={`/ko/ws/${slug}/customers/new`}
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 font-semibold text-foreground shadow-sm transition-all hover:bg-muted active:scale-[0.98]"
            >
              고객 추가하기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
