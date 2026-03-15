'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    position: '',
    email: '',
    phone: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      
      // 워크스페이스 ID 조회
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', slug)
        .single();
        
      if (!workspace) throw new Error('워크스페이스를 찾을 수 없습니다.');

      // 고객 데이터 추가
      const { error: insertError } = await supabase
        .from('customers')
        .insert({
          workspace_id: workspace.id,
          name: formData.name,
          company_name: formData.company_name || null,
          position: formData.position || null,
          email: formData.email || null,
          phone: formData.phone || null,
          notes: formData.notes || null,
          status: 'active',
        });

      if (insertError) throw insertError;

      router.push(`/ko/ws/${slug}/customers`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '고객 저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/ko/ws/${slug}/customers`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted"
        >
          ←
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">새 고객 추가</h2>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                이름 <span className="text-danger">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="홍길동"
                required
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="company_name" className="text-sm font-medium text-foreground">
                회사명
              </label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="(주)크루미"
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="position" className="text-sm font-medium text-foreground">
                직책
              </label>
              <input
                id="position"
                name="position"
                type="text"
                value={formData.position}
                onChange={handleChange}
                placeholder="대표"
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">
                연락처
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-0000-0000"
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            
            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="notes" className="text-sm font-medium text-foreground">
                메모 (선택)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="고객에 대한 추가 정보를 입력하세요."
                rows={4}
                className="rounded-lg border border-input bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href={`/ko/ws/${slug}/customers`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-semibold text-foreground transition-all hover:bg-muted"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '저장 중...' : '고객 저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
