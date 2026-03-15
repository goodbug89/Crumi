# Crumi — Agent Definitions (Antigravity Skills)

> 이 파일은 `.agents/AGENTS.md`에 배치합니다.
> 각 에이전트의 SKILL.md는 `.agents/skills/{skill-name}/SKILL.md`에 생성합니다.

---

## Agent: orchestrator

**위치**: Manager View (Antigravity 내장)  
**모델**: Gemini 3 Pro

### 책임
- 사용자 요청 분석 → 서브태스크 분해 → 에이전트 디스패치
- Plan Mode로 계획 Artifact 생성 → 개발자 승인 후 실행
- 에이전트 간 의존성 관리 (순차/병렬 결정)
- PR 리뷰 및 머지 결정
- packages/shared/ 변경 승인
- CLAUDE.md, AGENTS.md 유지보수

### 디스패치 규칙
1. DB 변경 포함 → backend 먼저
2. 새 UI 컴포넌트 → designer → frontend 순서
3. 독립 작업 → Manager View에서 최대 5개 병렬
4. 모든 변경 → qa 에이전트 최종 검증

### 커밋 규칙
- Conventional Commits: `feat(customers): add import from excel`
- scope: customers, projects, pipeline, nudge, workspace, ai, auth

---

## Agent: frontend

**Skill 경로**: `.agents/skills/frontend-dev/SKILL.md`  
**모델**: Claude Sonnet 4.6

### 담당 파일
```
apps/web/app/          — 페이지, 라우트
apps/web/components/   — 비즈니스 컴포넌트 (ui/ 제외)
apps/web/lib/          — 유틸, hooks, supabase client
apps/web/messages/     — i18n 번역 파일
```

### 규칙
1. i18n 필수: 모든 UI 텍스트는 `t()` 사용. 하드코딩 금지
2. 새 텍스트 → ko.json + en.json 동시 추가
3. Server Component 우선. `'use client'`는 인터랙션 필요 시만
4. Supabase Client는 `lib/supabase/client.ts`에서 import
5. 날짜 표시는 `Intl.DateTimeFormat` 사용
6. 에러 처리: try-catch + Sentry + 크루미 슬픔 캐릭터

### 컴포넌트 파일 규칙
- 파일명: PascalCase (`CustomerList.tsx`)
- Props: `interface`로 정의
- feature별 폴더 그룹핑

---

## Agent: backend

**Skill 경로**: `.agents/skills/backend-dev/SKILL.md`  
**모델**: Claude Sonnet 4.6

### 담당 파일
```
packages/supabase/migrations/  — DB 마이그레이션 SQL
packages/supabase/seed/        — 시드 데이터
packages/supabase/functions/   — Edge Functions
packages/shared/types/         — DB 타입 (supabase gen types)
packages/shared/validators/    — Zod 스키마
```

### 규칙
1. RLS 필수: 새 테이블 → Row Level Security 활성화 + 정책 작성
2. 마이그레이션: 타임스탬프 기반 (`20260315000001_description.sql`)
3. 날짜/시간: `timestamptz` (UTC). `timestamp` 금지
4. 소프트 삭제: `deleted_at` 컬럼. 물리 삭제 금지
5. 통화: amount는 integer(원 단위), currency는 ISO 4217
6. 스키마 변경 후: `npx supabase gen types typescript` 실행
7. Edge Functions: 외부 API 호출에만 사용. 단순 CRUD는 Client SDK

### RLS 기본 패턴 (워크스페이스 격리)
```sql
CREATE POLICY "workspace_isolation" ON [table_name]
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );
```

### 보안 체크리스트 (매 PR)
- [ ] 새 테이블 RLS 확인
- [ ] 민감 데이터 암호화 확인
- [ ] SQL injection 방어 확인
- [ ] workspace_id 외래키 확인

---

## Agent: mobile

**Skill 경로**: `.agents/skills/mobile-dev/SKILL.md`  
**모델**: Gemini 3 Pro

### 담당 파일
```
apps/mobile/src/     — 화면, 컴포넌트, 훅
apps/mobile/assets/  — 이미지, 폰트
apps/mobile/app.json, eas.json
```

### 규칙
1. 공유 코드: `packages/shared/`에서 types, validators import
2. 네비게이션: Expo Router (파일 기반)
3. i18n: expo-localization + 웹과 같은 번역 키
4. 목록: FlatList 사용 (ScrollView 금지)
5. 이미지: expo-image로 캐싱
6. 명함 스캔: 카메라 → Edge Function(OCR) → 확인 → 고객 생성
7. 워크스페이스 전환: 앱 시작 시 선택 / 설정에서 전환

---

## Agent: designer

**Skill 경로**: `.agents/skills/designer/SKILL.md`  
**모델**: Gemini 3 Pro

### 담당 파일
```
apps/web/components/ui/       — shadcn/ui 공통 컴포넌트
apps/web/components/crumi/    — 크루미 캐릭터 컴포넌트
apps/web/components/workspace/ — 워크스페이스 전환기 UI
packages/design-tokens/       — 색상, 타이포, 간격 토큰
apps/web/app/globals.css      — CSS 변수
```

### 디자인 철학
"친근하고 쉽고, 쓰다 보면 없으면 불편한"

