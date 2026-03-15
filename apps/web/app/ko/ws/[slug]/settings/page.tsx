import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
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

  return (
    <div className="flex flex-col gap-10 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{t('title')}</h2>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm overflow-hidden flex flex-col gap-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>🏢</span> {t('general.title')}
            </h3>
            <div className="flex flex-col gap-5 text-sm mt-2">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  {t('general.workspaceName')}
                </p>
                <p className="font-bold text-base">{workspace.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  {t('general.slug')}
                </p>
                <p className="font-mono text-xs bg-muted/60 p-2.5 rounded-xl border border-border/50 block w-full truncate">
                  {workspace.slug}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                  {t('general.currentPlan')}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary uppercase">
                    {workspace.plan}
                  </span>
                  {workspace.plan === 'free' && (
                    <button
                      type="button"
                      className="text-[10px] font-bold text-secondary hover:underline"
                    >
                      {t('general.upgrade')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="mt-4 w-full py-3 bg-muted text-foreground rounded-2xl font-bold text-xs hover:bg-muted/80 transition-all"
            >
              {t('general.editInfo')}
            </button>
          </div>

          <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm overflow-hidden flex flex-col gap-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>⚡</span> {t('features.title')}
            </h3>
            <div className="flex flex-col gap-3">
              <Link
                href={`/ko/ws/${slug}/settings/cooltime`}
                className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔔</span>
                  <span className="text-sm font-bold text-foreground">
                    {t('features.nudgeSystem')}
                  </span>
                </div>
                <span className="text-muted-foreground">→</span>
              </Link>
              <Link
                href={`/ko/ws/${slug}/settings/billing`}
                className="flex items-center justify-between p-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">💳</span>
                  <span className="text-sm font-bold text-foreground">{t('features.billing')}</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-3xl border border-border bg-surface shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-border p-6 bg-muted/20 flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <span>👥</span> {t('members.title')}
            </h3>
            {isAdmin && <InviteButton slug={slug} inviteCode={workspace.invite_code} />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-muted-foreground bg-muted/20 uppercase font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">{t('members.columns.user')}</th>
                  <th className="px-6 py-4">{t('members.columns.role')}</th>
                  <th className="px-6 py-4">{t('members.columns.status')}</th>
                  <th className="px-6 py-4">{t('members.columns.joinDate')}</th>
                  <th className="px-6 py-4 text-right">{t('members.columns.manage')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {members?.map(
                  (member: {
                    id: string;
                    user_id: string;
                    role: string;
                    status: string;
                    created_at: string;
                    user_profiles: { display_name: string; email: string; avatar_url: string }[];
                  }) => (
                    <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 bg-secondary/10 rounded-xl flex items-center justify-center font-bold text-secondary border border-secondary/20 shrink-0">
                            {member.user_profiles?.[0]?.display_name?.charAt(0) || '?'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="font-bold text-foreground truncate">
                              {member.user_profiles?.[0]?.display_name || t('members.beforeLogin')}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {member.user_profiles?.[0]?.email || t('members.noEmail')}
                            </p>
                          </div>
                          {member.user_id === user.id && (
                            <span className="rounded-lg bg-secondary/20 px-2 py-0.5 text-[10px] font-black text-secondary">
                              {t('members.me')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 uppercase font-black text-[10px] tracking-tighter bg-muted/20 w-fit rounded-full m-4 block text-center">
                        {member.role}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase
                        ${member.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'}`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {new Date(member.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
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
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-muted/10 border-t border-border mt-auto">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('members.footnote1')}
              <br />
              {t('members.footnote2')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
