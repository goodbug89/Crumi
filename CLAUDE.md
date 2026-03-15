모든 대답은 한글로
# Crumi (크루미) — Global CRM Platform

> "Your Sales Buddy" — 함께 성장하는 영업 파트너

## 1. Project Overview

Crumi는 중소기업을 위한 고객관리(CRM) 및 영업관리 플랫폼입니다.
모바일과 웹에서 동시에 사용 가능하며, 사용자들이 직접 기능을 요청하고 투표하여
제품의 방향을 결정하는 "사용자 주도 진화 모델"을 핵심 차별점으로 합니다.

| 항목 | 값 |
|------|-----|
| 서비스명 | Crumi (크루미) — CRM + Buddy |
| 도메인 | crumi.com |
| Repository | github.com/goodbug89/Crumi |
| IDE | Google Antigravity (Agent-First) |
| 수익 모델 | Freemium — v1.0 무료, v2.0부터 유료 기능 추가 |

### 핵심 차별점
1. **사용자 주도 진화**: 기능 요청 게시판 + 투표 + 투명 로드맵
2. **쿨타임 & 넛지**: 프로젝트/고객/거래에 활동 주기를 설정, 방치 시 자동으로 다음 행동 제안
3. **한국 비즈니스 최적화**: 카카오톡 연동, 명함 스캔 → CRM 자동 등록
4. **AI 영업 코치**: 고객별 맞춤 전략 제안, 이메일 초안 작성
5. **워크스페이스 기반**: 팀/부서를 워크스페이스로 분리하여 심플하게 관리

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend (Web) | Next.js 15 + React 19 + TypeScript | Vercel 배포 |
| Mobile | React Native + Expo | iOS/Android 동시 개발 |
| Backend + DB | Supabase (PostgreSQL) | Auth, Storage, Realtime |
| Styling | Tailwind CSS + shadcn/ui | 둥근 친근한 디자인 |
| i18n | next-intl | 처음부터 다국어 구조 |
| AI | Smart Routing (DeepSeek 70% + Claude Sonnet 20% + Opus 10%) | 비용 최적화 |
| Email | Resend | 트랜잭션 + 넛지 이메일 |
| Payments | Stripe (+ Paddle for EU) | 글로벌 결제 + 세금 자동화 |
| Analytics | PostHog | 사용자 행동 분석 |
| Error Tracking | Sentry | 에러 모니터링 |
| Storage | Supabase Storage + Cloudflare R2 | 파일/이미지 저장 |
| IDE | Google Antigravity | Agent-First 개발 |
| VCS | GitHub + Actions | CI/CD |
| Monorepo | Turborepo | 패키지 관리 |

### 초기 월 서버 비용
- 사용자 0~500명: **$0~$2/월** (도메인 비용만)
- 사용자 500~2,000명: **$25~$50/월** (Supabase Pro)
- 사용자 2,000~10,000명: **$100~$300/월**
- 사용자 10,000명+: **$500+/월** (AWS/GCP 마이그레이션 검토)

---

## 3. IDE & Agent System

### Google Antigravity 설정

| 설정 | 값 |
|------|-----|
| 개발 모드 | Agent-Assisted (권장) |
| 복잡한 기능 | Plan Mode (계획 Artifact 먼저 생성) |
| 단순 수정 | Fast Mode (즉시 실행) |
| 병렬 작업 | Manager View에서 최대 5개 에이전트 동시 실행 |
| AI 모델 | Gemini 3 Pro (기본) + Claude Sonnet 4.6 (복잡한 로직) |
| Terminal Policy | Agent-Assisted + Allow List |
| Allow List | npm, npx, node, git, supabase |

### 에이전트 구성 (7개)

