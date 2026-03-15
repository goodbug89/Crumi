import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  const t = await getTranslations('workspaceSelect');
  const tc = await getTranslations('common');

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
      const ws = m.workspaces as unknown as {
        id: string;
        name: string;
        slug: string;
        logo_url: string | null;
        plan: string;
      };
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
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] p-6 animate-fade-in">
      <div className="w-full max-w-xl">
        {/* 헤더 */}
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[32px] bg-primary text-white text-4xl shadow-2xl shadow-primary/20 animate-float">
            💎
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              {t('welcomeBack')}
            </h1>
            <p className="text-base font-bold text-muted-foreground uppercase tracking-widest text-[10px]">
              {t('selectWorkspace')}
            </p>
          </div>
        </div>

        {/* 워크스페이스 목록 */}
        <div className="grid grid-cols-1 gap-4">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/ko/ws/${ws.slug}/dashboard`}
              className="group flex items-center gap-6 rounded-[32px] border border-border bg-white p-6 shadow-sm transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 hover-lift active-tap"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted font-black text-2xl text-primary transition-transform group-hover:scale-110">
                {ws.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-foreground truncate">{ws.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {ws.role}
                  </span>
                  <span className="text-muted-foreground/30 text-xs">•</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">
                    {ws.plan} {t('plan')}
                  </span>
                </div>
              </div>
              <span className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-white transition-all transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}

          {workspaces.length === 0 && (
            <div className="flex flex-col items-center gap-6 rounded-[40px] border border-dashed border-border bg-surface p-12 text-center">
              <div className="text-5xl grayscale opacity-50">🏝️</div>
              <div className="flex flex-col gap-1">
                <p className="text-lg font-bold text-foreground">{t('noWorkspaces.title')}</p>
                <p className="text-sm text-muted-foreground">{t('noWorkspaces.description')}</p>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/ko/workspace-create"
            className="h-14 flex-1 flex items-center justify-center rounded-2xl bg-primary px-8 font-black text-white shadow-xl shadow-primary/10 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {t('createNew')}
          </Link>
          <Link
            href="/ko/join"
            className="h-14 flex-1 flex items-center justify-center rounded-2xl border-2 border-border bg-white px-8 font-extrabold text-foreground hover:bg-muted active:scale-95 transition-all"
          >
            {t('joinWithCode')}
          </Link>
        </div>

        <p className="mt-12 text-center text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">
          {tc('poweredBy')}
        </p>
      </div>
    </div>
  );
}
