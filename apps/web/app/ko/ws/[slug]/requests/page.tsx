import { createClient } from '@/lib/supabase/server';
import { Lightbulb } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import VoteButton from './VoteButton';

export default async function FeatureRequestsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/ko/login');
  }

  const t = await getTranslations('requests');

  // 워크스페이스 조회
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!workspace) redirect('/ko/workspace-select');

  // 기능 요청 목록 조회
  const { data: requests } = await supabase
    .from('feature_requests')
    .select(`
      *,
      user_profiles:user_id (display_name),
      feature_votes (user_id)
    `)
    .eq('workspace_id', workspace.id)
    .order('vote_count', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-4 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
          <p className="text-muted-foreground text-[13px]">{t('subtitle')}</p>
        </div>
        <Link
          href={`/ko/ws/${slug}/requests/new`}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-primary/90 active:scale-[0.98]"
        >
          {t('addNew')}
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {requests && requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req.id}
              className="group flex gap-4 px-4 py-3 rounded-lg border border-border bg-surface hover:border-primary/30 hover:bg-muted/20 transition-colors"
            >
              {/* 투표 컨테이너 */}
              <div className="shrink-0 flex items-start pt-0.5">
                <VoteButton
                  requestId={req.id}
                  initialVotes={req.vote_count || 0}
                  hasVoted={(req.feature_votes as { user_id: string }[])?.some(
                    (v) => v.user_id === user.id,
                  )}
                />
              </div>

              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-medium text-[13px] text-foreground group-hover:text-primary transition-colors truncate">
                    {req.title}
                  </h3>
                  <span
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-sm uppercase font-medium tracking-wide
                    ${
                      req.status === 'done'
                        ? 'bg-success/10 text-success'
                        : req.status === 'in_progress'
                          ? 'bg-blue-50 text-blue-700'
                          : req.status === 'reviewing'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-muted text-muted-foreground'
                    }
                  `}
                  >
                    {req.status}
                  </span>
                </div>
                <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
                  {req.description}
                </p>

                <div className="flex items-center justify-between pt-1.5 border-t border-border text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-sm bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground">
                      {req.title[0]}
                    </div>
                    <span>
                      {t('suggestedBy')}{' '}
                      {(req.user_profiles as { display_name?: string } | null)?.display_name ||
                        t('anonymous')}
                    </span>
                  </div>
                  <span className="tabular-nums">
                    {new Date(req.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed border-border bg-muted/20">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mb-4">
              <Lightbulb className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{t('empty.title')}</h3>
            <p className="mt-1 text-muted-foreground max-w-sm text-[13px] leading-relaxed">
              {t('empty.description')}
            </p>
            <Link
              href={`/ko/ws/${slug}/requests/new`}
              className="mt-6 inline-flex h-9 items-center justify-center px-6 bg-primary text-white rounded-md text-[13px] font-medium shadow-sm hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              {t('empty.action')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
