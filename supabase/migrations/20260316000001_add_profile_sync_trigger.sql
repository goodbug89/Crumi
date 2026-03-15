-- ============================================================
-- Crumi CRM — User Profile Sync Trigger
-- Version: 1.2 (2026-03-16)
--
-- 1. handle_new_user 함수: auth.users 가입 시 실행
-- 2. on_auth_user_created 트리거 추가
-- 3. 기존 사용자 백필 (Backfill)
-- ============================================================

-- ----------------------------------------
-- 1. 가입 시 프로필 자동 생성 함수
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url;
    
  RETURN new;
END;
$$;

-- ----------------------------------------
-- 2. 트리거 설정
-- ----------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------
-- 3. 기존 사용자 백필 (이미 가입한 사용자들 처리)
-- ----------------------------------------
INSERT INTO public.user_profiles (id, display_name, email, avatar_url)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)), 
  email,
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
