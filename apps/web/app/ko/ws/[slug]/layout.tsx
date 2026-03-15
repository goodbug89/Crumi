import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import HelpGuide from '@/components/help/HelpGuide';

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
      <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-border bg-surface shadow-2xl transition-all">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link
            href={`/ko/ws/${slug}/dashboard`}
            className="flex items-center gap-3 font-black group"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 group-hover:scale-110 transition-transform">
              {workspace.name[0]}
            </div>
            <span className="truncate text-lg tracking-tighter text-slate-800 font-black">{workspace.name}</span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <SidebarLink href={`/ko/ws/${slug}/dashboard`} label={t('dashboard')} emoji="🏠" />
          <SidebarLink href={`/ko/ws/${slug}/customers`} label={t('customers')} emoji="👥" />
          <SidebarLink href={`/ko/ws/${slug}/projects`} label={t('projects')} emoji="📁" />
          <SidebarLink href={`/ko/ws/${slug}/pipeline`} label={t('pipeline')} emoji="📊" />
          <SidebarLink href={`/ko/ws/${slug}/ai-coach`} label={t('aiCoach')} emoji="🤖" />
          <SidebarLink href={`/ko/ws/${slug}/requests`} label={t('requests')} emoji="💡" />
        </nav>

        <div className="p-4 border-t border-border flex flex-col gap-3">
          <SidebarLink href={`/ko/ws/${slug}/settings`} label={t('settings')} emoji="⚙️" />

          <div className="mt-2 p-3 bg-muted/40 rounded-3xl flex items-center gap-3 group relative overflow-hidden">
            <div className="h-9 w-9 bg-secondary rounded-2xl flex items-center justify-center font-bold text-white shadow-md">
              {(profile?.display_name || user.user_metadata?.display_name || tc('user')).charAt(0)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <p className="text-sm font-bold truncate">
                {profile?.display_name || user.user_metadata?.display_name || tc('user')}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-medium uppercase tracking-tighter">
                {role}
              </p>
            </div>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-muted-foreground hover:text-danger hover:scale-110 transition-all p-1"
              >
                <span className="text-xl">🚪</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 구역 */}
      <div className="flex flex-1 flex-col pl-64">
        {/* 상단바 */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface/80 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">{workspace.name}</h1>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100 uppercase tracking-widest leading-none">
                {workspace.plan}
              </span>
              <HelpGuide />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/ko/workspace-select"
              className="text-sm font-medium text-muted-foreground hover:text-slate-900 transition-colors"
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
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <span className="text-lg">{emoji}</span>
      {label}
    </Link>
  );
}
