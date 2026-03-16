import { createAdminClient } from '@/lib/admin/supabase-admin';
import { createClient } from '@/lib/supabase/server';
import { BarChart2, Building2, LayoutDashboard, LogOut, Server, Users } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/ko/login');

  // Service Role로 is_super_admin 검증
  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('display_name, is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) redirect('/ko/workspace-select');

  const displayName = profile.display_name || user.email?.split('@')[0] || 'Admin';
  const initial = displayName.charAt(0).toUpperCase();

  const navItems = [
    { href: '/ko/admin/overview', label: '대시보드', icon: LayoutDashboard },
    { href: '/ko/admin/workspaces', label: '워크스페이스', icon: Building2 },
    { href: '/ko/admin/users', label: '사용자', icon: Users },
    { href: '/ko/admin/infra', label: '인프라', icon: Server },
  ];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-[220px] flex-col border-r border-border bg-surface">
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-white">
            A
          </div>
          <span className="text-[13px] font-semibold text-foreground">Crumi Admin</span>
        </div>

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

        <div className="border-t border-border px-3 pb-3 pt-3">
          <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-[11px] font-bold text-accent">
              {initial}
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="truncate text-xs font-medium text-foreground">{displayName}</p>
              <p className="text-[11px] uppercase tracking-wide text-accent">super admin</p>
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
          <div className="mt-2 px-2.5">
            <Link
              href="/ko/workspace-select"
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              ← 워크스페이스로 이동
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-[220px]">
        <header className="sticky top-0 z-10 flex h-11 items-center justify-between border-b border-border bg-white/90 px-5 backdrop-blur">
          <div className="flex items-center gap-1.5">
            <BarChart2 className="h-4 w-4 text-accent" strokeWidth={1.75} />
            <span className="text-[13px] font-semibold text-foreground">Super Admin Console</span>
          </div>
          <span className="rounded border border-accent/20 bg-accent/5 px-2 py-0.5 text-[11px] font-medium text-accent">
            Internal
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-5">{children}</main>
      </div>
    </div>
  );
}
