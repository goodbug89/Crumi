import HelpGuide from '@/components/help/HelpGuide';
import { createClient } from '@/lib/supabase/server';
import {
  Bot,
  FolderOpen,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  const t = await getTranslations('sidebar');
  const tc = await getTranslations('common');

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

  // 사용자 프로필 조회
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, email, avatar_url')
    .eq('id', user.id)
    .single();

  const displayName =
    profile?.display_name ||
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    tc('user');

  const initial = displayName.charAt(0).toUpperCase();
  const workspaceInitial = workspace.name.charAt(0).toUpperCase();

  const navItems = [
    { href: `/ko/ws/${slug}/dashboard`, label: t('dashboard'), icon: LayoutDashboard },
    { href: `/ko/ws/${slug}/customers`, label: t('customers'), icon: Users },
    { href: `/ko/ws/${slug}/projects`, label: t('projects'), icon: FolderOpen },
    { href: `/ko/ws/${slug}/pipeline`, label: t('pipeline'), icon: TrendingUp },
    { href: `/ko/ws/${slug}/ai-coach`, label: t('aiCoach'), icon: Bot },
    { href: `/ko/ws/${slug}/requests`, label: t('requests'), icon: Lightbulb },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 사이드바 */}
      <aside
        className="fixed inset-y-0 left-0 z-20 flex flex-col border-r border-border bg-surface"
        style={{ width: 'var(--sidebar-width)' }}
      >
        {/* 로고 / 워크스페이스 */}
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <Link href={`/ko/ws/${slug}/dashboard`} className="flex items-center gap-2 min-w-0 group">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-white">
              {workspaceInitial}
            </div>
            <span className="truncate text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
              {workspace.name}
            </span>
          </Link>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 space-y-0.5 px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* 하단 설정 + 사용자 영역 */}
        <div className="border-t border-border px-3 pb-3 pt-3 space-y-1">
          <Link
            href={`/ko/ws/${slug}/settings`}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-[15px] w-[15px] shrink-0" strokeWidth={1.75} />
            {t('settings')}
          </Link>

          <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-[11px] font-semibold text-secondary-foreground">
              {initial}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-xs font-medium text-foreground leading-tight">
                {displayName}
              </p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide leading-tight">
                {role}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                title="로그아웃"
                className="flex items-center justify-center rounded p-1 text-muted-foreground hover:bg-muted hover:text-danger transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 구역 */}
      <div className="flex flex-1 flex-col" style={{ paddingLeft: 'var(--sidebar-width)' }}>
        {/* 상단바 */}
        <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-border bg-white/90 px-5 backdrop-blur">
          <div className="flex items-center gap-1.5 text-[13px]">
            <Link
              href="/ko/workspace-select"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {workspace.name}
            </Link>
            <span className="text-border">/</span>
            <span className="font-medium text-foreground">Workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {workspace.plan}
            </span>
            <HelpGuide />
          </div>
        </header>

        {/* 메인 뷰 */}
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
