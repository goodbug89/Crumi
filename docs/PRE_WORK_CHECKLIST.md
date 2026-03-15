# Crumi — 사전 준비 체크리스트 (Pre-Work Checklist)

> 개발 시작 전 아래 순서대로 모두 완료해야 합니다.
> 예상 소요 시간: 2~3시간

---

## Phase 1: 도메인 & 계정 준비

### 1-1. 도메인 구매
- [ ] crumi.com 도메인 구매 (Namecheap 또는 Cloudflare 추천)
- [ ] 네임서버를 Cloudflare로 설정 (향후 CDN + DNS 관리 편의)

### 1-2. 필수 계정 생성
- [ ] **GitHub** 계정 (이미 있으면 스킵)
  - Organization 생성 권장 (예: crumi-app)
- [ ] **Supabase** 계정 → supabase.com
- [ ] **Vercel** 계정 → vercel.com (GitHub 연동 로그인)
- [ ] **Stripe** 계정 → stripe.com (결제, v2.0 시점에 해도 됨)
- [ ] **Resend** 계정 → resend.com (이메일 발송)
- [ ] **PostHog** 계정 → posthog.com (분석)
- [ ] **Sentry** 계정 → sentry.io (에러 추적)
- [ ] **Google** 계정 (Antigravity IDE 로그인용)
- [ ] **Apple Developer** 등록 ($99/년, 모바일 앱 출시 시)
- [ ] **Google Play Developer** 등록 ($25 일회성, 모바일 앱 출시 시)

---

## Phase 2: GitHub Repository 설정

### 2-1. 레포지토리 생성
- [ ] GitHub에서 새 Private 레포 생성
  - 이름: `crumi`
  - .gitignore: Node
  - License: None (Proprietary)
  - README: 생성

### 2-2. 로컬 클론 & 초기 구조 생성
```bash
git clone git@github.com:[your-org]/crumi.git
cd crumi

# 디렉토리 구조 생성
mkdir -p .agents/skills/{frontend-dev,backend-dev,mobile-dev,designer/resources,ai-coach/resources,qa-tester,i18n-check/resources}
mkdir -p .github/workflows .github/ISSUE_TEMPLATE
mkdir -p apps/web apps/mobile
mkdir -p packages/{shared/types,shared/validators,shared/utils,supabase/migrations,supabase/seed,supabase/functions,design-tokens}
mkdir -p docs
```

### 2-3. 프로젝트 파일 배치
- [ ] `CLAUDE.md` → 프로젝트 루트에 복사
- [ ] `AGENTS.md` → `.agents/AGENTS.md`로 복사
- [ ] `DB_SCHEMA.sql` → `docs/DB_SCHEMA.sql`로 복사
- [ ] 이 파일 → `docs/PRE_WORK_CHECKLIST.md`로 복사

### 2-4. GitHub Labels 설정
GitHub > Settings > Labels에서 생성:

| Label | Color | 설명 |
|-------|-------|------|
| `agent:frontend` | #378ADD | 프론트엔드 에이전트 |
| `agent:backend` | #0F6E56 | 백엔드 에이전트 |
| `agent:mobile` | #534AB7 | 모바일 에이전트 |
| `agent:designer` | #D4537E | 디자이너 에이전트 |
| `agent:ai-coach` | #D85A30 | AI 코치 에이전트 |
| `agent:qa` | #E24B4A | QA 에이전트 |
| `priority:high` | #E24B4A | 긴급 |
| `priority:medium` | #EF9F27 | 보통 |
| `priority:low` | #639922 | 낮음 |
| `phase:1-mvp` | #85B7EB | Phase 1 MVP |
| `phase:2-pro` | #AFA9EC | Phase 2 Pro |
| `phase:3-global` | #5DCAA5 | Phase 3 글로벌 |

### 2-5. 브랜치 전략 설정
```bash
# 초기 커밋
git add -A
git commit -m "chore: initial project structure with CLAUDE.md and AGENTS.md"
git push origin main

# develop 브랜치 생성
git checkout -b develop
git push origin develop
```

### 2-6. 브랜치 보호 규칙 (GitHub Settings > Branches)
- [ ] `main` 보호 규칙:
  - Require pull request before merging ✅
  - Require approvals: 1 ✅
  - Require status checks to pass ✅
  - Include administrators ✅
- [ ] `develop` 보호 규칙:
  - Require pull request before merging ✅
  - Require status checks to pass ✅

### 2-7. GitHub Actions CI 설정
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
```

### 2-8. Issue Template 설정
```markdown
# .github/ISSUE_TEMPLATE/feature.md
---
name: Feature Request
about: 새 기능 요청
labels: ['enhancement']
---

## 설명
<!-- 기능을 설명하세요 -->

## 관련 에이전트
<!-- agent:frontend, agent:backend 등 -->

