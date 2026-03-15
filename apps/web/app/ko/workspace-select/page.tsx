import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  plan: string;
  role: string;
}

export default async function WorkspaceSelectPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  // 사용자가 속한 워크스페이스 목록 조회
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      role,
      status,
      workspaces (
        id, name, slug, logo_url, plan
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active');

  const workspaces: WorkspaceInfo[] = (memberships ?? [])
    .filter((m) => m.workspaces != null)
    .map((m) => {
      const ws = m.workspaces as unknown as { id: string; name: string; slug: string; logo_url: string | null; plan: string };
      return {
        id: m.workspace_id,
        role: m.role,
        name: ws.name,
        slug: ws.slug,
        logo_url: ws.logo_url,
        plan: ws.plan,
      };
    });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20 text-3xl">
            💬
          </div>
          <h1 className="text-2xl font-bold text-foreground">워크스페이스 선택</h1>
          <p className="text-sm text-muted-foreground">참여할 워크스페이스를 선택하세요</p>
        </div>

        {/* 워크스페이스 목록 */}
        {workspaces.length > 0 ? (
          <div className="flex flex-col gap-3">
            {workspaces.map((ws) => (
              <Link
                key={ws.id}
                href={`/ko/ws/${ws.slug}/dashboard`}
                className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                  {ws.name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{ws.name}</h3>
                  <p className="text-sm text-muted-foreground">{ws.role} · {ws.plan}</p>
                </div>
                <span className="text-muted-foreground">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
            <div className="text-4xl">😊</div>
            <p className="text-muted-foreground">
              아직 참여 중인 워크스페이스가 없습니다.
            </p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/ko/workspace-create"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            새 워크스페이스 만들기
          </Link>
          <Link
            href="/ko/join"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-border bg-surface px-6 font-semibold text-foreground transition-all hover:bg-muted"
          >
            초대 코드로 참여
          </Link>
        </div>
      </div>
    </div>
  );
}
