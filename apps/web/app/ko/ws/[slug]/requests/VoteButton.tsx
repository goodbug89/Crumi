'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function VoteButton({
  requestId,
  initialVotes,
  hasVoted,
}: {
  requestId: string;
  initialVotes: number;
  hasVoted: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [voted, setVoted] = useState(hasVoted);
  const [votes, setVotes] = useState(initialVotes);
  const router = useRouter();

  const handleVote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (voted || loading) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. 투표 기록 추가
      const { error: voteError } = await supabase.from('feature_votes').insert({
        request_id: requestId,
        user_id: user.id,
      });

      if (voteError) throw voteError;

      // 2. 카운트 업데이트 (RPC 또는 단순 업데이트)
      // 실제로는 DB Trigger나 RPC가 안전하지만 여기서는 간단히 처리
      const { error: updateError } = await supabase.rpc('increment_request_vote', {
        request_id: requestId,
      });

      // 만약 RPC가 없으면 단순 업데이트로 대체 (나중에 마이그레이션 필요)
      if (updateError) {
        await supabase
          .from('feature_requests')
          .update({ vote_count: votes + 1 })
          .eq('id', requestId);
      }

      setVoted(true);
      setVotes((prev) => prev + 1);
      router.refresh();
    } catch (err) {
      console.error('Vote failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleVote}
      disabled={voted || loading}
      className={`flex flex-col gap-1 items-center justify-center p-3 rounded-lg border transition-all w-16 h-16 shrink-0
        ${
          voted
            ? 'bg-primary/10 border-primary/50 text-primary cursor-default'
            : 'bg-muted/30 border-border hover:bg-muted/50 text-muted-foreground'
        }
      `}
    >
      <span className={`text-lg transition-transform ${loading ? 'animate-bounce' : ''}`}>
        {voted ? '✅' : '▲'}
      </span>
      <span className="font-bold">{votes}</span>
    </button>
  );
}
