-- Super Admin 확인 함수
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM user_profiles WHERE id = auth.uid()),
    false
  )
$$;
