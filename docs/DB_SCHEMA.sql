-- ============================================================
-- Crumi CRM — Complete Database Schema
-- Version: 1.0 (2026-03-15)
-- Database: Supabase PostgreSQL
-- 
-- 모든 테이블은 workspace_id 기반으로 데이터 격리
-- RLS (Row Level Security) 필수 적용
-- 날짜/시간은 timestamptz (UTC 저장)
-- 소프트 삭제: deleted_at 컬럼 사용
-- ============================================================


-- ============================================================
-- 1. 워크스페이스 & 멤버십
-- ============================================================

CREATE TABLE workspaces (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text NOT NULL,
  slug                    text UNIQUE NOT NULL,
  invite_code             text UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  logo_url                text,
  
  -- 플랜 & 결제
  plan                    text NOT NULL DEFAULT 'free',       -- free / pro / enterprise
  plan_status             text NOT NULL DEFAULT 'active',     -- active / past_due / suspended / cancelled
  billing_cycle           text DEFAULT 'monthly',             -- monthly / yearly
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  
  -- 설정
  locale                  text DEFAULT 'ko',
  timezone                text DEFAULT 'Asia/Seoul',
  
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE TABLE user_profiles (
  id                      uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name            text NOT NULL,
  email                   text NOT NULL,
  phone                   text,
  avatar_url              text,
  locale                  text DEFAULT 'ko',
  is_super_admin          boolean DEFAULT false,
  last_workspace_id       uuid REFERENCES workspaces(id),     -- 마지막 접속 워크스페이스
  created_at              timestamptz DEFAULT now()
);

CREATE TABLE workspace_members (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  role                    text NOT NULL DEFAULT 'member',     -- owner / admin / member
  status                  text NOT NULL DEFAULT 'pending',    -- pending / active / suspended / rejected
  
  invited_by              uuid REFERENCES auth.users(id),
  approved_by             uuid REFERENCES auth.users(id),
  approved_at             timestamptz,
  
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  
  UNIQUE(workspace_id, user_id)
);


-- ============================================================
-- 2. 고객 관리
-- ============================================================

CREATE TABLE customers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  name                    text NOT NULL,
  email                   text,
  phone                   text,
  company_name            text,
  position                text,
  tags                    text[] DEFAULT '{}',
  memo                    text,
  source                  text,
  
  created_by              uuid REFERENCES auth.users(id),
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  deleted_at              timestamptz
);

