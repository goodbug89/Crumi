'use client';

import { createClient } from '@/lib/supabase/client';
import { Clock, Info, Save, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CooltimeSetting {
  id: string;
  target_type: string;
  cooltime_days: number;
}

export default function CooltimeSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const t = useTranslations('settings.cooltime');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

        // 기본값 설정 (없을 경우를 대비)
        const defaultSettings = [
          { id: '', target_type: 'customer', cooltime_days: 7 },
          { id: '', target_type: 'project', cooltime_days: 14 },
          { id: '', target_type: 'deal_stage', cooltime_days: 3 },
        ];

        if (cooltimes && cooltimes.length > 0) {
          // 기존 데이터와 기본값을 병합하거나 표시
          setSettings(cooltimes);
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
    try {
      const supabase = createClient();

      const upsertData = settings.map((s) => ({
        workspace_id: workspaceId,
        target_type: s.target_type,
        cooltime_days: s.cooltime_days,
        target_id: null, // Global default
        deal_stage: null,
      }));

      const { error } = await supabase.from('cooltime_settings').upsert(upsertData, {
        onConflict: 'workspace_id, target_type, target_id, deal_stage',
      });

      if (error) throw error;
      alert(t('saveSuccess'));
      router.refresh();
    } catch (err) {
      console.error('Error saving settings:', err);
      alert(t('saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="p-6 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {settings.map((setting) => (
                <div
                  key={setting.target_type}
                  className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      {setting.target_type === 'customer' && <Shield className="w-5 h-5" />}
                      {setting.target_type === 'project' && <Clock className="w-5 h-5" />}
                      {setting.target_type === 'deal_stage' && <Save className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {t(`targets.${setting.target_type}`)}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {t('nudgeAfter', { days: setting.cooltime_days })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={setting.cooltime_days}
                      onChange={(e) =>
                        handleDaysChange(setting.target_type, Number.parseInt(e.target.value) || 1)
                      }
                      className="h-10 w-20 rounded-lg border border-border bg-background px-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-sm font-medium">{t('daysUnit')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-4 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 leading-relaxed">
                <p className="font-bold mb-1">{t('infoTitle')}</p>
                {t('infoDescription')}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 p-4 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
