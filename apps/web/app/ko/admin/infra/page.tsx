import { createAdminClient } from '@/lib/admin/supabase-admin';
import { getRecentDeployments } from '@/lib/admin/vercel';
import { AlertCircle, CheckCircle, Clock, GitBranch, Loader, XCircle } from 'lucide-react';

function DeployStateIcon({ state }: { state: string }) {
  if (state === 'READY')
    return <CheckCircle className="h-3.5 w-3.5 text-success" strokeWidth={2} />;
  if (state === 'ERROR') return <XCircle className="h-3.5 w-3.5 text-danger" strokeWidth={2} />;
  if (state === 'BUILDING')
    return <Loader className="h-3.5 w-3.5 text-warning animate-spin" strokeWidth={2} />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />;
}

function DeployStateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    READY: 'bg-success/10 text-success',
    ERROR: 'bg-danger/10 text-danger',
    BUILDING: 'bg-warning/10 text-warning',
    CANCELED: 'bg-muted text-muted-foreground',
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${styles[state] ?? 'bg-muted text-muted-foreground'}`}
    >
      {state}
    </span>
  );
}

export default async function AdminInfraPage() {
  const db = createAdminClient();

  const [deployments, { data: emailLogs }] = await Promise.all([
    getRecentDeployments(),
    db
      .from('payment_notifications')
      .select('sent_at, type')
      .order('sent_at', { ascending: false })
      .limit(200),
  ]);

  // 이메일 월별 집계
  const emailByMonth: Record<string, number> = {};
  for (const log of emailLogs ?? []) {
    if (!log.sent_at) continue;
    const month = log.sent_at.slice(0, 7); // "2026-03"
    emailByMonth[month] = (emailByMonth[month] ?? 0) + 1;
  }
  const emailMonths = Object.entries(emailByMonth)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6);
  const maxEmail = Math.max(...emailMonths.map(([, v]) => v), 1);

  const hasVercelToken =
    !!process.env.VERCEL_API_TOKEN && process.env.VERCEL_API_TOKEN !== 'your_vercel_token_here';

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">인프라 현황</h2>
        <p className="text-[12px] text-muted-foreground">Vercel · Resend · Supabase</p>
      </div>

      {/* Vercel 배포 현황 */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h3 className="text-[13px] font-semibold text-foreground">Vercel 배포 현황</h3>
          {!hasVercelToken && (
            <div className="flex items-center gap-1.5 text-[11px] text-warning">
              <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
              VERCEL_API_TOKEN 미설정
            </div>
          )}
        </div>

        {deployments.length === 0 ? (
          <div className="px-4 py-8 text-center text-[12px] text-muted-foreground">
            {hasVercelToken
              ? '배포 내역이 없습니다.'
              : '.env.local에 VERCEL_API_TOKEN을 설정하면 배포 현황이 표시됩니다.'}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {deployments.map((d) => (
              <div
                key={d.uid}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors"
              >
                <DeployStateIcon state={d.state} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {d.meta?.githubCommitMessage?.split('\n')[0] ?? d.name}
                    </p>
                    <DeployStateBadge state={d.state} />
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {d.meta?.githubCommitRef && (
                      <>
                        <GitBranch className="h-3 w-3" strokeWidth={1.75} />
                        <span>{d.meta.githubCommitRef}</span>
                        <span>·</span>
                      </>
                    )}
                    <span>
                      {new Date(d.createdAt).toLocaleString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
                {d.url && d.state === 'READY' && (
                  <a
                    href={`https://${d.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-[11px] text-primary hover:underline"
                  >
                    열기 →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 이메일 사용량 */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-foreground">이메일 발송 현황 (월별)</h3>
        {emailMonths.length === 0 ? (
          <p className="text-[12px] text-muted-foreground">발송 기록이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {emailMonths.map(([month, count]) => (
              <div key={month} className="flex items-center gap-3">
                <div className="w-16 shrink-0 text-right text-[12px] text-muted-foreground">
                  {month}
                </div>
                <div className="h-4 flex-1 overflow-hidden rounded-sm bg-muted">
                  <div
                    className="h-full rounded-sm bg-accent"
                    style={{ width: `${(count / maxEmail) * 100}%` }}
                  />
                </div>
                <div className="w-8 shrink-0 text-right text-[12px] font-semibold tabular-nums">
                  {count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supabase 연결 정보 */}
      <div className="rounded-lg border border-border bg-surface p-4">
        <h3 className="mb-3 text-[13px] font-semibold text-foreground">Supabase 프로젝트</h3>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { label: 'Project Ref', value: process.env.SUPABASE_PROJECT_REF ?? '-' },
            { label: 'Region', value: 'ap-northeast-2 (서울)' },
            {
              label: 'URL',
              value: `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '-').replace('https://', '').split('.')[0]}...`,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-md bg-muted/40 p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-0.5 truncate text-[12px] font-medium text-foreground font-mono">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
