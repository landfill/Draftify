# Draftify 설계 문서 인덱스

**버전**: 1.0
**최종 갱신**: 2025-12-27
**원본 문서**: `service-design.md` (아카이브됨)

---

## 문서 개요

Draftify의 전체 설계 문서는 **컨텍스트 효율성**을 위해 주제별로 분리되어 있습니다.
필요한 정보만 로드하여 토큰 사용량을 최소화하고 유지보수를 용이하게 합니다.

---

## 핵심 문서 (반드시 읽어야 함)

### 1. [architecture.md](./architecture.md)
**내용**: 시스템 아키텍처 (Section 2)
- Skill + Main Agent + Sub-Agents 구조
- 4계층 아키텍처 (사용자 → 스킬 → 오케스트레이션 → 실행 → 데이터)
- 구성요소 간 관계 및 데이터 흐름

**언제 읽나**: 전체 시스템 구조를 이해할 때

---

### 2. [workflow.md](./workflow.md)
**내용**: Phase 1-4 데이터 흐름 (Section 4)
- Phase 1: 입력 수집 및 크롤링
- Phase 2: 통합 분석 (input-analyzer)
- Phase 3-1: 선행 섹션 생성 (정책, 용어)
- Phase 3-2: 후행 섹션 생성 (화면, 프로세스)
- Phase 3.5: 품질 검증
- Phase 4: PPT 생성

**언제 읽나**: 워크플로우 흐름을 파악할 때

---

### 3. [error-handling.md](./error-handling.md)
**내용**: 에러 핸들링 및 제어 로직 (Section 7)
- Skill 계층 에러 처리
- Main Agent 오케스트레이션 전략
- 재시도 전략 (Phase별)
- 최소 성공 기준 (부분 성공 허용)
- 타임아웃 설정

**언제 읽나**: 에러 핸들링, 재시도, 복구 로직을 구현할 때

---

## 에이전트별 문서 (agents/)

각 에이전트의 프롬프트 및 상세 로직을 포함합니다.

### Main Agent
- **[orchestrator.md](./agents/orchestrator.md)**: auto-draft-orchestrator (Main Agent)
  - 전체 Phase 1-4 제어
  - 서브 에이전트 생명주기 관리
  - 에러 핸들링

### Sub-Agents (순서대로)
1. **[input-analyzer.md](./agents/input-analyzer.md)**: Phase 2 분석 에이전트
   - 크롤링 결과 + 문서 통합
   - analyzed-structure.json 생성

2. **[policy-generator.md](./agents/policy-generator.md)**: Phase 3-1 정책 생성
   - 정책 ID 할당 (POL-AUTH-001...)
   - 정책정의서 마크다운 생성

3. **[glossary-generator.md](./agents/glossary-generator.md)**: Phase 3-1 용어집 생성
   - 용어 알파벳/가나다순 정렬
   - 용어집 마크다운 생성

4. **[screen-generator.md](./agents/screen-generator.md)**: Phase 3-2 화면정의 생성
   - 화면 ID 할당 (SCR-001...)
   - 스크린샷 임베딩
   - 정책 ID 참조

5. **[process-generator.md](./agents/process-generator.md)**: Phase 3-2 프로세스 생성
   - 프로세스 흐름 정의
   - 화면 ID, 정책 ID 참조

6. **[quality-validator.md](./agents/quality-validator.md)**: Phase 3.5 품질 검증
   - ID 형식 검증
   - 참조 무결성 검증
   - 중복 및 순차성 검증

**언제 읽나**: 해당 에이전트를 구현하거나 수정할 때

---

## 구현 가이드

### [crawling-strategy.md](./crawling-strategy.md)
**내용**: Phase 1 크롤링 전략 (부록 A)
- Tier 1-3 순차 적용
- Record 모드 (State 기반 SPA 대응)
- BFS 알고리즘
- URL 정규화
- 우선순위 계산

