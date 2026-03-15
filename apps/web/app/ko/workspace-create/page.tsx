'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function CreateWorkspacePage() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 슬러그는 영문 소문자, 숫자, 하이픈만 허용
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('워크스페이스 이름을 입력해주세요.');
      return;
    }
    if (!slug.trim()) {
      setError('워크스페이스 URL을 입력해주세요.');
      return;
    }

    setLoading(true);
    
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('인증이 필요합니다.');
      }

      // 1. 워크스페이스 생성
      const { data: workspace, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          slug,
          owner_id: user.id,
        })
        .select()
        .single();

      if (wsError) {
        if (wsError.code === '23505') { // 고유 제약조건 위반 (slug 중복)
          throw new Error('이미 사용 중인 URL입니다. 다른 URL을 입력해주세요.');
        }
        throw wsError;
      }

      // 2. 멤버 추가 (owner 역할)
      const { error: memberError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: user.id,
          role: 'owner',
          status: 'active',
        });

      if (memberError) throw memberError;

      // 3. 성공 시 대시보드로 이동
      router.push(`/ko/ws/${workspace.slug}/dashboard`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '워크스페이스 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-3xl">
            ✨
          </div>
          <h1 className="text-2xl font-bold text-foreground">워크스페이스 만들기</h1>
          <p className="text-sm text-center text-muted-foreground">
            팀과 함께 사용할 새로운 공간을 만듭니다.
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            {error && (
              <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                워크스페이스 이름
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }
                }}
                placeholder="예: 우리팀 CRM"
                required
                maxLength={50}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="slug" className="text-sm font-medium text-foreground">
                고유 URL (영문 소문자, 숫자, 하이픈만 가능)
              </label>
              <div className="flex rounded-lg border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
                <span className="flex items-center px-3 text-sm text-muted-foreground border-r border-input bg-muted/50 rounded-l-lg">
                  crm.example.com/
                </span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="our-team"
                  required
                  maxLength={50}
                  className="h-11 flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name || !slug}
              className="mt-2 h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '워크스페이스 생성'}
            </button>

            <Link
              href="/ko/workspace-select"
              className="mt-1 flex h-11 items-center justify-center rounded-xl font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
            >
              취소
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
}
