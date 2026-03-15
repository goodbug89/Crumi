'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function NewDealPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 연관 데이터 목록 상태 (고객, 프로젝트)
  const [customers, setCustomers] = useState<{id: string, name: string}[]>([]);
  const [projects, setProjects] = useState<{id: string, name: string}[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    stage: 'lead',
    amount: '',
    probability: '50',
    customer_id: '',
    project_id: '',
  });

  useEffect(() => {
    // 폼 로드 시 워크스페이스에 속한 고객 및 프로젝트 목록 패치
    const fetchData = async () => {
      const supabase = createClient();
      const { data: workspace } = await supabase.from('workspaces').select('id').eq('slug', slug).single();
      
      if (workspace) {
        const { data: cData } = await supabase.from('customers').select('id, name').eq('workspace_id', workspace.id);
        const { data: pData } = await supabase.from('projects').select('id, name').eq('workspace_id', workspace.id);
        if (cData) setCustomers(cData);
        if (pData) setProjects(pData);
      }
    };
    fetchData();
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const { data: workspace } = await supabase.from('workspaces').select('id').eq('slug', slug).single();
      if (!workspace) throw new Error('워크스페이스를 찾을 수 없습니다.');

      const { error: insertError } = await supabase
        .from('deals')
        .insert({
          workspace_id: workspace.id,
          title: formData.title,
          stage: formData.stage,
          currency: 'KRW',
          amount: formData.amount ? parseInt(formData.amount, 10) : null,
          probability: parseInt(formData.probability, 10) || 0,
          customer_id: formData.customer_id || null,
          project_id: formData.project_id || null,
        });

      if (insertError) throw insertError;

      router.push(`/ko/ws/${slug}/pipeline`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '거래(Deal) 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/ko/ws/${slug}/pipeline`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted"
        >
          ←
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">새 거래(Deal) 생성</h2>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          {error && (
            <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2 md:col-span-2">
              <label htmlFor="title" className="text-sm font-medium text-foreground">
                거래명 (기회 제목) <span className="text-danger">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="엔터프라이즈 라이선스 확장건"
                required
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="stage" className="text-sm font-medium text-foreground">
                현재 파이프라인 단계
              </label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 appearance-none"
              >
                <option value="lead">리드 (Lead)</option>
                <option value="contact">접촉 및 제안</option>
                <option value="negotiation">협상 중</option>
                <option value="won">계약 수주</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="probability" className="text-sm font-medium text-foreground">
                예상 승률 (%)
              </label>
              <input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={handleChange}
                className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="amount" className="text-sm font-medium text-foreground">
                예상 금액 (KRW)
              </label>
              <div className="flex rounded-lg border border-input bg-background focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20">
                <span className="flex items-center px-3 text-sm text-muted-foreground border-r border-input bg-muted/50 rounded-l-lg">
                  ₩
                </span>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="1000000"
                  className="h-11 flex-1 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 md:col-span-2 pt-4 border-t border-border border-dashed mt-2">
              <h4 className="text-sm font-medium text-foreground mb-1">연관 정보 (선택)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="customer_id" className="text-xs font-medium text-muted-foreground">
                    연결된 고객
                  </label>
                  <select
                    id="customer_id"
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleChange}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 appearance-none"
                  >
                    <option value="">-- 고객 선택 안함 --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="project_id" className="text-xs font-medium text-muted-foreground">
                    관련 프로젝트
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleChange}
                    className="h-11 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 appearance-none"
                  >
                    <option value="">-- 프로젝트 선택 안함 --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href={`/ko/ws/${slug}/pipeline`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-6 font-semibold text-foreground transition-all hover:bg-muted"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.title}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? '생성 중...' : '거래 생성하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
