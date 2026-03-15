-- 1. workspaces 생성 허용
CREATE POLICY "Enable insert for workspaces"
    ON workspaces FOR INSERT TO authenticated
    WITH CHECK (true);

-- 2. workspaces 조회 허용 (MVP용, 멤버 확인 우회 임시용)
CREATE POLICY "Enable select for workspaces"
    ON workspaces FOR SELECT TO authenticated
    USING (true);

-- 3. workspaces 수정/삭제는 owner/admin 전용
CREATE POLICY "Enable update for workspaces"
    ON workspaces FOR UPDATE TO authenticated
    USING (
      id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    );

-- 4. workspace_members 본인 추가 및 권한자 추가 허용
CREATE POLICY "Enable insert for workspace members"
    ON workspace_members FOR INSERT TO authenticated
    WITH CHECK (
      auth.uid() = user_id 
      OR 
      workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    );

-- 5. workspace_members 조회 허용
CREATE POLICY "Enable select for workspace members"
    ON workspace_members FOR SELECT TO authenticated
    USING (
      auth.uid() = user_id 
      OR 
      workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid()
      )
    );

-- 6. workspace_members 수정 허용
CREATE POLICY "Enable update for workspace members"
    ON workspace_members FOR UPDATE TO authenticated
    USING (
      auth.uid() = user_id 
      OR 
      workspace_id IN (
        SELECT workspace_id FROM workspace_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    );
