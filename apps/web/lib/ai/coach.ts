export type InsightType = 'URGENT' | 'OPPORTUNITY' | 'TIP';

export interface AIInsight {
  type: InsightType;
  title: string;
  message: string;
  targetId?: string;
  targetType?: 'customer' | 'project' | 'deal';
}

/**
 * 영업 데이터를 분석하여 인사이트를 도출하는 엔진 (Mock/Heuristic 기반)
 */
export function analyzeSalesData(data: {
  customers: any[];
  deals: any[];
  activities: any[];
}): AIInsight[] {
  const insights: AIInsight[] = [];

  // 1. 방치된 고객 분석 (Urgent)
  const now = new Date();
  for (const customer of data.customers) {
    const lastActivity = data.activities.find((a) => a.customer_id === customer.id);
    if (!lastActivity) {
      insights.push({
        type: 'URGENT',
        title: '첫 컨택 필요',
        message: `'${customer.name}' 고객님이 등록된 후 아직 활동 기록이 없습니다. 가벼운 안부 인사를 건네보세요.`,
        targetId: customer.id,
        targetType: 'customer',
      });
    } else {
      const daysSince = Math.floor(
        (now.getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSince > 14) {
        insights.push({
          type: 'URGENT',
          title: '관계 소홀 주의',
          message: `'${customer.name}' 고객님과 마지막 대화가 ${daysSince}일 전입니다. 리마인드 컨택이 필요한 시점입니다.`,
          targetId: customer.id,
          targetType: 'customer',
        });
      }
    }
  }

  // 2. 수주 임박 거래 분석 (Opportunity)
  for (const deal of data.deals) {
    if (deal.stage === 'negotiation' && (deal.probability || 0) >= 70) {
      insights.push({
        type: 'OPPORTUNITY',
        title: '클로징 임박',
        message: `'${deal.title}' 거래의 승률이 ${deal.probability}%로 매우 높습니다. 최종 계약서 서명을 독려해보세요.`,
        targetId: deal.id,
        targetType: 'deal',
      });
    }
    if (deal.stage === 'lead' && (deal.amount || 0) >= 10000000) {
      insights.push({
        type: 'TIP',
        title: 'VIP 리드 집중 관리',
        message: `'${deal.title}'은(는) 규모가 큰 거래입니다. 제안서 작성 시 기술적 요구사항을 더 상세히 검토하시는 걸 추천합니다.`,
        targetId: deal.id,
        targetType: 'deal',
      });
    }
  }

  // 3. 활동 빈도 분석 (Tip)
  if (data.activities.length < 5) {
    insights.push({
      type: 'TIP',
      title: '활동 기록 권장',
      message:
        '최근 활동 기록이 적습니다. 아주 사소한 미팅이나 통화 내역이라도 기록해두면 나중에 AI가 더 정확한 코칭을 해줄 수 있어요.',
    });
  }

  // 우선순위 정렬 및 개수 제한
  return insights
    .sort((a, b) => {
      const priority: Record<string, number> = { URGENT: 0, OPPORTUNITY: 1, TIP: 2 };
      return (priority[a.type] ?? 3) - (priority[b.type] ?? 3);
    })
    .slice(0, 5);
}
