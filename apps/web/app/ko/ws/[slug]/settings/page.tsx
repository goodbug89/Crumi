import { createClient } from '@/lib/supabase/server';
import { ArrowRight, Bell, Building2, CreditCard, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ApproveMemberButton from './ApproveMemberButton';
import InviteButton from './InviteButton';
import RemoveMemberButton from './RemoveMemberButton';

export default async function SettingsPage({
  params,
}: {
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

  const t = await getTranslations('settings');

  // 워크스페이스 및 멤버 정보 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select(`
      id, name, slug, plan, invite_code,
      workspace_members!inner(role, status)
    `)
    .eq('slug', slug)
    .eq('workspace_members.user_id', user.id)
    .single();

  if (!workspace) {
    redirect('/ko/workspace-select');
  }

  const role = workspace.workspace_members[0].role;
  const isAdmin = role === 'owner' || role === 'admin';

  // 전체 멤버 목록 조회 (사용자 프로필 정보 포함)
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      id, user_id, role, status, created_at,
      user_profiles:user_id (display_name, email, avatar_url)
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true });

  type Member = {
    id: string;
    user_id: string;
    role: string;
    status: string;
    created_at: string;
    user_profiles: { display_name: string; email: string; avatar_url: string }[];
  };

  const activeMembers = (members as Member[] | null)?.filter((m) => m.status === 'active') ?? [];
  const pendingMembers = (members as Member[] | null)?.filter((m) => m.status === 'pending') ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h2>
        <p className="text-[13px] text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 왼쪽: 일반 정보 + 기능 메뉴 */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* 일반 정보 카드 */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
            <h3 className="font-semibold text-[13px] flex items-center gap-2 text-foreground">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              {t('general.title')}
            </h3>
            <div className="flex flex-col gap-3 text-[13px]">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                  {t('general.workspaceName')}
                </p>
                <p className="font-semibold text-foreground">{workspace.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                  {t('general.slug')}
                </p>
                <p className="font-mono text-[12px] bg-muted/60 px-2 py-1 rounded-lg border border-border/50 truncate">
                  {workspace.slug}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                  {t('general.currentPlan')}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary uppercase">
                    {workspace.plan}
                  </span>
                  {workspace.plan === 'free' && (
                    <Link
                      href={`/ko/ws/${slug}/settings/billing`}
                      className="text-[11px] font-semibold text-secondary hover:underline"
                    >
                      {t('general.upgrade')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="w-full py-2 bg-muted text-foreground rounded-lg font-semibold text-[12px] hover:bg-muted/80 transition-all"
            >
              {t('general.editInfo')}
            </button>
          </div>

          {/* 기능 메뉴 카드 */}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
            <h3 className="font-semibold text-[13px] flex items-center gap-2 text-foreground mb-1">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {t('features.title')}
            </h3>
            <Link
              href={`/ko/ws/${slug}/settings/cooltime`}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[13px] font-medium text-foreground">
                  {t('features.nudgeSystem')}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
            <Link
              href={`/ko/ws/${slug}/settings/billing`}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[13px] font-medium text-foreground">
                  {t('features.billing')}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </Link>
          </div>
        </div>

        {/* 오른쪽: 멤버 관리 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* 대기 중인 멤버 승인 섹션 (admin만, pending 멤버 있을 때만 표시) */}
          {isAdmin && pendingMembers.length > 0 && (
            <div className="rounded-xl border border-warning/40 bg-warning/5 overflow-hidden">
              <div className="border-b border-warning/20 px-4 py-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-warning-foreground" />
                <h3 className="font-semibold text-[13px] text-warning-foreground">
                  {t('members.pendingTitle')} ({pendingMembers.length})
                </h3>
              </div>
              <div className="divide-y divide-warning/10">
                {pendingMembers.map((member) => (
                  <div key={member.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 bg-warning/10 rounded-lg flex items-center justify-center font-bold text-[11px] text-warning-foreground shrink-0">
                        {member.user_profiles?.[0]?.display_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-[13px] text-foreground">
                          {member.user_profiles?.[0]?.display_name || t('members.beforeLogin')}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {member.user_profiles?.[0]?.email || t('members.noEmail')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ApproveMemberButton slug={slug} memberId={member.user_id} action="approve" />
                      <ApproveMemberButton slug={slug} memberId={member.user_id} action="reject" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 활성 멤버 테이블 */}
          <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
            <div className="border-b border-border px-4 py-3 bg-muted/20 flex justify-between items-center">
              <h3 className="font-semibold text-[13px] flex items-center gap-2 text-foreground">
                <Users className="w-4 h-4 text-muted-foreground" />
                {t('members.title')}
                <span className="text-[11px] text-muted-foreground font-normal">
                  ({activeMembers.length})
                </span>
              </h3>
              {isAdmin && <InviteButton slug={slug} inviteCode={workspace.invite_code} />}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-left">
                <thead className="text-[11px] text-muted-foreground bg-muted/20 uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">{t('members.columns.user')}</th>
                    <th className="px-4 py-2.5">{t('members.columns.role')}</th>
                    <th className="px-4 py-2.5">{t('members.columns.status')}</th>
                    <th className="px-4 py-2.5">{t('members.columns.joinDate')}</th>
                    <th className="px-4 py-2.5 text-right">{t('members.columns.manage')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {activeMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 bg-secondary/10 rounded-lg flex items-center justify-center font-bold text-[11px] text-secondary border border-secondary/20 shrink-0">
                            {member.user_profiles?.[0]?.display_name?.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="font-semibold text-foreground truncate text-[13px]">
                              {member.user_profiles?.[0]?.display_name || t('members.beforeLogin')}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {member.user_profiles?.[0]?.email || t('members.noEmail')}
                            </p>
                          </div>
                          {member.user_id === user.id && (
                            <span className="rounded-md bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold text-secondary">
                              {t('members.me')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="uppercase font-bold text-[10px] tracking-wide bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase
                          ${member.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'}`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {isAdmin && member.user_id !== user.id && (
                          <RemoveMemberButton
                            slug={slug}
                            memberId={member.user_id}
                            memberName={
                              member.user_profiles?.[0]?.display_name || t('members.unknown')
                            }
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-muted/10 border-t border-border">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {t('members.footnote1')} {t('members.footnote2')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
