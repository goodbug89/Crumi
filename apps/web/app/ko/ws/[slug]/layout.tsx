import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  // 워크스페이스 권한 검증
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug, plan, workspace_members!inner(role, status)')
    .eq('slug', slug)
    .eq('workspace_members.user_id', user.id)
    .eq('workspace_members.status', 'active')
    .single();

  if (!workspace) {
    redirect('/ko/workspace-select');
  }

  const role = workspace.workspace_members[0].role;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-surface transition-all">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link href={`/ko/ws/${slug}/dashboard`} className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {workspace.name[0]}
            </div>
            <span className="truncate">{workspace.name}</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <SidebarLink href={`/ko/ws/${slug}/dashboard`} label="대시보드" emoji="🏠" />
          <SidebarLink href={`/ko/ws/${slug}/customers`} label="고객 관리" emoji="👥" />
          <SidebarLink href={`/ko/ws/${slug}/projects`} label="프로젝트" emoji="📁" />
          <SidebarLink href={`/ko/ws/${slug}/pipeline`} label="파이프라인" emoji="📊" />
          <SidebarLink href={`/ko/ws/${slug}/requests`} label="기능 요청" emoji="💡" />
        </nav>

        <div className="border-t border-border p-3">
          <SidebarLink href={`/ko/ws/${slug}/settings`} label="설정" emoji="⚙️" />
          <div className="mt-2 text-xs text-muted-foreground px-3">
            Role: {role}
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 구역 */}
      <div className="flex flex-1 flex-col pl-64">
        {/* 상단바 */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold capitalize">
              {workspace.name} 
            </h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {workspace.plan.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/ko/workspace-select" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              워크스페이스 변경
            </Link>
          </div>
        </header>

        {/* 메인 뷰 */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <span className="text-lg">{emoji}</span>
      {label}
    </Link>
  );
}
