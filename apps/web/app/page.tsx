import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <main className="flex max-w-2xl flex-col items-center gap-8 px-6 py-16 text-center">
        {/* 크루미 캐릭터 (임시 이모지) */}
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-secondary/20 text-6xl">
          💬
        </div>

        {/* 타이틀 */}
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Crumi
          </h1>
          <p className="text-lg text-muted-foreground">
            Your Sales Buddy — 함께 성장하는 영업 파트너
          </p>
        </div>

        {/* 설명 */}
        <p className="max-w-md text-base leading-relaxed text-muted-foreground">
          사용자 주도로 진화하는 글로벌 CRM 플랫폼.
          고객 관리, 프로젝트 추적, 영업 파이프라인을
          하나의 공간에서 관리하세요.
        </p>

        {/* CTA 버튼 */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/ko/register"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/ko/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface px-8 text-base font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
          >
            로그인
          </Link>
        </div>

        {/* 핵심 기능 */}
        <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
          <FeatureCard
            emoji="👥"
            title="고객 관리"
            desc="모든 고객 정보를 한 곳에서"
          />
          <FeatureCard
            emoji="🔔"
            title="스마트 넛지"
            desc="방치되는 고객이 없도록"
          />
          <FeatureCard
            emoji="📊"
            title="파이프라인"
            desc="영업 단계를 시각적으로"
          />
        </div>
      </main>

      {/* 푸터 */}
      <footer className="py-6 text-sm text-muted-foreground">
        © 2026 Crumi. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md">
      <span className="text-3xl">{emoji}</span>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
