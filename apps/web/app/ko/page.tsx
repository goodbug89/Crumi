import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';

export default async function Home() {
  const t = await getTranslations('landing');
  const tCommon = await getTranslations('common');

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* 네비게이션 */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center text-white text-xs font-bold transition-colors group-hover:bg-emerald-600">
            C
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Crumi</span>
        </div>
        <div className="flex items-center gap-8">
          <Link
            href="/ko/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {t('nav.login')}
          </Link>
          <Link
            href="/ko/register"
            className="h-10 px-6 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-sm"
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-widest border border-emerald-100/50">
              {t('badge')}
            </div>

            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05]">
              {t('heroTitle1')} <br />
              <span className="text-emerald-600">{t('heroTitle2')}</span>
            </h1>

            <p className="max-w-lg text-lg sm:text-xl leading-relaxed text-slate-500 font-medium">
              {t('heroDescription')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/ko/register"
                className="inline-flex h-14 items-center justify-center rounded-lg bg-emerald-600 px-10 text-base font-bold text-white shadow-xl shadow-emerald-600/10 transition-all hover:bg-emerald-700 active:scale-[0.98]"
              >
                {t('ctaPrimary')}
              </Link>
              <Link
                href="/ko/login"
                className="inline-flex h-14 items-center justify-center rounded-lg border border-slate-200 bg-white px-10 text-base font-bold text-slate-900 transition-all hover:bg-slate-50 active:scale-[0.98]"
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
    <div className="group relative flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-8 transition-all hover:border-emerald-200 hover:shadow-xl hover:shadow-slate-200/50">
      <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center text-2xl group-hover:bg-emerald-50 transition-colors">
        {emoji}
      </div>
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
