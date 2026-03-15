# Crumi Project Memory

이 문서는 프로젝트의 상태, 핵심 결정 사항, 문제 해결 이력 및 진행해야 할 다음 단계를 기록하여, 여러 에이전트(Agent)가 프로젝트의 문맥(Context)을 쉽게 파악하고 일관된 작업을 수행할 수 있도록 돕는 기억 저장소(Memory)입니다.

---

github : https://github.com/goodbug89/Crumi



## 📅 현재 진행 상태 (Current Status)
- **날짜**: 2026-03-15
- **현재 단계**: `Phase 2 (GitHub 설정 완료) 및 Phase 1~9 초기 구상 및 MVP UI 반영 성공`
- **주요 마일스톤**:
  - [x] 터보레포(Turborepo) 기반 모노레포 구축 (`apps/web`, `packages/shared`, `packages/design-tokens`)
  - [x] UI 디자인 시스템 설정 (Crumi 전용 색상, 타이포그래피, 간격 등 적용)
  - [x] Supabase 연동 (`server.ts`, `client.ts`, `middleware.ts` 구현 완료)
  - [x] 워크스페이스 세팅 (생성, 전환, 멤버 관리 레이아웃 및 페이지 구현)
  - [x] 핵심 CRM 기능 (고객 리스트, 거래 파이프라인 칸반, 프로젝터 연결 UI 구현)
  - [x] 다국어(i18n) 통합 설정 (`next-intl` 연동)
  - [x] GitHub 레포지토리 초기화(Private Repo 생성, `gh` CLI로 라벨 12개 자동 등록 완료, `develop` 브랜치 푸시)

---

## 🛠 아키텍처 및 핵심 결정 사항 (Architecture & Decisions)
1. **기술 스택**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Supabase, Turborepo
2. **린터 및 포매터**: ESLint와 Prettier 대신 **Biome**을 채택하여 속도 상승 도모.
3. **다국어(i18n)**: 한국어(`ko.json`)를 기본으로, 향후 글로벌 확장을 위해 `next-intl` 미들웨어를 Supabase Auth 미들웨어와 결합하여 라우팅 처리 (`/ko/ws/[slug]/...`).
4. **Agent 시스템 활용**: `.agents/AGENTS.md`에 정의된 역할별 프롬프트를 통해 이후 도메인 특화(프론트, 백, 디자이너 등) 작업 수행.

---

## ⚠️ 지식 창고 및 주의 사항 (Gotchas & Guidelines)
- **미들웨어 파일 규칙 이슈**: Next.js 16.1 (Turbopack) 에서 `"middleware" file convention is deprecated` 경고가 뜨고 있음 (향후 Next.js 업데이트 방향에 따라 `proxy`로 변경될 수 있음, 현재는 무시 가능).
- **Supabase 인증**: 로그인 안 한 사용자는 보호된 라우트(예: `/ko/ws/...`)에 접근 시 자동으로 로그인 페이지로 라우팅.
- **워크스페이스 식별**: URL 상의 `[slug]`를 통해 현재 접근 중인 워크스페이스를 식별합니다. 따라서 데이터베이스 쿼리 시 반드시 워크스페이스 소유 검증(`eq('workspace_id', workspace.id)`)을 넣어야 합니다.

---

## 🎯 다음 진행 목표 (Next Steps)
1. **Phase 3**: 웹 브라우저가 아닌 Vercel에 실제 초기 배포 진행 (이후 자동 CI/CD 확인용)
2. **Phase 3 (DB)**: Supabase 프로젝트 포털 내에서 `DB_SCHEMA.sql` 스키마 적용 및 `.env.local` 최종 연결
3. **Phase 4~7 기능 디테일 구현**: 현재 임시 데이터 및 껍데기로 되어있는 백엔드 로직(Action, Mutation) 연결
4. **안전성(빌드 등)**: 이후 개발 사항들은 `develop` 브랜치에 커밋 후, Vercel/GitHub Actions의 Status check를 거쳐 `main`에 머지할 것.
