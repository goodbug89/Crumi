'use client';

import { createClient } from '@/lib/supabase/client';
import { BarChart3, Clock, Info, Save, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CooltimeSetting {
  id: string;
  target_type: string;
  cooltime_days: number;
}

export default function CooltimeSettingsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('settings.cooltime');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [settings, setSettings] = useState<CooltimeSetting[]>([]);
  const [workspaceId, setWorkspaceId] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // 워크스페이스 조회
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!workspace) throw new Error(t('workspaceNotFound'));
        setWorkspaceId(workspace.id);

        // 설정 조회
        const { data: cooltimes } = await supabase
          .from('cooltime_settings')
          .select('*')
          .eq('workspace_id', workspace.id);

        // 기본값: 고객 7일, 프로젝트 5일, 거래 3일 (CLAUDE.md 기준)
        const defaultSettings: CooltimeSetting[] = [
          { id: '', target_type: 'customer', cooltime_days: 7 },
          { id: '', target_type: 'project', cooltime_days: 5 },
          { id: '', target_type: 'deal_stage', cooltime_days: 3 },
        ];

        if (cooltimes && cooltimes.length > 0) {
          // 기존 데이터를 기본값에 병합
          const merged = defaultSettings.map((def) => {
            const existing = cooltimes.find((c) => c.target_type === def.target_type);
            return existing ? { ...def, ...existing } : def;
          });
          setSettings(merged);
        } else {
          setSettings(defaultSettings);
        }
      } catch (err) {
        console.error('Error fetching cooltime settings:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug, t]);

  const handleDaysChange = (type: string, days: number) => {
    setSettings((prev) =>
      prev.map((s) => (s.target_type === type ? { ...s, cooltime_days: days } : s)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const supabase = createClient();

      const upsertData = settings.map((s) => ({
        workspace_id: workspaceId,
        target_type: s.target_type,
        cooltime_days: s.cooltime_days,
        target_id: null,
        deal_stage: null,
      }));

      const { error } = await supabase.from('cooltime_settings').upsert(upsertData, {
        onConflict: 'workspace_id, target_type, target_id, deal_stage',
      });

      if (error) throw error;
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const targetIcons: Record<string, React.ReactNode> = {
    customer: <Users className="w-4 h-4" />,
    project: <Clock className="w-4 h-4" />,
    deal_stage: <BarChart3 className="w-4 h-4" />,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">{t('title')}</h2>
        <p className="text-[13px] text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 flex flex-col gap-3">
          {settings.map((setting) => (
            <div
              key={setting.target_type}
              className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {targetIcons[setting.target_type]}
                </div>
                <div>
                  <h4 className="font-semibold text-[13px] text-foreground">
                    {t(`targets.${setting.target_type}`)}
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    {t('nudgeAfter', { days: setting.cooltime_days })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={setting.cooltime_days}
                  onChange={(e) =>
                    handleDaysChange(setting.target_type, Number.parseInt(e.target.value) || 1)
                  }
                  className="h-8 w-16 rounded-lg border border-border bg-background px-2 text-[13px] text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-[13px] font-medium text-muted-foreground">
                  {t('daysUnit')}
                </span>
              </div>
            </div>
          ))}

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 flex gap-2.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-[12px] text-blue-700 leading-relaxed">
              <p className="font-semibold mb-0.5">{t('infoTitle')}</p>
              {t('infoDescription')}
            </div>
          </div>
        </div>

        <div className="bg-muted/30 px-4 py-3 border-t border-border flex items-center justify-between">
          {saveStatus === 'success' && (
            <span className="text-[12px] text-success font-medium">{t('saveSuccess')}</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-[12px] text-danger font-medium">{t('saveError')}</span>
          )}
          {saveStatus === 'idle' && <span />}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 font-semibold text-[13px] text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
