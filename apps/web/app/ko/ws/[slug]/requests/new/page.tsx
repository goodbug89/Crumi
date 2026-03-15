'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewRequestPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증 오류');

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();
        
      if (!workspace) throw new Error('워크스페이스를 찾을 수 없습니다.');

      const { error: insertError } = await supabase
        .from('feature_requests')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          category: formData.category as any,
          status: 'open',
          vote_count: 1, // 본인 자동 1표
        });

      if (insertError) throw insertError;

      router.push(`/ko/ws/${slug}/requests`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/ko/ws/${slug}/requests`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted"
        >
          ←
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">새로운 아이디어 제안</h2>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                제목 <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 고객 목록에서 태그 필터링이 필요해요"
                required
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-sm font-medium text-foreground">
                분류
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 appearance-none"
              >
                <option value="customer">고객 관리</option>
                <option value="pipeline">파이프라인 및 거래</option>
                <option value="project">프로젝트 관리</option>
                <option value="nudge">알림(넛지) 시스템</option>
                <option value="ai">AI 스킬</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                상세 내용 <span className="text-danger">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="어떤 기능인지, 왜 필요한지 자세히 알려주세요 :)"
                required
                rows={6}
                className="rounded-lg border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href={`/ko/ws/${slug}/requests`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-semibold text-foreground transition-all hover:bg-muted"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.description}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '제출 중...' : '제안하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
