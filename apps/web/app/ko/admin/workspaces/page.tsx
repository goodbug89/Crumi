import { createAdminClient } from '@/lib/admin/supabase-admin';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default async function AdminWorkspacesPage() {
  const db = createAdminClient();
  const { data: workspaces } = await db
    .from('admin_workspace_overview')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">워크스페이스</h2>
        <p className="text-[12px] text-muted-foreground">전체 {workspaces?.length ?? 0}개</p>
      </div>

      <div className="rounded-lg border border-border bg-surface overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                워크스페이스
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                플랜
              </th>
              <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                고객
              </th>
              <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                프로젝트
              </th>
              <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                거래
              </th>
              <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                멤버
              </th>
              <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                생성일
              </th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(workspaces ?? []).map((ws) => (
              <tr key={ws.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                      {String(ws.name ?? '?')
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{ws.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                      ws.plan === 'pro'
                        ? 'bg-accent/10 text-accent'
                        : ws.plan === 'business'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {ws.plan ?? 'free'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {ws.customer_count ?? 0}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {ws.project_count ?? 0}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {ws.deal_count ?? 0}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {ws.active_members ?? 0}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-muted-foreground">
                  {ws.created_at ? new Date(ws.created_at).toLocaleDateString('ko-KR') : '-'}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/ko/ws/${ws.slug}/dashboard`}
                    className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                    이동
                  </Link>
                </td>
              </tr>
            ))}
            {(!workspaces || workspaces.length === 0) && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-[12px] text-muted-foreground"
                >
                  워크스페이스가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
