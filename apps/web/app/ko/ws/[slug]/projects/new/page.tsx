'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewProjectPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning', // planning, in_progress, completed, put_on_hold
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
      
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();
        
      if (!workspace) throw new Error('워크스페이스를 찾을 수 없습니다.');

      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          workspace_id: workspace.id,
          name: formData.name,
          description: formData.description || null,
          status: formData.status as any,
        });

      if (insertError) throw insertError;

      router.push(`/ko/ws/${slug}/projects`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/ko/ws/${slug}/projects`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted"
        >
          ←
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">새 프로젝트 생성</h2>
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
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                프로젝트 이름 <span className="text-danger">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="2026 런칭 마케팅 컨설팅"
                required
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-sm font-medium text-foreground">
                현재 상태
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 appearance-none"
              >
                <option value="planning">기획중</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="put_on_hold">보류</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium text-foreground">
                상세 설명
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="프로젝트의 목적과 주요 범위를 기술해주세요."
                rows={5}
                className="rounded-lg border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href={`/ko/ws/${slug}/projects`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-semibold text-foreground transition-all hover:bg-muted"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '프로젝트 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
