-- ============================================================
-- Crumi CRM — RLS 정책 보완 + RPC 함수 추가
-- Version: 1.1 (2026-03-16)
--
-- 1. 누락된 6개 테이블 RLS 정책 추가
-- 2. increment_request_vote RPC 함수
-- 3. remove_workspace_member RPC 함수
-- ============================================================


-- ============================================================
-- 1. RLS 정책 보완 (6개 테이블)
-- ============================================================

-- ----------------------------------------
-- 1-1. user_profiles
-- ----------------------------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 같은 워크스페이스 멤버의 프로필만 조회 가능
DROP POLICY IF EXISTS "profiles_select_ws_members" ON user_profiles;
CREATE POLICY "profiles_select_ws_members" ON user_profiles
    FOR SELECT TO authenticated
    USING (
        -- 자기 자신의 프로필
        id = auth.uid()
        OR
        -- 같은 워크스페이스에 속한 멤버
        id IN (
            SELECT wm2.user_id
            FROM workspace_members wm1
            JOIN workspace_members wm2 ON wm1.workspace_id = wm2.workspace_id
            WHERE wm1.user_id = auth.uid()
              AND wm1.status = 'active'
              AND wm2.status = 'active'
        )
    );

-- 자기 자신의 프로필만 수정 가능
DROP POLICY IF EXISTS "profiles_update_self" ON user_profiles;
CREATE POLICY "profiles_update_self" ON user_profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 자기 자신의 프로필 INSERT (회원가입 시)
DROP POLICY IF EXISTS "profiles_insert_self" ON user_profiles;
CREATE POLICY "profiles_insert_self" ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (id = auth.uid());

-- ----------------------------------------
-- 1-2. project_members (projects.workspace_id 기반 워크스페이스 격리)
-- ----------------------------------------
DROP POLICY IF EXISTS "ws_isolation" ON project_members;
CREATE POLICY "ws_isolation" ON project_members
    FOR ALL TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects
            WHERE workspace_id IN (SELECT user_workspace_ids())
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects
            WHERE workspace_id IN (SELECT user_workspace_ids())
        )
    );

-- ----------------------------------------
-- 1-3. cooltime_settings (워크스페이스 격리)
-- ----------------------------------------
DROP POLICY IF EXISTS "ws_isolation" ON cooltime_settings;
CREATE POLICY "ws_isolation" ON cooltime_settings
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT user_workspace_ids()))
    WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- ----------------------------------------
-- 1-4. subscription_events (워크스페이스 격리)
-- ----------------------------------------
DROP POLICY IF EXISTS "ws_isolation" ON subscription_events;
CREATE POLICY "ws_isolation" ON subscription_events
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT user_workspace_ids()))
    WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- ----------------------------------------
-- 1-5. payment_notifications (워크스페이스 격리)
-- ----------------------------------------
DROP POLICY IF EXISTS "ws_isolation" ON payment_notifications;
CREATE POLICY "ws_isolation" ON payment_notifications
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT user_workspace_ids()))
    WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));

-- ----------------------------------------
-- 1-6. ai_usage_logs (워크스페이스 격리)
-- ----------------------------------------
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ws_isolation" ON ai_usage_logs;
CREATE POLICY "ws_isolation" ON ai_usage_logs
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT user_workspace_ids()))
    WITH CHECK (workspace_id IN (SELECT user_workspace_ids()));


-- ============================================================
-- 2. increment_request_vote RPC 함수
-- ============================================================
-- feature_requests.vote_count를 원자적으로 1 증가
-- ============================================================

CREATE OR REPLACE FUNCTION increment_request_vote(request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE feature_requests
    SET vote_count = vote_count + 1,
        updated_at = now()
    WHERE id = request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'feature_request not found: %', request_id;
    END IF;
END;
$$;


-- ============================================================
-- 3. remove_workspace_member RPC 함수
-- ============================================================
-- 워크스페이스에서 멤버를 제외 (status → 'removed')
-- 조건:
--   - 호출자가 해당 워크스페이스의 owner 또는 admin이어야 함
--   - 자기 자신은 제외 불가
--   - owner는 제외 불가
-- ============================================================

CREATE OR REPLACE FUNCTION remove_workspace_member(
    p_workspace_id uuid,
    p_target_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_caller_role text;
    v_target_role text;
BEGIN
    -- 호출자의 역할 확인
    SELECT role INTO v_caller_role
    FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND status = 'active';

    IF v_caller_role IS NULL OR v_caller_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION '권한이 없습니다. owner 또는 admin만 멤버를 제외할 수 있습니다.';
    END IF;

    -- 자기 자신 제외 불가
    IF p_target_user_id = auth.uid() THEN
        RAISE EXCEPTION '자기 자신을 제외할 수 없습니다.';
    END IF;

    -- 대상 멤버의 역할 확인
    SELECT role INTO v_target_role
    FROM workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = p_target_user_id
      AND status = 'active';

    IF v_target_role IS NULL THEN
        RAISE EXCEPTION '해당 워크스페이스에 활성 멤버가 아닙니다.';
    END IF;

    -- owner는 제외 불가
    IF v_target_role = 'owner' THEN
        RAISE EXCEPTION 'owner는 제외할 수 없습니다.';
    END IF;

    -- 멤버 상태를 'removed'로 변경
    UPDATE workspace_members
    SET status = 'removed',
        updated_at = now()
    WHERE workspace_id = p_workspace_id
      AND user_id = p_target_user_id
      AND status = 'active';
END;
$$;