## Phase
<!-- phase:1-mvp, phase:2-pro 등 -->
```

---

## Phase 3: Supabase 프로젝트 설정

### 3-1. 프로젝트 생성
- [ ] supabase.com 로그인
- [ ] New Project 클릭
  - Name: `crumi-prod`
  - Database Password: (강력한 비밀번호 — 안전하게 보관!)
  - Region: **Northeast Asia (Seoul)** — `ap-northeast-2`
  - Pricing Plan: Free (시작용)

### 3-2. API 키 확인 & 저장
- [ ] Project Settings > API에서 확인:
  - `SUPABASE_URL` (Project URL)
  - `SUPABASE_ANON_KEY` (anon public)
  - `SUPABASE_SERVICE_ROLE_KEY` (service_role — 절대 공개 금지!)

### 3-3. 로컬 .env.local 생성
```bash
# apps/web/.env.local (git에 포함되지 않음)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3-4. Supabase CLI 설치 & 연결
```bash
npm install -g supabase
supabase login
supabase link --project-ref [your-project-ref]
```

### 3-5. 초기 DB 마이그레이션 실행
- [ ] `docs/DB_SCHEMA.sql`을 Supabase SQL Editor에서 실행
  - 또는 마이그레이션 파일로 분리:
  ```bash
  supabase migration new create_initial_schema
  # 생성된 파일에 DB_SCHEMA.sql 내용 복사
  supabase db push
  ```

---

## Phase 4: Vercel 연결

### 4-1. 프로젝트 연결
- [ ] vercel.com 로그인
- [ ] Import Git Repository → `crumi` 선택
- [ ] Framework: Next.js
- [ ] Root Directory: `apps/web`
- [ ] Build Command: `cd ../.. && npx turbo run build --filter=web`
- [ ] Output Directory: `apps/web/.next`

### 4-2. 환경 변수 설정 (Vercel Dashboard > Settings > Environment Variables)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RESEND_API_KEY` (이메일, 나중에 추가)
- [ ] `SENTRY_DSN` (에러 추적, 나중에 추가)

### 4-3. 도메인 연결
- [ ] Vercel > Settings > Domains > `crumi.com` 추가
- [ ] DNS 설정 (Cloudflare에서 Vercel DNS 레코드 추가)

---

## Phase 5: Google Antigravity IDE 설정

### 5-1. 설치
- [ ] antigravity.google/download 에서 설치 (Mac/Windows/Linux)

### 5-2. 프로젝트 열기
- [ ] Antigravity 실행 → Open Folder → `crumi` 폴더 선택
- [ ] Google 계정 로그인

### 5-3. 개발 모드 설정
- [ ] **Agent-Assisted** 선택 (권장)
- [ ] Terminal Policy: **Auto**

### 5-4. 에이전트 모델 설정 (Settings > Models)
- [ ] 기본 모델: Gemini 3 Pro
- [ ] 복잡한 로직용: Claude Sonnet 4.6 (지원되는 경우)

### 5-5. 첫 에이전트 테스트
Manager View에서 다음을 입력하여 테스트:
```
CLAUDE.md를 읽고 Turborepo 기반 monorepo를 초기화해줘.
Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui로 웹 앱을 셋업하고,
Supabase 클라이언트를 연결해줘.
```

---

## Phase 6: 확인 체크리스트

### 최종 확인
- [ ] GitHub 레포에 CLAUDE.md, AGENTS.md, DB_SCHEMA.sql이 있는가?
- [ ] .agents/skills/ 폴더 구조가 생성되어 있는가?
- [ ] main, develop 브랜치가 모두 존재하는가?
- [ ] main 브랜치에 보호 규칙이 적용되어 있는가?
- [ ] Supabase 프로젝트가 생성되고 서울 리전인가?
- [ ] .env.local에 Supabase 키가 설정되어 있는가?
- [ ] Vercel에 프로젝트가 연결되어 있는가?
- [ ] Antigravity에서 프로젝트가 열리고 에이전트가 동작하는가?
- [ ] `git push` 시 GitHub Actions CI가 실행되는가?

### 완료 후 첫 번째 작업
1. Antigravity Manager View에서 monorepo 초기화
2. 기본 랜딩 페이지 생성 (크루미 캐릭터 + 서비스 소개)
3. Supabase Auth 연동 (회원가입/로그인)
4. 워크스페이스 생성 플로우 구현

---

## 참고: 비용 요약 (초기 $0 ~ 최소 비용)

| 항목 | 비용 | 시점 |
|------|------|------|
| GitHub (Private) | 무료 | 즉시 |
| Supabase (Free Tier) | 무료 | 즉시 |
| Vercel (Hobby) | 무료 | 즉시 |
| Antigravity IDE | 무료 (Preview) | 즉시 |
| PostHog (Free) | 무료 | 즉시 |
| Sentry (Free) | 무료 | 즉시 |
| Resend (Free) | 무료 (3,000통/월) | 즉시 |
| 도메인 (crumi.com) | ~$10~15/년 | 즉시 구매 |
| Apple Developer | $99/년 | 모바일 출시 시 |
| Google Play | $25 (1회) | 모바일 출시 시 |
| **초기 총 비용** | **~$10~15** | |
