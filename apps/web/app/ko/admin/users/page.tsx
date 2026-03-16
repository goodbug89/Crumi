import { createAdminClient } from '@/lib/admin/supabase-admin';

export default async function AdminUsersPage() {
  const db = createAdminClient();

  const [{ data: users }, { count: totalUsers }, { count: superAdmins }] = await Promise.all([
    db
      .from('user_profiles')
      .select('id, display_name, email, created_at, is_super_admin')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('user_profiles').select('*', { count: 'exact', head: true }),
    db.from('user_profiles').select('*', { count: 'exact', head: true }).eq('is_super_admin', true),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">사용자</h2>
          <p className="text-[12px] text-muted-foreground">
            전체 {totalUsers ?? 0}명 · Super Admin {superAdmins ?? 0}명
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                사용자
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                이메일
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                권한
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                가입일
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(users ?? []).map((u) => {
              const name = u.display_name || u.email?.split('@')[0] || '(미설정)';
              return (
                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">{name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email ?? '-'}</td>
                  <td className="px-4 py-2.5">
                    {u.is_super_admin ? (
                      <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                        Super Admin
                      </span>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">일반</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[12px] text-muted-foreground">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
