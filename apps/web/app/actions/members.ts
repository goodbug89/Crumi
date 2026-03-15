'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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
