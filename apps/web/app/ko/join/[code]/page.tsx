import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const t = await getTranslations('join.invite');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/ko/login?returnTo=/ko/join/${code}`);
  }

  // 초대 코드 유효성 확인
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name, slug')
    .eq('invite_code', code)
    .single();

  if (!workspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 shadow-xl text-center flex flex-col gap-6">
          <div className="text-6xl">🚫</div>
          <h2 className="text-2xl font-black">{t('invalidCode')}</h2>
          <p className="text-muted-foreground">{t('invalidCodeDescription')}</p>
          <Link
            href="/ko/workspace-select"
            className="py-3.5 bg-primary text-white rounded-2xl font-bold"
          >
            {t('goToWorkspace')}
          </Link>
        </div>
      </div>
    );
  }

  // 이미 멤버인지 확인
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single();

  if (existingMember) {
    redirect(`/ko/ws/${workspace.slug}/dashboard`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full bg-surface border border-border rounded-3xl p-8 shadow-xl flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-3xl">
            🚀
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black">{t('title')}</h2>
            <p className="text-muted-foreground">
              {t('description', { workspaceName: workspace.name })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <form
            action={async () => {
              'use server';
              const supabase = await createClient();
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) return;

              await supabase.from('workspace_members').insert({
                workspace_id: workspace.id,
                user_id: user.id,
                role: 'member',
                status: 'active',
              });

              redirect(`/ko/ws/${workspace.slug}/dashboard`);
            }}
          >
            <button
              type="submit"
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              {t('joinNow')}
            </button>
          </form>
          <Link
            href="/ko/workspace-select"
            className="w-full py-4 bg-muted text-foreground rounded-2xl font-bold text-center hover:bg-muted/80 transition-all text-sm"
          >
            {t('later')}
          </Link>
        </div>

        <p className="text-[10px] text-muted-foreground text-center">{t('agreement')}</p>
      </div>
    </div>
  );
}
