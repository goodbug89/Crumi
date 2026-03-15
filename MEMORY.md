# Crumi Project Memory

이 문서는 프로젝트의 상태, 핵심 결정 사항, 문제 해결 이력 및 진행해야 할 다음 단계를 기록하여, 여러 에이전트(Agent)가 프로젝트의 문맥(Context)을 쉽게 파악하고 일관된 작업을 수행할 수 있도록 돕는 기억 저장소(Memory)입니다.

---

github : https://github.com/goodbug89/Crumi



## 📅 현재 진행 상태 (Current Status)
- **날짜**: 2026-03-15
- **현재 단계**: `Phase 6+ 고도화 및 안정화 완료 (MVP 완성)`
- **주요 마일스톤**:
  - [x] 고객/프로젝트 활동 기록(Timeline) CRUD 완료
  - [x] 넛지 시스템 기초(Cooltime 설정) 및 **스마트 스캐너** 연동 완료
  - [x] 거래(Deal) 상세 수정 및 고객/프로젝트 상세 연동 완료
  - [x] 대시보드 고도화 (**비주얼 파이프라인**, **AI 코치 UI**) 완료
  - [x] **팀 초대 및 멤버 관리 시스템** (초대 링크, 가입 페이지) 완료
  - [x] **기능 요청(Feedback) 투표 시스템** 연동 완료
  - [x] 랜딩 페이지 디자인 및 프리미엄 애니메이션 적용 완료
  - [x] **구독 및 결제(Pricing)** 페이지 구축 완료 (Phase 7 기초)
  - [x] **AI 코치 엔진(Heuristic)** 및 실시간 인사이트 연동 완료 (Phase 8 기초)

---

## 🛠 아키텍처 및 핵심 결정 사항 (Architecture & Decisions)
1. **CRUD 패턴**: Server Components에서 데이터 fetch, Client Components(Actions)에서 Mutation 처리 패턴 정착.
2. **Soft Delete**: `deleted_at` 필드를 활용하여 데이터 보존 및 필터링 수행.
3. **Nudge Logic**: `cooltime_settings` 테이블을 통해 사용자별 유연한 관리 주기 설정 가능.

---

## 🎯 다음 진행 목표 (Next Steps)
1. **유료 플랜 결제 연동**: Stripe를 통한 구독 시스템 구축 (Phase 7)
2. **AI 코치 고도화**: LLM을 활용한 활동 기록 분석 및 다음 행동 추천 (Phase 8)
3. **i18n 확장**: 영어/일본어 등 다국어 번역 리소스 완비
4. **모바일 앱(Capacitor/React Native)**: 하이브리드 앱 패키징 및 알림(Push) 연동