| Agent | Antigravity Skill | 역할 | 모델 |
|-------|-------------------|------|------|
| orchestrator | Manager View (내장) | 작업 분배, 리뷰, 아키텍처 | Gemini 3 Pro |
| frontend | frontend-dev | Next.js, React, 페이지, i18n | Claude Sonnet 4.6 |
| backend | backend-dev | Supabase, DB, RLS, Edge Functions | Claude Sonnet 4.6 |
| mobile | mobile-dev | React Native, Expo | Gemini 3 Pro |
| designer | designer | UI/UX, 디자인 토큰, 크루미 캐릭터 | Gemini 3 Pro |
| ai-coach | ai-coach | AI 영업 코치, 프롬프트, 모델 라우팅 | Claude Sonnet 4.6 |
| qa | qa-tester | 테스트, 접근성, i18n 검증, 성능 | Gemini 3 Pro |

상세 에이전트 정의: `.agents/AGENTS.md` 참조

### Agent Workflow
```
Manager View 작업 생성
  → Orchestrator가 Plan Mode로 계획 Artifact 생성
  → 개발자 리뷰 & 피드백
  → 에이전트 병렬 디스패치 (독립 작업 최대 5개 동시)
  → 각 에이전트 Artifact 생성 (diff, 스크린샷, 테스트 결과)
  → QA 에이전트 검증
  → PR 생성 → 리뷰 → develop 머지
```

---

## 4. Project Structure

```
crumi/
├── .agents/                        # Antigravity 에이전트 스킬
│   ├── skills/
│   │   ├── frontend-dev/SKILL.md
│   │   ├── backend-dev/SKILL.md
│   │   ├── mobile-dev/SKILL.md
│   │   ├── designer/
│   │   │   ├── SKILL.md
│   │   │   └── resources/
│   │   │       ├── color-tokens.json
│   │   │       └── crumi-character-guide.md
│   │   ├── ai-coach/
│   │   │   ├── SKILL.md
│   │   │   └── resources/prompt-templates.md
│   │   ├── qa-tester/SKILL.md
│   │   └── i18n-check/
│   │       ├── SKILL.md
│   │       └── resources/check-i18n.js
│   └── AGENTS.md
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   └── deploy.yml
│   └── ISSUE_TEMPLATE/
│       ├── feature.md
│       └── bug.md
├── apps/
│   ├── web/                        # Next.js 웹 앱
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (auth)/
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   └── join/          # 워크스페이스 가입 신청
│   │   │   │   ├── (app)/
│   │   │   │   │   └── ws/[slug]/     # 워크스페이스 스코프
│   │   │   │   │       ├── dashboard/  # 오늘의 할 일
│   │   │   │   │       ├── customers/
│   │   │   │   │       ├── projects/
│   │   │   │   │       │   ├── page.tsx
│   │   │   │   │       │   └── [id]/
│   │   │   │   │       │       ├── page.tsx      # 개요
│   │   │   │   │       │       ├── customers/
│   │   │   │   │       │       ├── team/
│   │   │   │   │       │       ├── deals/
│   │   │   │   │       │       └── activities/
│   │   │   │   │       ├── pipeline/
│   │   │   │   │       ├── requests/      # 기능 요청 게시판
│   │   │   │   │       └── settings/
│   │   │   │   │           ├── workspace/
│   │   │   │   │           ├── members/   # 멤버 관리/승인
│   │   │   │   │           └── billing/   # 결제 관리
│   │   │   │   └── (admin)/               # Super Admin only
│   │   │   │       ├── workspaces/
│   │   │   │       ├── billing/
│   │   │   │       └── analytics/
│   │   │   └── api/
│   │   ├── components/
│   │   │   ├── ui/             # shadcn/ui 기반
│   │   │   ├── workspace/      # 워크스페이스 전환기
│   │   │   ├── customers/
│   │   │   ├── projects/
│   │   │   ├── pipeline/
│   │   │   ├── dashboard/      # 오늘의 할 일, 넛지 카드
│   │   │   ├── requests/       # 기능 요청 게시판
│   │   │   └── crumi/          # 크루미 캐릭터
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   ├── ai/
│   │   │   ├── nudge/          # 넛지 엔진 클라이언트
│   │   │   └── i18n/
│   │   └── messages/           # i18n 번역 파일
│   │       ├── ko.json
│   │       ├── en.json
│   │       └── ja.json
│   └── mobile/                 # React Native 앱
│       └── src/
├── packages/
│   ├── shared/                 # 웹/모바일 공유 코드
│   │   ├── types/              # DB 타입 (supabase gen types)
│   │   ├── validators/         # Zod 스키마
│   │   └── utils/
│   ├── supabase/               # Supabase 설정
│   │   ├── migrations/         # DB 마이그레이션 SQL
│   │   ├── seed/
│   │   └── functions/          # Edge Functions
│   │       ├── nudge-engine/   # 쿨타임 스캔 + 넛지 생성
│   │       ├── ai-coach/       # AI 영업 코치
│   │       ├── subscription/   # 결제 만료 자동화
│   │       └── ocr/            # 명함 스캔 OCR
│   └── design-tokens/
│       ├── colors.ts
│       ├── typography.ts
│       ├── spacing.ts
│       └── crumi-variants.ts
├── docs/
│   ├── PRE_WORK_CHECKLIST.md   # 사전 준비 체크리스트
│   └── DB_SCHEMA.sql           # 전체 DB 스키마
├── CLAUDE.md                   # 이 파일
├── turbo.json
└── package.json
```

