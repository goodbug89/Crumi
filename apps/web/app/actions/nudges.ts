'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

function getCooltimeDays(
  settings: { target_type: string; target_id: string | null; cooltime_days: number }[] | null,
  targetType: string,
  defaultDays: number,
): number {
  return (
    settings?.find((s) => s.target_type === targetType && !s.target_id)?.cooltime_days ||
    defaultDays
  );
}

function calcDaysSince(dateStr: string | null): number {
  const lastDate = dateStr ? new Date(dateStr) : new Date(0);
  return Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

export async function scanAndGenerateNudges(slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!workspace) return { error: 'Workspace not found' };

  // 워크스페이스 멤버 검증
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  if (!membership) return { error: 'Not a workspace member' };

  const { data: settings } = await supabase
    .from('cooltime_settings')
    .select('*')
    .eq('workspace_id', workspace.id);

  const customerCooltime = getCooltimeDays(settings, 'customer', 7);

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name')
    .eq('workspace_id', workspace.id)
    .is('deleted_at', null)
    .eq('status', 'active');

  if (!customers) return { count: 0 };

  let nudgeCount = 0;

  for (const customer of customers) {
    const { data: existingNudge } = await supabase
      .from('nudges')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('status', 'pending')
      .single();

    if (existingNudge) continue;

    const { data: lastActivity } = await supabase
      .from('activities')
      .select('created_at')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const daysSince = calcDaysSince(lastActivity?.created_at || null);

    if (daysSince < customerCooltime) continue;

    await supabase.from('nudges').insert({
      workspace_id: workspace.id,
      assigned_to: user.id,
      target_type: 'customer',
      customer_id: customer.id,
      urgency: daysSince > customerCooltime * 2 ? 'urgent' : 'warning',
      title: `💬 ${customer.name} 고객 넛지`,
      message: `${daysSince}일 동안 활동이 없었습니다. 연락해 보시는 건 어떨까요?`,
      days_overdue: daysSince - customerCooltime,
      last_activity_at: lastActivity?.created_at || null,
    });
    nudgeCount++;
  }

  revalidatePath(`/ko/ws/${slug}/dashboard`);
  return { count: nudgeCount };
}
