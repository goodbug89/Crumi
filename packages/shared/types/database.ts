/** Crumi CRM — Database 기반 TypeScript 타입 정의 */

// ============================================================
// 공통 타입
// ============================================================

export type UUID = string;

export type Timestamps = {
  created_at: string;
  updated_at?: string;
};

export type SoftDelete = {
  deleted_at: string | null;
};

// ============================================================
// 1. 워크스페이스 & 멤버십
// ============================================================

export type WorkspacePlan = 'free' | 'pro' | 'enterprise';
export type WorkspacePlanStatus = 'active' | 'past_due' | 'suspended' | 'cancelled';
export type BillingCycle = 'monthly' | 'yearly';
export type MemberRole = 'owner' | 'admin' | 'member';
export type MemberStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface Workspace extends Timestamps {
  id: UUID;
  name: string;
  slug: string;
  invite_code: string;
  logo_url: string | null;
  plan: WorkspacePlan;
  plan_status: WorkspacePlanStatus;
  billing_cycle: BillingCycle;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  locale: string;
  timezone: string;
}

export interface UserProfile {
  id: UUID;
  display_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  locale: string;
  is_super_admin: boolean;
  last_workspace_id: UUID | null;
  created_at: string;
}

export interface WorkspaceMember extends Timestamps {
  id: UUID;
  workspace_id: UUID;
  user_id: UUID;
  role: MemberRole;
  status: MemberStatus;
  invited_by: UUID | null;
  approved_by: UUID | null;
  approved_at: string | null;
}

// ============================================================
// 2. 고객 관리
// ============================================================

export interface Customer extends Timestamps, SoftDelete {
  id: UUID;
  workspace_id: UUID;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  position: string | null;
  tags: string[];
  memo: string | null;
  source: string | null;
  created_by: UUID | null;
}

// ============================================================
// 3. 프로젝트 관리
// ============================================================

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type ProjectMemberRole = 'lead' | 'member' | 'observer';
export type ProjectCustomerRole = 'stakeholder' | 'decision_maker' | 'contact';

export interface Project extends Timestamps, SoftDelete {
  id: UUID;
  workspace_id: UUID;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  currency: string;
  cooltime_days: number;
  tags: string[];
  created_by: UUID | null;
}

export interface ProjectMember {
  id: UUID;
  project_id: UUID;
  user_id: UUID;
  role: ProjectMemberRole;
  joined_at: string;
}

export interface ProjectCustomer {
  id: UUID;
  project_id: UUID;
  customer_id: UUID;
  role: ProjectCustomerRole;
  added_at: string;
}

// ============================================================
// 4. 파이프라인 & 거래
// ============================================================

export interface PipelineStage {
  name: string;
  order: number;
  color: string;
  cooltime_days: number;
}

export interface Pipeline {
  id: UUID;
  workspace_id: UUID;
  name: string;
  stages: PipelineStage[];
  is_default: boolean;
  created_at: string;
}

export interface Deal extends Timestamps, SoftDelete {
  id: UUID;
  workspace_id: UUID;
  customer_id: UUID | null;
  project_id: UUID | null;
  pipeline_id: UUID | null;
  stage: string;
  title: string;
  amount: number | null;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  assigned_to: UUID | null;
  created_by: UUID | null;
  closed_at: string | null;
}

// ============================================================
// 5. 활동 기록
// ============================================================

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';

export interface Activity {
  id: UUID;
  workspace_id: UUID;
  customer_id: UUID | null;
  project_id: UUID | null;
  deal_id: UUID | null;
  user_id: UUID;
  type: ActivityType;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

// ============================================================
// 6. 넛지 시스템
// ============================================================

export type NudgeTargetType = 'project' | 'customer' | 'deal';
export type NudgeUrgency = 'info' | 'warning' | 'urgent' | 'critical';
export type NudgeStatus = 'pending' | 'seen' | 'acted' | 'snoozed' | 'dismissed';

export interface Nudge extends Timestamps {
  id: UUID;
  workspace_id: UUID;
  assigned_to: UUID;
  target_type: NudgeTargetType;
  project_id: UUID | null;
  customer_id: UUID | null;
  deal_id: UUID | null;
  urgency: NudgeUrgency;
  title: string;
  message: string;
  suggestion: string | null;
  ai_draft: string | null;
  status: NudgeStatus;
  snooze_until: string | null;
  acted_at: string | null;
  activity_id: UUID | null;
  days_overdue: number;
  last_activity_at: string | null;
}

// ============================================================
// 7. 기능 요청
// ============================================================

export type FeatureRequestStatus = 'open' | 'reviewing' | 'approved' | 'in_progress' | 'done' | 'rejected';
export type FeatureCategory = 'customer' | 'pipeline' | 'project' | 'ai' | 'nudge' | 'other';

export interface FeatureRequest extends Timestamps {
  id: UUID;
  workspace_id: UUID | null;
  user_id: UUID;
  title: string;
  description: string;
  category: FeatureCategory | null;
  status: FeatureRequestStatus;
  vote_count: number;
  admin_response: string | null;
}

export interface FeatureVote {
  id: UUID;
  request_id: UUID;
  user_id: UUID;
  weight: number;
  created_at: string;
}
