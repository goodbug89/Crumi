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
    <div className="flex flex-col gap-8 animate-fade-in-up pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t('title')}</h2>
          <p className="text-slate-500 font-medium text-sm">{t('subtitle')}</p>
        </div>
        <Link
          href={`/ko/ws/${slug}/requests/new`}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-6 font-bold text-sm text-white shadow-sm transition-all hover:bg-emerald-700 hover:translate-y-[-2px] active:scale-[0.98]"
        >
          {t('addNew')}
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {requests && requests.length > 0 ? (
          requests.map((req) => (
            <div
              key={req.id}
              className="group flex gap-6 p-7 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5 transition-all hover:translate-y-[-2px]"
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

              <div className="flex-1 flex flex-col gap-4 min-w-0">
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {req.title}
                    </h3>
                    <span
                      className={`shrink-0 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider mt-1
                      ${
                        req.status === 'done'
                          ? 'bg-emerald-50 text-emerald-700'
                          : req.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700'
                            : req.status === 'reviewing'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                      }
                    `}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-2">
                    {req.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                      {req.title[0]}
                    </div>
                    <span>
                      {t('suggestedBy')}{' '}
                      {(req.user_profiles as { display_name?: string } | null)?.display_name ||
                        t('anonymous')}
                    </span>
                  </div>
                  <span className="tabular-nums">{new Date(req.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl mb-6 grayscale opacity-40">
              💡
            </div>
            <h3 className="text-xl font-bold text-slate-900">{t('empty.title')}</h3>
            <p className="mt-2 text-slate-500 max-w-sm font-medium text-sm leading-relaxed">
              {t('empty.description')}
            </p>
            <Link
              href={`/ko/ws/${slug}/requests/new`}
              className="mt-10 inline-flex h-11 items-center justify-center px-10 bg-emerald-600 text-white rounded-lg font-bold text-sm shadow-sm hover:bg-emerald-700 hover:translate-y-[-2px] transition-all active:scale-[0.98]"
            >
              {t('empty.action')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
