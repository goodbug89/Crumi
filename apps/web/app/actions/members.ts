'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveMember(slug: string, memberId: string, action: 'approve' | 'reject') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  // 워크스페이스 조회 및 admin 권한 확인
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, workspace_members!inner(role)')
    .eq('slug', slug)
    .eq('workspace_members.user_id', user.id)
    .single();

  if (!workspace) {
    return { error: '워크스페이스를 찾을 수 없습니다.' };
  }

  const role = (workspace.workspace_members as { role: string }[])[0]?.role;
  if (role !== 'owner' && role !== 'admin') {
    return { error: '권한이 없습니다.' };
  }

  if (action === 'approve') {
    const { error } = await supabase
      .from('workspace_members')
      .update({ status: 'active' })
      .eq('workspace_id', workspace.id)
      .eq('user_id', memberId);

    if (error) {
      return { error: error.message || '승인에 실패했습니다.' };
    }
  } else {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspace.id)
      .eq('user_id', memberId);

    if (error) {
      return { error: error.message || '거절에 실패했습니다.' };
    }
  }

  revalidatePath(`/ko/ws/${slug}/settings`);
  return { success: true };
}

export async function removeMember(slug: string, memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: '로그인이 필요합니다.' };
  }

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!workspace) {
    return { error: '워크스페이스를 찾을 수 없습니다.' };
  }

  // RPC 호출로 멤버 제외
  const { error } = await supabase.rpc('remove_workspace_member', {
    p_workspace_id: workspace.id,
    p_target_user_id: memberId,
  });

  if (error) {
    return { error: error.message || '멤버 제외에 실패했습니다.' };
  }

  revalidatePath(`/ko/ws/${slug}/settings`);
  return { success: true };
}