---

## 5. Core Concepts

### 5.1 워크스페이스 (Workspace)

**워크스페이스 = 프로젝트를 공유하는 독립된 공간**

- 1 워크스페이스 = 1 공유 공간 (같은 멤버는 모든 프로젝트/고객/거래 공유)
- 1인 다중 워크스페이스 가능 (Slack 워크스페이스와 동일한 개념)
- 워크스페이스 간 데이터 완전 분리 (결제/설정도 독립)
- 팀 분리가 필요하면 워크스페이스를 나눈다 (내부 팀/부서 개념 없음)

| 조직 유형 | 워크스페이스 구성 |
|----------|-----------------|
| 1인 사업자 | "홍길동 컨설팅" 1개 |
| 소기업 (10명) | "ABC컴퍼니" 1개 |
| 중견기업 (팀 분리) | "한빛 공공팀" + "한빛 기업팀" 2개 |
| 프리랜서 + 회사원 | "개인 컨설팅" + "회사 영업팀" 2개 |

**역할 체계 (3단계)**

| 역할 | 인원 | 권한 |
|------|------|------|
| owner | 1명 (양도 가능) | 모든 권한 + 워크스페이스 삭제 + owner 양도 |
| admin | N명 | 멤버 승인/거절, 역할 변경, 결제 관리, 설정 변경 |
| member | N명 | 프로젝트/고객/거래 CRUD, 워크스페이스 내 모든 데이터 조회 |

**멤버 가입 플로우**: 신청자가 워크스페이스 코드/초대 링크 입력 → owner/admin에게 알림 → 승인/거절 → 활성화

**워크스페이스 전환기**: 사이드바 최상단, 드롭다운으로 전환. 마지막 접속 워크스페이스 자동 기억.

### 5.2 프로젝트 관리 (Project Management)

- 프로젝트 CRUD (이름, 설명, 상태, 기간, 예산)
- 고객 N명 + 직원 N명이 참여 (N:N 관계)
- 고객 역할: stakeholder / decision_maker / contact
- 직원 역할: lead / member / observer
- 거래(Deal)와 활동(Activity)을 프로젝트에 연결 가능
- 상태: planning → in_progress → on_hold → completed / cancelled

### 5.3 쿨타임 & 넛지 시스템 (Cooltime & Nudge)

"방치되는 프로젝트/고객이 없도록, 크루미가 매일 할 일을 알려줍니다"

