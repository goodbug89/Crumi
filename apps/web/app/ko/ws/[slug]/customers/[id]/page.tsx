import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

  // 고객 정보 조회
  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspace.id)
    .single();

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="text-xl font-bold">고객을 찾을 수 없습니다.</h2>
        <Link href={`/ko/ws/${slug}/customers`} className="mt-4 text-primary hover:underline">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      {/* 뒤로가기 및 제목 영역 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href={`/ko/ws/${slug}/customers`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground hover:bg-muted"
          >
            ←
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-xl font-bold text-secondary">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {customer.name}
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    customer.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                }`}>
                  {customer.status}
                </span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {customer.company_name} {customer.position && `· ${customer.position}`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button className="h-9 px-4 rounded-lg border border-border bg-surface text-sm font-medium transition-colors hover:bg-muted">
            수정
          </button>
          <button className="h-9 px-4 rounded-lg bg-danger/10 text-danger text-sm font-medium transition-colors hover:bg-danger/20">
            삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 왼쪽: 기본 정보 패널 */}
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-semibold text-lg border-b border-border pb-3 mb-4">연락처 정보</h3>
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">이메일</span>
                <span className="font-medium">{customer.email || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">전화번호</span>
                <span className="font-mono">{customer.phone || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">등록일</span>
                <span>{new Date(customer.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <h3 className="font-semibold text-lg border-b border-border pb-3 mb-4">메모</h3>
            <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {customer.notes || '등록된 메모가 없습니다.'}
            </p>
          </div>
        </div>

        {/* 오른쪽: 연관 데이터 (프로젝트, 거래, 활동) placeholder */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="border-b border-border p-5 bg-muted/30">
              <h3 className="font-semibold text-lg">참여 중인 프로젝트</h3>
            </div>
            <div className="p-8 text-center text-muted-foreground text-sm">
              <div className="text-3xl mb-2">📁</div>
              연결된 프로젝트가 없습니다
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
            <div className="border-b border-border p-5 bg-muted/30">
              <h3 className="font-semibold text-lg">활동 기록 및 넛지</h3>
            </div>
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col gap-2 items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 text-secondary text-2xl">
                💬
              </div>
              아직 기록된 활동이 없습니다. 통화나 이메일 기록을 남겨보세요!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