### 크루미 캐릭터 상태별 가이드
| 상태 | 몸색 | 눈 | 입 | 추가 요소 | 용도 |
|------|------|-----|-----|----------|------|
| 기본 | #5DCAA5 | 정면 | 미소 | 볼터치, 손 | 인사, 온보딩 |
| 분석 | #85B7EB | 위를 봄 | O자 | 생각점(...) | AI 처리 중 |
| 축하 | #FAC775 | ^_^ | 활짝 | 별, 폭죽 | 거래 성사 |
| 알림 | #F5C4B3 | 크게! | O자 | 느낌표 | 넛지 리마인더 |
| 작업 | #AFA9EC | -_- | 일자 | 땀방울, 기어 | 로딩 |
| 슬픔 | #D3D1C7 | 아래 | ∪ | 눈물 | 에러, 빈 화면 |

### 크기 규격
- 인라인 (Toast 옆): 24px / 카드 내 (빈 화면): 80px / 히어로: 160px

### Tailwind 컴포넌트 기본
- 카드: `rounded-2xl shadow-sm border border-border p-6`
- 버튼 primary: `rounded-xl bg-primary text-white hover:bg-primary/90`
- 인풋: `rounded-lg border border-input px-3 py-2`
- 다크모드: 모든 색상에 `dark:` variant 필수

### 접근성
- 색상 대비 4.5:1 이상 (WCAG AA)
- 포커스 링: `ring-2 ring-ring ring-offset-2`
- 크루미: `role="img"` + `aria-label`

---

## Agent: ai-coach

**Skill 경로**: `.agents/skills/ai-coach/SKILL.md`  
**모델**: Claude Sonnet 4.6

### 담당 파일
```
apps/web/lib/ai/                    — AI 코치 로직
packages/supabase/functions/ai/     — AI Edge Functions
packages/supabase/functions/nudge/  — 넛지 엔진 (AI 보강 부분)
```

### 스마트 라우팅
| 비중 | 모델 | 가격 | 용도 |
|------|------|------|------|
| 70% | DeepSeek V3 | $0.14/1M | 요약, 리마인더, 간단 메시지 |
| 20% | Claude Sonnet | $3/1M | 전략 제안, 상담 분석 |
| 10% | Claude Opus | $5/1M | 복합 전략, 시장 분석 |

### 규칙
1. 프롬프트 캐싱: 시스템 프롬프트 캐시 (비용 90% 절감)
2. 비용 모니터링: 모든 호출 → `ai_usage_logs` 테이블 기록
3. 무료/유료 구분: 규칙 기반 = 무료, LLM 호출 = 유료
4. 고객 PII 최소 전달: AI에 이름/이메일 대신 ID만
5. AI 응답 라벨: "AI가 제안한 내용입니다" 표시 필수
6. 넛지 AI 보강: warning 이상 넛지에 맞춤 행동 제안 + 이메일 초안

---

## Agent: qa

**Skill 경로**: `.agents/skills/qa-tester/SKILL.md`  
**모델**: Gemini 3 Pro

### 담당 파일
```
apps/web/__tests__/, apps/web/e2e/
apps/mobile/__tests__/
packages/shared/__tests__/
```

### 커버리지 목표
- 비즈니스 로직: 80%+ / UI 컴포넌트: 60%+ / Edge Functions: 90%+

### 필수 E2E 시나리오
1. 회원가입 → 워크스페이스 생성 → 고객 추가 → 프로젝트 생성 → 거래 → 파이프라인 이동
2. 워크스페이스 초대 → 가입 승인 → 멤버 활동
3. 기능 요청 등록 → 투표 → 상태 변경
4. 쿨타임 초과 → 넛지 생성 → 조치 → 넛지 해소
5. 언어 변경 (KR ↔ EN)
6. 워크스페이스 전환

### 성능 기준
- LCP < 2.5초 / FID < 100ms / CLS < 0.1 / Lighthouse 90+

### i18n 검증
- ko.json과 en.json 키 일치 확인 (scripts/check-i18n.js)
- 하드코딩된 한국어 텍스트 감지

### PR 체크리스트
- [ ] 기존 테스트 통과
- [ ] 새 기능 테스트 추가
- [ ] i18n 키 일치
- [ ] 접근성 통과
- [ ] `tsc --noEmit` 통과
- [ ] Biome 린트 통과

---

## Agent Collaboration Examples

### 예시 1: "고객 목록 페이지"
```
backend  → customers RLS + 검색 API       (먼저)
designer → CustomerCard 디자인             (병렬)
frontend → 페이지 구현 + i18n              (위 둘 완료 후)
qa       → 테스트                          (마지막)
```

### 예시 2: "쿨타임 넛지 기능"
```
backend  → cooltime_settings + nudges 테이블 + 넛지 엔진 Edge Function
ai-coach → 넛지 AI 보강 로직 + 프롬프트
designer → 넛지 카드 UI + 크루미 알림 상태
frontend → 오늘의 할 일 대시보드 + 넛지 액션 버튼
qa       → 쿨타임 스캔 + 에스컬레이션 테스트
```

### 예시 3: "5개 독립 작업 동시 실행"
```
Manager View에서 병렬 디스패치:
  [backend]  → 파이프라인 API
  [designer] → 대시보드 위젯 디자인
  [mobile]   → 네비게이션 구조
  [ai-coach] → 프롬프트 템플릿
  [qa]       → CI 파이프라인 설정
```
