import { createClient } from '@/lib/supabase/server';
import { AlertCircle, Clock, Users } from 'lucide-react';
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
        <div className="max-w-sm w-full bg-card border border-border rounded-xl p-6 shadow-lg text-center flex flex-col gap-4">
          <div className="h-12 w-12 bg-danger/10 rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-danger" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">{t('invalidCode')}</h2>
            <p className="text-[13px] text-muted-foreground">{t('invalidCodeDescription')}</p>
          </div>
          <Link
            href="/ko/workspace-select"
            className="py-2.5 bg-primary text-white rounded-lg font-semibold text-[13px] text-center hover:bg-primary/90 transition-all"
          >
            {t('goToWorkspace')}
          </Link>
        </div>
      </div>
    );
  }

  // 이미 멤버인지 확인 (active 또는 pending)
  const { data: existingMember } = await supabase
    .from('workspace_members')
    .select('id, status')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single();

  // active 멤버면 바로 이동
  if (existingMember?.status === 'active') {
    redirect(`/ko/ws/${workspace.slug}/dashboard`);
  }

  // pending 상태면 대기 화면
  if (existingMember?.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-sm w-full bg-card border border-border rounded-xl p-6 shadow-lg flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 bg-warning/10 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-warning-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-foreground">{t('pendingTitle')}</h2>
              <p className="text-[13px] text-muted-foreground">
                {t('pendingDescription', { workspaceName: workspace.name })}
              </p>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-[12px] text-muted-foreground">{t('pendingNote')}</p>
          </div>

          <Link
            href="/ko/workspace-select"
            className="w-full py-2.5 bg-muted text-foreground rounded-lg font-semibold text-[13px] text-center hover:bg-muted/80 transition-all"
          >
            {t('goToWorkspace')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full bg-card border border-border rounded-xl p-6 shadow-lg flex flex-col gap-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">{t('title')}</h2>
            <p className="text-[13px] text-muted-foreground">
              {t('description', { workspaceName: workspace.name })}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
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
                status: 'pending',
              });

              redirect(`/ko/join/${code}?requested=1`);
            }}
          >
            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-white rounded-lg font-semibold text-[13px] shadow hover:bg-primary/90 active:scale-95 transition-all"
            >
              {t('joinNow')}
            </button>
          </form>
          <Link
            href="/ko/workspace-select"
            className="w-full py-2.5 bg-muted text-foreground rounded-lg font-semibold text-[13px] text-center hover:bg-muted/80 transition-all"
          >
            {t('later')}
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">{t('agreement')}</p>
      </div>
    </div>
  );
}
