import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>,
        ) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // 세션 갱신 (중요: 이렇게 해야 세션이 만료되지 않음)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 인증이 필요한 페이지에 비로그인 상태로 접근 시 리다이렉트
  const isAuthPage =
    request.nextUrl.pathname.includes('/login') || request.nextUrl.pathname.includes('/register');
  const isAppPage = request.nextUrl.pathname.includes('/ws/');

  if (!user && isAppPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/ko/login';
    return NextResponse.redirect(url);
  }

  // 로그인 상태에서 인증 페이지 접근 시 대시보드로 리다이렉트
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/ko/workspace-select';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
