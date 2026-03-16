import { createAdminClient } from '@/lib/admin/supabase-admin';
import { Building2, TrendingUp, Users, Zap } from 'lucide-react';

export default async function AdminOverviewPage() {
  const db = createAdminClient();

  const [
    { count: totalWorkspaces },
    { count: totalUsers },
    { count: activeMembers },
    { data: planDist },
  ] = await Promise.all([
    db.from('workspaces').select('*', { count: 'exact', head: true }).is('deleted_at', null),
    db.from('user_profiles').select('*', { count: 'exact', head: true }),
    db.from('workspace_members').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    db.from('workspaces').select('plan').is('deleted_at', null),
  ]);

  const planCounts: Record<string, number> = {};
  for (const w of planDist ?? []) {
    const p = w.plan ?? 'free';
    planCounts[p] = (planCounts[p] ?? 0) + 1;
  }

  const kpis = [
    {
      label: '전체 워크스페이스',
      value: totalWorkspaces ?? 0,
      icon: Building2,
      color: 'text-primary',
    },
    { label: '전체 사용자', value: totalUsers ?? 0, icon: Users, color: 'text-accent' },
    { label: '활성 멤버십', value: activeMembers ?? 0, icon: Zap, color: 'text-success' },
    {
      label: 'Pro 워크스페이스',
      value: planCounts.pro ?? 0,
      icon: TrendingUp,
      color: 'text-warning',
    },
  ];

  const planRows = Object.entries(planCounts).sort((a, b) => b[1] - a[1]);
  const maxPlan = Math.max(...planRows.map(([, v]) => v), 1);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Overview</h2>
        <p className="text-[12px] text-muted-foreground">전체 서비스 현황</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </p>
                <Icon className={`h-4 w-4 ${k.color}`} strokeWidth={1.75} />
              </div>
              <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* 플랜 분포 차트 */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-foreground">플랜 분포</h3>
        <div className="space-y-2">
          {planRows.map(([plan, count]) => (
            <div key={plan} className="flex items-center gap-3">
              <div className="w-16 shrink-0 text-right text-[12px] capitalize text-muted-foreground">
                {plan}
              </div>
              <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                <div
                  className="h-full rounded-sm bg-primary"
                  style={{ width: `${(count / maxPlan) * 100}%` }}
                />
              </div>
              <div className="w-6 shrink-0 text-right text-[12px] font-semibold tabular-nums">
                {count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
