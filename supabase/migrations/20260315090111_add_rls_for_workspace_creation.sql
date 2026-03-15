-- 워크스페이스 생성 및 멤버십 관리를 위한 RLS 정책 (최종 최적화)

-- 1. workspaces 테이블 정책
DROP POLICY IF EXISTS "Enable insert for workspaces" ON workspaces;
CREATE POLICY "Enable insert for workspaces"
    ON workspaces FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Enable select for workspaces" ON workspaces;
CREATE POLICY "Enable select for workspaces"
    ON workspaces FOR SELECT TO authenticated
    USING (true);

-- 2. workspace_members 테이블 정책
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable insert for workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Enable select for workspace members" ON workspace_members;
DROP POLICY IF EXISTS "Enable update for workspace members" ON workspace_members;

-- 본인의 멤버십 추가 허가 (워크스페이스 생성 시 본인을 owner로 등록 가능하게 함)
CREATE POLICY "Enable insert for members"
    ON workspace_members FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 멤버십 조회 허가 (본인 것이거나, 본인이 속한 워크스페이스의 다른 멤버인 경우)
CREATE POLICY "Enable select for members"
    ON workspace_members FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR 
        workspace_id IN (SELECT user_workspace_ids())
    );

-- 멤버십 수정 허가 (본인이 owner/admin인 경우에만)
CREATE POLICY "Enable update for members"
    ON workspace_members FOR UPDATE TO authenticated
    USING (
        workspace_id IN (
            SELECT workspace_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );
