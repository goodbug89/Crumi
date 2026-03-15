import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  // 워크스페이스 및 멤버 정보 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select(`
      id, name, slug, plan,
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

  // 전체 멤버 목록 조회 (관리자인 경우만 상세 정보 표시)
  const { data: members } = await supabase
    .from('workspace_members')
    .select(`
      id, user_id, role, status, created_at
    `)
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true });

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">워크스페이스 설정</h2>
        <p className="text-muted-foreground mt-2">
          워크스페이스 세부 정보와 팀 멤버를 관리합니다.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-border p-5 bg-muted/30">
          <h3 className="font-semibold text-lg">일반 정보</h3>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-sm font-medium text-muted-foreground">워크스페이스 이름</div>
            <div className="md:col-span-2 font-medium">{workspace.name}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-sm font-medium text-muted-foreground">URL 슬러그</div>
            <div className="md:col-span-2 font-mono text-sm bg-muted/50 p-2 rounded w-fit">
              {workspace.slug}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-sm font-medium text-muted-foreground">플랜</div>
            <div className="md:col-span-2">
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {workspace.plan.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <div className="border-b border-border p-5 bg-muted/30 flex justify-between items-center">
          <h3 className="font-semibold text-lg">팀 멤버</h3>
          {isAdmin && (
            <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90">
              초대 링크 복사
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/30 uppercase border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium">사용자 ID</th>
                <th className="px-5 py-3 font-medium">역할</th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3 font-medium">가입일</th>
                <th className="px-5 py-3 font-medium text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members?.map((member) => (
                <tr key={member.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                    {member.user_id.substring(0, 8)}...
                    {member.user_id === user.id && (
                      <span className="ml-2 rounded bg-secondary/20 px-1.5 py-0.5 text-[10px] font-bold text-secondary">나</span>
                    )}
                  </td>
                  <td className="px-5 py-4 capitalize font-medium">
                    {member.role}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium 
                      ${member.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning-foreground'}`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isAdmin && member.user_id !== user.id && (
                      <button className="text-danger hover:text-danger/80 text-sm font-medium">
                        추방
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
