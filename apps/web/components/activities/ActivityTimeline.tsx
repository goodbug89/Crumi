'use client';

import { createClient } from '@/lib/supabase/client';
import { CheckSquare, Clock, Mail, Phone, StickyNote, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import ActivityForm from './ActivityForm';

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  created_at: string;
  completed_at: string;
  user_id: string;
  user_profiles?: {
    display_name: string;
  };
}

interface ActivityTimelineProps {
  workspaceId: string;
  customerId?: string;
  projectId?: string;
  dealId?: string;
}

export default function ActivityTimeline({
  workspaceId,
  customerId,
  projectId,
  dealId,
}: ActivityTimelineProps) {
  const t = useTranslations('activities');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const TYPE_CONFIG: Record<string, { icon: typeof Phone; color: string; label: string }> = {
    call: { icon: Phone, color: 'bg-blue-500/10 text-blue-500', label: t('types.call') },
    email: { icon: Mail, color: 'bg-purple-500/10 text-purple-500', label: t('types.email') },
    meeting: { icon: Users, color: 'bg-orange-500/10 text-orange-500', label: t('types.meeting') },
    note: { icon: StickyNote, color: 'bg-gray-500/10 text-gray-500', label: t('types.note') },
    task: { icon: CheckSquare, color: 'bg-green-500/10 text-green-500', label: t('types.task') },
  };

  const fetchActivities = useCallback(async () => {
    try {
      const supabase = createClient();
      
      // 현재 사용자 정보 가져오기 (이미 있으면 생략 가능하지만 필터링 위해 필요)
      if (!currentUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);
      }

      let query = supabase
        .from('activities')
        .select('*, user_profiles(display_name)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (customerId) query = query.eq('customer_id', customerId);
      if (projectId) query = query.eq('project_id', projectId);
      if (dealId) query = query.eq('deal_id', dealId);
      
      if (filter === 'mine' && currentUserId) {
        query = query.eq('user_id', currentUserId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, customerId, projectId, dealId, filter, currentUserId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="font-bold text-lg">{t('title')}</h3>
          <div className="flex items-center bg-muted/50 p-1 rounded-lg border border-border/50">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                filter === 'all'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('filterAll')}
            </button>
            <button
              onClick={() => setFilter('mine')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                filter === 'mine'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('filterMine')}
            </button>
          </div>
        </div>
        <ActivityForm
          workspaceId={workspaceId}
          customerId={customerId}
          projectId={projectId}
          dealId={dealId}
          onSuccess={fetchActivities}
        />
      </div>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

        <div className="flex flex-col gap-8 relative">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="pl-12 py-4 text-muted-foreground text-sm">{t('empty')}</div>
          ) : (
            activities.map((activity) => {
              const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.note;
              const Icon = config.icon;

              return (
                <div key={activity.id} className="relative pl-12">
                  {/* Icon Circle */}
                  <div
                    className={`absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-background flex items-center justify-center z-10 ${config.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-foreground">{activity.title}</span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(activity.created_at).toLocaleString('ko-KR', {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {activity.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-black tracking-tighter">
                        {config.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {t('authorBy', { name: activity.user_profiles?.display_name || 'Anonymous' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
