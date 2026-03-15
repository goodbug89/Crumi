import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Turborepo 패키지 사용 설정
  transpilePackages: ['@crumi/shared', '@crumi/design-tokens'],

  // React Strict Mode (추천)
  reactStrictMode: true,

  // 이미지 도메인 허용이 필요하다면 추가 (Supabase Storage 등)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