CREATE INDEX idx_customers_workspace ON customers(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_tags ON customers USING gin(tags);


-- ============================================================
-- 3. 프로젝트 관리
-- ============================================================

CREATE TABLE projects (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  name                    text NOT NULL,
  description             text,
  status                  text NOT NULL DEFAULT 'planning',
  -- planning / in_progress / on_hold / completed / cancelled
  
  start_date              date,
  end_date                date,
  budget                  integer,
  currency                text DEFAULT 'KRW',
  
  cooltime_days           integer DEFAULT 5,                  -- 프로젝트 쿨타임 (기본 5일)
  
  tags                    text[] DEFAULT '{}',
  created_by              uuid REFERENCES auth.users(id),
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  deleted_at              timestamptz
);

-- 프로젝트 ↔ 직원 (N:N)
CREATE TABLE project_members (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role                    text DEFAULT 'member',              -- lead / member / observer
  joined_at               timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- 프로젝트 ↔ 고객 (N:N)
CREATE TABLE project_customers (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  customer_id             uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  role                    text DEFAULT 'stakeholder',         -- stakeholder / decision_maker / contact
  added_at                timestamptz DEFAULT now(),
  UNIQUE(project_id, customer_id)
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id) WHERE deleted_at IS NULL;


-- ============================================================
-- 4. 영업 파이프라인 & 거래
-- ============================================================

CREATE TABLE pipelines (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name                    text NOT NULL,
  stages                  jsonb NOT NULL DEFAULT '[]',        -- [{name, order, color, cooltime_days}]
  is_default              boolean DEFAULT false,
  created_at              timestamptz DEFAULT now()
);

CREATE TABLE deals (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  customer_id             uuid REFERENCES customers(id),
  project_id              uuid REFERENCES projects(id),
  pipeline_id             uuid REFERENCES pipelines(id),
  stage                   text NOT NULL,
  
  title                   text NOT NULL,
  amount                  integer,
  currency                text DEFAULT 'KRW',
  probability             integer DEFAULT 50,                 -- 0~100%
  expected_close_date     date,
  
  assigned_to             uuid REFERENCES auth.users(id),
  created_by              uuid REFERENCES auth.users(id),
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  closed_at               timestamptz,
  deleted_at              timestamptz
);

CREATE INDEX idx_deals_workspace ON deals(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_project ON deals(project_id);


-- ============================================================
-- 5. 활동 기록
-- ============================================================

CREATE TABLE activities (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- 연결 대상 (1개 이상)
  customer_id             uuid REFERENCES customers(id),
  project_id              uuid REFERENCES projects(id),
  deal_id                 uuid REFERENCES deals(id),
  
  user_id                 uuid NOT NULL REFERENCES auth.users(id),
  type                    text NOT NULL,                      -- call / email / meeting / note / task
  title                   text NOT NULL,
  description             text,
  
  scheduled_at            timestamptz,
  completed_at            timestamptz,
  created_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_activities_workspace ON activities(workspace_id, created_at DESC);
CREATE INDEX idx_activities_project ON activities(project_id, created_at DESC);
CREATE INDEX idx_activities_customer ON activities(customer_id, created_at DESC);


-- ============================================================
-- 6. 쿨타임 & 넛지 시스템
-- ============================================================

CREATE TABLE cooltime_settings (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  target_type             text NOT NULL,                      -- 'project' / 'customer' / 'deal_stage'
  target_id               uuid,                               -- 특정 대상 ID (NULL이면 전체 기본값)
  deal_stage              text,                               -- deal_stage일 때 단계명
  
  cooltime_days           integer NOT NULL DEFAULT 5,
  
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now(),
  
  UNIQUE(workspace_id, target_type, target_id, deal_stage)
);

CREATE TABLE nudges (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  assigned_to             uuid NOT NULL REFERENCES auth.users(id),
  
  -- 넛지 대상
  target_type             text NOT NULL,                      -- 'project' / 'customer' / 'deal'
  project_id              uuid REFERENCES projects(id),
  customer_id             uuid REFERENCES customers(id),
  deal_id                 uuid REFERENCES deals(id),
  
  -- 내용
  urgency                 text NOT NULL DEFAULT 'info',       -- info / warning / urgent / critical
  title                   text NOT NULL,
  message                 text NOT NULL,
  suggestion              text,                               -- AI 제안 (Pro)
  ai_draft                text,                               -- AI 이메일 초안 (Pro)
  
  -- 상태
  status                  text NOT NULL DEFAULT 'pending',    -- pending / seen / acted / snoozed / dismissed
  snooze_until            timestamptz,
  acted_at                timestamptz,
  activity_id             uuid REFERENCES activities(id),     -- 조치 후 연결된 활동
  
  -- 메타
  days_overdue            integer NOT NULL,
  last_activity_at        timestamptz,
  
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE INDEX idx_nudges_dashboard ON nudges(assigned_to, status, urgency) WHERE status IN ('pending', 'seen');
CREATE INDEX idx_nudges_workspace ON nudges(workspace_id, created_at DESC);


-- ============================================================
-- 7. 기능 요청 & 투표
-- ============================================================

CREATE TABLE feature_requests (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid REFERENCES workspaces(id),
  user_id                 uuid NOT NULL REFERENCES auth.users(id),
  
  title                   text NOT NULL,
  description             text NOT NULL,
  category                text,                               -- customer / pipeline / project / ai / nudge / other
  status                  text DEFAULT 'open',                -- open / reviewing / approved / in_progress / done / rejected
  vote_count              integer DEFAULT 0,
  admin_response          text,
  
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE TABLE feature_votes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id              uuid NOT NULL REFERENCES feature_requests(id) ON DELETE CASCADE,
  user_id                 uuid NOT NULL REFERENCES auth.users(id),
  weight                  integer DEFAULT 1,                  -- Pro 사용자 3배
  created_at              timestamptz DEFAULT now(),
  UNIQUE(request_id, user_id)
);


-- ============================================================
-- 8. 결제 & 구독
-- ============================================================

CREATE TABLE subscription_events (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  event_type              text NOT NULL,
  -- created / renewed / past_due / suspended / cancelled / reactivated
  
  plan                    text NOT NULL,
  amount                  integer,
  currency                text DEFAULT 'KRW',
  stripe_event_id         text,
  metadata                jsonb DEFAULT '{}',
  created_at              timestamptz DEFAULT now()
);

CREATE TABLE payment_notifications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  type                    text NOT NULL,
  -- reminder_d7 / reminder_d1 / past_due / suspended / deletion_warning
  
  sent_to                 text NOT NULL,
  sent_at                 timestamptz DEFAULT now(),
  opened_at               timestamptz
);


-- ============================================================
-- 9. AI 사용 로그
-- ============================================================

CREATE TABLE ai_usage_logs (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            uuid REFERENCES workspaces(id),
  user_id                 uuid REFERENCES auth.users(id),
  
  model                   text NOT NULL,
  request_type            text NOT NULL,
  input_tokens            integer NOT NULL,
  output_tokens           integer NOT NULL,
  cost_usd                numeric(10, 6),
  
  created_at              timestamptz DEFAULT now()
);


-- ============================================================
-- 10. Super Admin 뷰
-- ============================================================

CREATE VIEW admin_workspace_overview AS
SELECT 
  w.id,
  w.name,
  w.slug,
  w.plan,
  w.plan_status,
  w.current_period_end,
  w.created_at,
  COUNT(DISTINCT wm.user_id) FILTER (WHERE wm.status = 'active')  AS active_members,
  COUNT(DISTINCT wm.user_id) FILTER (WHERE wm.status = 'pending') AS pending_members,
  COUNT(DISTINCT c.id)  AS customer_count,
  COUNT(DISTINCT p.id)  AS project_count,
  COUNT(DISTINCT d.id)  AS deal_count
FROM workspaces w
LEFT JOIN workspace_members wm ON w.id = wm.workspace_id
LEFT JOIN customers c          ON w.id = c.workspace_id AND c.deleted_at IS NULL
LEFT JOIN projects p           ON w.id = p.workspace_id AND p.deleted_at IS NULL
LEFT JOIN deals d              ON w.id = d.workspace_id AND d.deleted_at IS NULL
GROUP BY w.id;


-- ============================================================
-- 11. RLS Policies (워크스페이스 격리)
-- ============================================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE workspaces          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers           ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_customers   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines           ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooltime_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE nudges              ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_votes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

-- 워크스페이스 격리 헬퍼 함수
CREATE OR REPLACE FUNCTION user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT workspace_id FROM workspace_members
  WHERE user_id = auth.uid() AND status = 'active'
$$;

-- 워크스페이스 격리 정책 (주요 테이블 예시)
CREATE POLICY "ws_isolation" ON customers
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "ws_isolation" ON projects
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "ws_isolation" ON deals
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "ws_isolation" ON activities
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

CREATE POLICY "ws_isolation" ON nudges
  FOR ALL USING (workspace_id IN (SELECT user_workspace_ids()));

-- 넛지: 본인에게 할당된 것만 조회 (추가 정책)
CREATE POLICY "nudge_assigned" ON nudges
  FOR SELECT USING (assigned_to = auth.uid());
