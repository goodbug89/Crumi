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
      let query = supabase
        .from('activities')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (customerId) query = query.eq('customer_id', customerId);
      if (projectId) query = query.eq('project_id', projectId);
      if (dealId) query = query.eq('deal_id', dealId);

      const { data, error } = await query;
      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, customerId, projectId, dealId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">{t('title')}</h3>
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
                    <div className="mt-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase font-medium">
                        {config.label}
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