**언제 읽나**: Phase 1 크롤링 로직을 구현할 때

---

### [schemas.md](./schemas.md)
**내용**: 데이터 스키마 정의 (부록 B)
- crawling-result.json 스키마
- analyzed-structure.json 스키마
- ID 명명 규칙 (POL-*, SCR-*, API-*)

**언제 읽나**: JSON 데이터 구조를 구현하거나 검증할 때

---

### [implementation-checklist.md](./implementation-checklist.md)
**내용**: 구현 체크리스트 (부록 C)
- 1-6단계 구현 로드맵
- Phase 1 Tier별 구현 우선순위
- 검증 항목

**언제 읽나**: 구현 순서를 계획하거나 진행 상황을 추적할 때

---

### [edge-cases.md](./edge-cases.md)
**내용**: 엣지 케이스 및 대응 방안 (부록 E)
- 5개 카테고리 (입력, 크롤링, 에이전트, ID 참조, Record 모드)
- 14개 엣지 케이스 시나리오
- 우선순위별 대응 전략 (P0-P3)

**언제 읽나**: 예외 상황 처리 로직을 구현할 때

---

## 보조 문서

### [project-management.md](./project-management.md)
**내용**: 프로젝트 관리 전략 (Section 8)
- 출력 디렉토리 구조
- 프로젝트명 결정 로직 (5단계 우선순위)
- 버전 관리 (선택)

**언제 읽나**: 파일 경로, 프로젝트명 로직을 구현할 때

---

### [tech-stack.md](./tech-stack.md)
**내용**: 기술 스택 선택 근거 (Section 5)
- Chrome DevTools MCP 선택 이유
- Claude Agent 설계 근거
- PPT 생성 도구 (별도 스킬)
- 웹 UI (선택, HTTP Polling)

**언제 읽나**: 기술 선택 배경을 이해하거나 대안을 검토할 때

---

## 아카이브

### service-design.md (원본)
**위치**: `docs/archive/service-design.md`
**설명**: 5910줄의 통합 설계 문서 (분리 전 원본)
**사용처**: 레퍼런스 참조용 (일반적으로 읽지 않음)

---

## 빠른 참조

### 구현 시나리오별 필수 문서

| 작업 | 읽어야 할 문서 |
|------|---------------|
| 전체 시스템 이해 | `architecture.md` → `workflow.md` |
| /auto-draft Skill 구현 | `error-handling.md` (Section 7.1) |
| Main Agent 구현 | `agents/orchestrator.md` + `error-handling.md` |
| Phase 1 크롤링 구현 | `crawling-strategy.md` + `schemas.md` (crawling-result.json) |
| input-analyzer 구현 | `agents/input-analyzer.md` + `schemas.md` (analyzed-structure.json) |
| policy/screen generator 구현 | 해당 `agents/*.md` + `schemas.md` (ID 규칙) |
| 에러 처리 로직 구현 | `error-handling.md` + `edge-cases.md` |
| 테스트 케이스 작성 | `edge-cases.md` (Section 부록 E 테스트 시나리오) |

---

## 문서 간 의존성

```
architecture.md (전체 구조)
    ↓
workflow.md (Phase 흐름)
    ↓
┌─────────────┬─────────────┬─────────────┐
│ Phase 1     │ Phase 2-3   │ Phase 4     │
│ crawling    │ agents/     │ (별도 스킬) │
│ -strategy   │ *.md        │             │
└─────────────┴─────────────┴─────────────┘
    ↓              ↓              ↓
schemas.md (모든 Phase의 데이터 구조)
    ↓
error-handling.md (에러 복구 전략)
    +
edge-cases.md (예외 시나리오)
```

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-12-27 | 1.0 | 최초 분리 (service-design.md → 11개 파일) |

---

**참고**: 이 인덱스는 설계 문서 네비게이션 전용입니다.
사용자 가이드는 별도로 `README.md` 및 `docs/user-guide.md`를 참조하세요.