**쿨타임**: 프로젝트/고객/거래에 설정하는 "최소 활동 주기".
마지막 활동 이후 쿨타임이 지나면 넛지(행동 제안) 발생.

| 대상 | 기본 쿨타임 | 설명 |
|------|------------|------|
| 프로젝트 | 5일 | 프로젝트 내 모든 활동 추적 |
| 고객 | 7일 (VIP: 3일) | 개별 고객 관리 |
| 거래 | 단계별 차등 | 초기 7일, 제안 3일, 계약 1일 |

**넛지 긴급도 에스컬레이션**

| 단계 | 조건 | 알림 대상 | 크루미 상태 |
|------|------|----------|------------|
| info | 쿨타임 80% 경과 | 담당자 | 기본(초록) |
| warning | 100% 초과 | 담당자 | 알림(코랄) |
| urgent | 200% 초과 | 담당자 + admin | 알림(코랄) + 푸시 |
| critical | 400% 초과 | 담당자 + admin + 대시보드 고정 | 슬픔(회색) + 이메일 |

**넛지 조치 옵션**: AI 이메일 작성(Pro), 전화 기록, 미팅 잡기, 메모 남기기, 다음에(Snooze), 무시(Dismiss)

**넛지 → 활동 자동 연결**: 넛지에서 조치 → activities 테이블에 기록 → 쿨타임 리셋

**무료 vs 유료**
| 기능 | Free | Pro |
|------|------|-----|
| 규칙 기반 넛지 (사실 알림) | ✅ | ✅ |
| AI 분석 제안 | ❌ | ✅ |
| AI 이메일/메시지 초안 | ❌ | ✅ |
| 고객 태그별 쿨타임 (VIP 등) | ❌ | ✅ |
| admin 에스컬레이션 | ❌ | ✅ |

### 5.4 결제 & 구독 자동화

| 시점 | 동작 |
|------|------|
| D-7 | 갱신 안내 이메일 |
| D-1 | 긴급 알림 이메일 |
| 만료일 | plan_status → past_due (7일 유예) |
| +7일 | plan_status → suspended (읽기 전용, 데이터 보존) |
| +90일 | 데이터 삭제 예정 경고 이메일 |
| +120일 | 최종 데이터 삭제 |
| 결제 복구 시 | 즉시 active 전환 |

### 5.5 사용자 주도 진화 (Community-Driven Development)

기능 요청 게시판 → 커뮤니티 투표 → 투명 로드맵 → 개발 → 릴리즈 + 기여자 크레딧

- Pro 사용자 투표 가중치 3배
- 기여자 포인트 → 프리미엄 기능 무료 제공
- 요청 상태: open → reviewing → approved → in_progress → done / rejected

---

## 6. Design System

### Philosophy
"친근하고 쉽고, 쓰다 보면 없으면 불편한"

### Colors
| Token | Hex | 용도 |
|-------|-----|------|
| Primary | #0F6E56 | 신뢰, 성장 |
| Secondary | #5DCAA5 | 친근함, 크루미 기본색 |
| Accent | #534AB7 | AI, 프리미엄 |
| Success | #639922 | 성공, 완료 |
| Warning | #EF9F27 | 주의 넛지 |
| Danger | #E24B4A | 긴급 넛지, 에러 |
| Background | #FAFAF8 | 메인 배경 |
| Surface | #FFFFFF | 카드, 모달 |

### Crumi Character (말풍선 모양 캐릭터)
| 상태 | 색상 | 용도 |
|------|------|------|
| 기본 | 초록 #5DCAA5 | 인사, 환영, 일반 안내 |
| 분석 | 파랑 #85B7EB | AI 코치 작동 |
| 축하 | 노랑 #FAC775 | 거래 성사, 목표 달성 |
| 알림 | 코랄 #F5C4B3 | Follow-up 리마인더 |
| 작업 | 보라 #AFA9EC | 데이터 로딩 |
| 슬픔 | 회색 #D3D1C7 | 에러, 빈 화면 |

