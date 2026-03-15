-- project_customers 및 기타 누락된 테이블에 대한 RLS 정책 추가 (중복 방지 버전)

-- 1. project_customers (프로젝트-고객 연결)
DROP POLICY IF EXISTS "ws_isolation" ON project_customers;
CREATE POLICY "ws_isolation" ON project_customers
    FOR ALL TO authenticated
    USING (
        project_id IN (
            SELECT id FROM projects 
            WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active')
        )
    )
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects 
            WHERE workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active')
        )
    );

-- 2. pipelines (파이프라인 설정)
DROP POLICY IF EXISTS "ws_isolation" ON pipelines;
CREATE POLICY "ws_isolation" ON pipelines
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'))
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'));

-- 3. activities (활동 기록)
DROP POLICY IF EXISTS "ws_isolation" ON activities;
CREATE POLICY "ws_isolation" ON activities
    FOR ALL TO authenticated
    USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'))
    WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND status = 'active'));

-- 4. feature_requests & votes (기능 요청)
DROP POLICY IF EXISTS "Enable select for feature_requests" ON feature_requests;
CREATE POLICY "Enable select for feature_requests" ON feature_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for feature_requests" ON feature_requests;
CREATE POLICY "Enable insert for feature_requests" ON feature_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Enable all for feature_votes" ON feature_votes;
CREATE POLICY "Enable all for feature_votes" ON feature_votes FOR ALL TO authenticated USING (auth.uid() = user_id);
