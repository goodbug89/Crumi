import { getRequestConfig } from 'next-intl/server';

export const locales = ['ko', 'en'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || 'ko';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