### Typography
- Korean: Pretendard / English: Inter / Monospace: JetBrains Mono

### Border Radius
- Cards: 16px (`rounded-2xl`) / Buttons: 12px (`rounded-xl`) / Inputs: 8px (`rounded-lg`)

### UI Principles
- 둥글둥글한 모서리, 충분한 여백, 카드 기반 레이아웃
- 라이트/다크 모드 지원
- Mobile-first 반응형 (sm: 640, md: 768, lg: 1024, xl: 1280)
- 빈 화면에는 크루미 캐릭터 + 안내 메시지

---

## 7. i18n Rules (CRITICAL — 모든 에이전트 준수)

1. **UI 텍스트 하드코딩 절대 금지** → `t('key')` 사용
2. **새 텍스트 추가 시 ko.json + en.json 동시 추가 필수**
3. **날짜/시간은 UTC로 저장**, 표시할 때만 로컬 변환
4. **숫자/통화는 Intl API 사용** (직접 포맷 금지)
5. **번역 키 네이밍**: `section.component.element`
   ```json
   { "customers": { "list": { "title": "고객 목록", "empty": "등록된 고객이 없습니다" } } }
   ```

---

## 8. Pricing

| | Free (v1.0) | Pro (v2.0) | Enterprise (v2.0+) |
|--|-------------|-----------|-------------------|
| 가격 | 무료 | ₩19,900/월 | ₩49,900/월 |
| 고객 수 | 500명 | 무제한 | 무제한 |
| 프로젝트 | 5개 | 무제한 | 무제한 |
| 파이프라인 | 1개 | 무제한 | 무제한 |
| 넛지 | 규칙 기반만 | AI 넛지 포함 | AI 넛지 포함 |
| AI 코치 | ❌ | ✅ | ✅ |
| 명함 스캔 | 월 20장 | 무제한 | 무제한 |
| 투표 가중치 | 1배 | 3배 | 3배 |
| 팀 관리 | ❌ | ❌ | ✅ (역할/권한) |
| API 연동 | ❌ | ❌ | ✅ |

---

## 9. File Ownership

```
apps/web/                 → frontend + designer
apps/web/components/ui/   → designer (디자인 시스템)
apps/web/components/crumi → designer (캐릭터)
apps/mobile/              → mobile
packages/shared/          → orchestrator 승인 필요
packages/supabase/        → backend
packages/design-tokens/   → designer
.agents/                  → orchestrator only
```

---

## 10. Security

- Supabase RLS(Row Level Security) 모든 테이블 필수
- API 키 코드 포함 금지 → .env.local + GitHub Secrets + Vercel env
- Antigravity Terminal: Agent-Assisted + Allow List
- 고객 민감 데이터(이메일, 전화번호) 암호화 저장
- OWASP Top 10 기본 방어
- AI에 고객 PII 최소 전달 (이름/이메일 대신 ID만)

---

## 11. Deployment

| 대상 | 플랫폼 | 트리거 |
|------|--------|--------|
| Web | Vercel | main push → 자동 배포 |
| Preview | Vercel Preview | PR마다 자동 생성 |
| Mobile | EAS Build (Expo) | 수동 / CD 설정 |
| DB | Supabase Cloud | 서울 리전 |
| CI | GitHub Actions | push, PR → lint + typecheck + test |

---

## 12. Development Standards

- **언어**: TypeScript strict mode (모든 코드)
- **포맷팅**: Biome (ESLint + Prettier 대체)
- **커밋**: Conventional Commits (`feat:`, `fix:`, `chore:`)
- **브랜치**: main ← develop ← feature/*, fix/*
- **테스트**: Vitest (단위) + Playwright (E2E)
- **PR 규칙**: 1 에이전트 = 1 PR, Orchestrator 리뷰 후 머지
- **스프린트**: 2주 단위
