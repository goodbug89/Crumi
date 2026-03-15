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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 animate-fade-in">
      <div className="w-full max-w-lg">
        {/* 헤더 */}
        <div className="mb-10 flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-900 text-white text-2xl shadow-xl shadow-slate-900/10">
            C
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t('welcomeBack')}
            </h1>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest text-[11px]">
              {t('selectWorkspace')}
            </p>
          </div>
        </div>

        {/* 워크스페이스 목록 */}
        <div className="grid grid-cols-1 gap-3">
          {workspaces.map((ws) => (
            <Link
              key={ws.id}
              href={`/ko/ws/${ws.slug}/dashboard`}
              className="group flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-300 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 font-bold text-lg text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                {ws.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">{ws.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {ws.role}
                  </span>
                  <span className="text-slate-200 text-xs">•</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    {ws.plan} {t('plan')}
                  </span>
                </div>
              </div>
              <span className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                →
              </span>
            </Link>
          ))}

          {workspaces.length === 0 && (
            <div className="flex flex-col items-center gap-6 rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="text-4xl grayscale opacity-30">🏝️</div>
              <div className="flex flex-col gap-1">
                <p className="text-base font-bold text-slate-900">{t('noWorkspaces.title')}</p>
                <p className="text-xs font-medium text-slate-500">{t('noWorkspaces.description')}</p>
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/ko/workspace-create"
            className="h-12 flex-1 flex items-center justify-center rounded-lg bg-emerald-600 px-8 font-bold text-white shadow-lg shadow-emerald-600/10 hover:bg-emerald-700 active:scale-[0.98] transition-all text-sm"
          >
            {t('createNew')}
          </Link>
          <Link
            href="/ko/join"
            className="h-12 flex-1 flex items-center justify-center rounded-lg border border-slate-200 bg-white px-8 font-bold text-slate-900 hover:bg-slate-50 active:scale-[0.98] transition-all text-sm"
          >
            {t('joinWithCode')}
          </Link>
        </div>

        <p className="mt-12 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">
          {tc('poweredBy')}
        </p>
      </div>
    </div>
  );
}
