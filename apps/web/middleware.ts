import { updateSession } from '@/lib/supabase/middleware';
import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware({
  locales: ['ko', 'en'],
  defaultLocale: 'ko',
});

export async function middleware(request: NextRequest) {
  // 1. Supabase Auth 및 Session 검증
  const response = await updateSession(request);

  // 리다이렉트 응답이면 그대로 반환
  if (response.headers.get('location')) {
    return response;
  }

  // 2. API 경로는 다국어 처리를 건너뜀 (404 방지)
  if (request.nextUrl.pathname.startsWith('/api')) {
    return response;
  }

  // 3. next-intl 다국어 라우팅 미들웨어 실행
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * 모든 요청 경로에 미들웨어 적용하되 다음은 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - 정적 자원 (svg, png 등)
     *
     * 주의: 다국어(i18n) 설정 시에는 /(ko|en)/... 와 같은 패턴도 포함해야 합니다.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
