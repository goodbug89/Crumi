-- ============================================================
-- Crumi CRM — Force Sync User Profiles
-- Version: 1.3 (2026-03-16)
--
-- 기존 '사용자'로 표시되는 프로필들을 실제 이름으로 강제 업데이트
-- ============================================================

UPDATE public.user_profiles
SET 
  display_name = COALESCE(
    (SELECT raw_user_meta_data->>'display_name' FROM auth.users WHERE auth.users.id = public.user_profiles.id),
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE auth.users.id = public.user_profiles.id),
    split_part(email, '@', 1)
  )
WHERE display_name = '사용자' OR display_name IS NULL OR display_name = '';

-- 트리거 함수 보강 (가입 시 더 확실한 이름 추출)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name', 
      new.raw_user_meta_data->>'full_name', 
      split_part(new.email, '@', 1),
      'User'
    ),
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
