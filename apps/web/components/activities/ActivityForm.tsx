'use client';

import { createClient } from '@/lib/supabase/client';
import { CheckSquare, Mail, Phone, Plus, StickyNote, Users, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ActivityFormProps {
  workspaceId: string;
  customerId?: string;
  projectId?: string;
  dealId?: string;
  onSuccess?: () => void;
}

export default function ActivityForm({
  workspaceId,
  customerId,
  projectId,
  dealId,
  onSuccess,
}: ActivityFormProps) {
  const router = useRouter();
  const t = useTranslations('activities');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const ACTIVITY_TYPES = [
    { id: 'call', label: t('types.call'), icon: Phone, color: 'text-blue-500' },
    { id: 'email', label: t('types.email'), icon: Mail, color: 'text-purple-500' },
    { id: 'meeting', label: t('types.meeting'), icon: Users, color: 'text-orange-500' },
    { id: 'note', label: t('types.note'), icon: StickyNote, color: 'text-gray-500' },
    { id: 'task', label: t('types.task'), icon: CheckSquare, color: 'text-green-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error(t('form.authRequired'));

      const { error } = await supabase.from('activities').insert({
        workspace_id: workspaceId,
        customer_id: customerId || null,
        project_id: projectId || null,
        deal_id: dealId || null,
        user_id: user.id,
        type,
        title,
        description,
        completed_at: new Date().toISOString(), // 기본적으로 완료 상태로 저장
      });

      if (error) throw error;

      setTitle('');
      setDescription('');
      setIsOpen(false);

      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      alert(t('form.saveError'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t('addButton')}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-foreground">{t('newRecord')}</h4>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TYPES.map((actType) => (
            <button
              key={actType.id}
              type="button"
              onClick={() => setType(actType.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${
                  type === actType.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface border border-border text-muted-foreground hover:bg-muted'
                }`}
            >
              <actType.icon className="w-3.5 h-3.5" />
              {actType.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('form.titlePlaceholder')}
            required
            className="h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('form.descriptionPlaceholder')}
            rows={3}
            className="p-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted rounded-lg"
          >
            {t('form.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading || !title}
            className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
          >
            {loading ? t('form.submitting') : t('form.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
