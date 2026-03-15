import { createClient } from '@/lib/supabase/server';
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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 사이드바 */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center px-6">
          <Link
            href={`/ko/ws/${slug}/dashboard`}
            className="flex items-center gap-3 font-semibold group"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm group-hover:bg-emerald-700 transition-colors duration-200">
              {workspace.name[0]}
            </div>
            <span className="truncate text-base tracking-tight text-slate-900">{workspace.name}</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <SidebarLink href={`/ko/ws/${slug}/dashboard`} label={t('dashboard')} emoji="🏠" />
          <SidebarLink href={`/ko/ws/${slug}/customers`} label={t('customers')} emoji="👥" />
          <SidebarLink href={`/ko/ws/${slug}/projects`} label={t('projects')} emoji="📁" />
          <SidebarLink href={`/ko/ws/${slug}/pipeline`} label={t('pipeline')} emoji="📊" />
          <SidebarLink href={`/ko/ws/${slug}/ai-coach`} label={t('aiCoach')} emoji="🤖" />
          <SidebarLink href={`/ko/ws/${slug}/requests`} label={t('requests')} emoji="💡" />
        </nav>

        <div className="p-4 border-t border-slate-100 flex flex-col gap-1">
          <SidebarLink href={`/ko/ws/${slug}/settings`} label={t('settings')} emoji="⚙️" />

          <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center gap-3">
            <div className="h-8 w-8 bg-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-700 text-xs">
              {profile?.display_name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-xs font-bold truncate text-slate-900 leading-none mb-1">{profile?.display_name || tc('user')}</p>
              <p className="text-[10px] text-slate-500 truncate font-semibold uppercase tracking-wider">
                {role}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5 hover:bg-white rounded-md"
              >
                <span className="text-sm">🚪</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 구역 */}
      <div className="flex flex-1 flex-col pl-64">
        {/* 상단바 */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold capitalize">{workspace.name}</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {workspace.plan.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/ko/workspace-select"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              {t('switchWorkspace')}
            </Link>
          </div>
        </header>

        {/* 메인 뷰 */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ href, label, emoji }: { href: string; label: string; emoji: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
    >
      <span className="text-base grayscale group-hover:grayscale-0">{emoji}</span>
      {label}
    </Link>
  );
}
