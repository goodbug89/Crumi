import { createClient } from '@/lib/supabase/server';
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
    <div className="flex flex-col gap-10 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-muted-foreground font-medium">{t('subtitle')}</p>
        </div>
        <Link
          href={`/ko/ws/${slug}/requests/new`}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-8 font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95"
        >
          {t('addNew')}
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {requests && requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req.id}
              className="group flex gap-6 p-7 rounded-[32px] border border-border bg-surface shadow-sm hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/[0.03] transition-all hover-lift"
            >
              {/* 투표 컨체이너 (Side) */}
              <div className="shrink-0 flex items-start pt-1">
                <VoteButton
                  requestId={req.id}
                  initialVotes={req.vote_count || 0}
                  hasVoted={(req.feature_votes as { user_id: string }[])?.some(
                    (v) => v.user_id === user.id,
                  )}
                />
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-black text-xl text-foreground group-hover:text-primary transition-colors truncate">
                      {req.title}
                    </h3>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-black tracking-widest
                      ${
                        req.status === 'done'
                          ? 'bg-success/10 text-success'
                          : req.status === 'in_progress'
                            ? 'bg-primary/10 text-primary'
                            : req.status === 'reviewing'
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-muted text-muted-foreground'
                      }
                    `}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed line-clamp-2">
                    {req.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-[8px]">
                      👤
                    </div>
                    <span>
                      {t('suggestedBy')}{' '}
                      {(req.user_profiles as { display_name?: string } | null)?.display_name ||
                        t('anonymous')}
                    </span>
                  </div>
                  <span>{new Date(req.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-[40px] border-2 border-dashed border-border/60 bg-surface/30 backdrop-blur-sm">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-5xl mb-6">
              💡
            </div>
            <h3 className="text-2xl font-black text-foreground">{t('empty.title')}</h3>
            <p className="mt-2 text-muted-foreground max-w-sm font-medium">
              {t('empty.description')}
            </p>
            <Link
              href={`/ko/ws/${slug}/requests/new`}
              className="mt-10 h-12 px-10 bg-foreground text-background rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all"
            >
              {t('empty.action')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
