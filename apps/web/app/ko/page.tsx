import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

export default async function Home() {
  const t = await getTranslations('landing');
  const tCommon = await getTranslations('common');

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="text-xl font-bold tracking-tight">Crumi</span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/ko/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            {t('nav.login')}
          </Link>
          <Link
            href="/ko/register"
            className="h-10 px-5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            {t('nav.start')}
          </Link>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* 히어로 배경 장식 */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px]" />

        <div className="flex max-w-6xl w-full flex-col lg:flex-row items-center gap-12 px-6 py-20 z-10">
          {/* 캐릭터 및 시각 요소 */}
          <div className="flex-1 flex flex-col items-center lg:items-end order-2 lg:order-1">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-[450px] lg:h-[450px] animate-float">
              <Image
                src="/crumi_character_mascot.png"
                alt="Crumi Mascot"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* 텍스트 영역 */}
          <div className="flex-1 flex flex-col items-center lg:items-start gap-8 text-center lg:text-left order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              {t('badge')}
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
              {t('heroTitle1')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {t('heroTitle2')}
              </span>
            </h1>

            <p className="max-w-md text-lg sm:text-xl leading-relaxed text-muted-foreground">
              {t('heroDescription')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/ko/register"
                className="inline-flex h-14 items-center justify-center rounded-2xl bg-primary px-10 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
              >
                {t('ctaPrimary')}
              </Link>
              <Link
                href="/ko/login"
                className="inline-flex h-14 items-center justify-center rounded-2xl border border-border bg-surface px-10 text-lg font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
              >
                {t('ctaSecondary')}
              </Link>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px]"
                  >
                    👤
                  </div>
                ))}
              </div>
              <span>{t('socialProof')}</span>
            </div>
          </div>
        </div>

        {/* 핵심 기능 카드 세션 */}
        <div className="w-full max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            emoji="👥"
            title={t('features.customerManagement.title')}
            desc={t('features.customerManagement.description')}
          />
          <FeatureCard
            emoji="🔔"
            title={t('features.smartNudge.title')}
            desc={t('features.smartNudge.description')}
          />
          <FeatureCard
            emoji="📊"
            title={t('features.visualPipeline.title')}
            desc={t('features.visualPipeline.description')}
          />
        </div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-[10px] text-white">
              C
            </div>
            <span className="text-sm font-bold">Crumi</span>
          </div>
          <div className="text-sm text-muted-foreground">{tCommon('copyright')}</div>
          <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
            <Link href="#">{tCommon('terms')}</Link>
            <Link href="#">{tCommon('privacy')}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="group relative flex flex-col gap-4 rounded-3xl border border-border bg-surface p-8 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl group-hover:bg-primary/10 transition-colors">
        {emoji}
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="text-base text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
