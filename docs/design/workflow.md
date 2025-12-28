# Draftify 데이터 흐름 (Workflow)

**버전**: 1.0
**최종 갱신**: 2025-12-27
**원본 출처**: service-design.md Section 4

---

## 목차

1. [전체 데이터 흐름도](#41-전체-데이터-흐름도)
2. [단계별 데이터 변환](#42-단계별-데이터-변환)
3. [데이터 의존성 그래프](#43-데이터-의존성-그래프)

---

## 4.1 전체 데이터 흐름도

```
[사용자 입력]
  │
  │ URL, PRD, README, SDD, agent.md 등
  │
  ▼
┌─────────────────────────────────────┐
│ Phase 1: 입력 수집 및 자동 크롤링     │
│                                     │
│ • Chrome DevTools MCP로 URL 크롤링  │
│ • 모든 페이지 발견 (BFS 알고리즘)     │
│ • 각 페이지 DOM 분석 + 스크린샷      │
│ • 문서 파일 읽기                     │
└─────────────────────────────────────┘
  │
  │ crawling-result.json, 문서 내용들
  │
  ▼
┌─────────────────────────────────────┐
│ Phase 2: 통합 분석                   │
│                                     │
│ input-analyzer 에이전트 실행         │
│ • 크롤링 결과 + 문서들 통합          │
│ • 화면/정책/프로세스 구조화          │
└─────────────────────────────────────┘
  │
  │ analyzed-structure.json
  │
  ▼
┌─────────────────────────────────────┐
│ Phase 3-1: 선행 섹션 생성 (순차)     │
│                                     │
│ ┌─────────────────┐                │
│ │ policy-generator│ → policy.md    │
│ └─────────────────┘                │
│ ┌─────────────────┐                │
│ │glossary-        │ → glossary.md  │
│ │generator        │                │
│ └─────────────────┘                │
└─────────────────────────────────────┘
  │
  │ policy.md, glossary.md
  │
  ▼
┌─────────────────────────────────────┐
│ Phase 3-2: 후행 섹션 생성 (병렬)     │
│                                     │
│ ┌─────────────────┐                │
│ │screen-generator │ → screen.md    │
│ │(정책 ID 참조)    │                │
│ └─────────────────┘                │
│ ┌─────────────────┐                │
│ │process-generator│ → process.md   │
│ │(정책 ID 참조)    │                │
│ └─────────────────┘                │
└─────────────────────────────────────┘
  │
  │ 9개 섹션 마크다운 파일들
  │
  ▼
┌─────────────────────────────────────┐
│ Phase 3.5: 품질 검증                 │
│                                     │
│ quality-validator 에이전트 실행      │
└─────────────────────────────────────┘
  │
  │ validation-report.md (PASS/FAIL)
  │
  ▼
┌─────────────────────────────────────┐
│ Phase 4: PPT 생성                    │
│                                     │
│ /ppt-generator 스킬 호출             │
│ • 섹션 마크다운 파싱                 │
│ • 회사 템플릿 적용                   │
│ • 스크린샷 임베딩                    │
└─────────────────────────────────────┘
  │
  │ final-draft.pptx
  │
  ▼
[사용자에게 전달]
```

---

## 4.2 단계별 데이터 변환

| Phase | 입력 데이터 | 처리 | 출력 데이터 |
|-------|------------|------|------------|
| **1. 입력 수집** | URL, 문서 파일들, 스크린샷, 소스코드(선택) | MCP 크롤링, 파일 읽기 | crawling-result.json, 문서 텍스트 |
| **2. 분석** | crawling-result.json, 문서 텍스트, 소스코드 | input-analyzer 에이전트 | analyzed-structure.json |
| **3-1. 선행 생성** | analyzed-structure.json | 2개 에이전트 순차 실행 | policy.md, glossary.md |
| **3-2. 후행 생성** | analyzed-structure.json, policy.md | 2개 에이전트 병렬 실행 | screen.md, process.md |
| **3.5. 검증** | 모든 섹션.md, guideline | validator 에이전트 | validation-report.md (PASS/FAIL) |
| **4. 문서 생성** | 모든 섹션.md, 스크린샷, validation-report | 별도 스킬 (ppt-generator) | final-draft.pptx 또는 HTML |

---

## 4.3 데이터 의존성 그래프

```
URL ────┐
문서들 ──┼──> [Phase 1] ──> crawling-result.json ──┐
        │                                         │
        └─────────────────────────────────────────┴──> [Phase 2: input-analyzer]
                                                            │
                                                            │ analyzed-structure.json
                                                            │
                            ┌───────────────────────────────┼───────────────────┐
                            │                               │                   │
                            ▼                               ▼                   │
                    [policy-generator]              [glossary-generator]        │
                            │                               │                   │
                            │ policy.md                     │ glossary.md       │
                            └───────────────┬───────────────┘                   │
                                            │                                   │
                                            ▼                                   │
                                    policy.md, glossary.md                      │
                                            │                                   │
                            ┌───────────────┴───────────────────────────────────┘
                            │                               │
                            ▼                               ▼
                    [screen-generator]              [process-generator]
                    (정책 ID 참조)                   (정책 ID 참조)
                            │                               │
                            │                               │
                            └───────────────┬───────────────┘
                                                            │
                                                            │ 모든 섹션.md
                                                            │
                                                            ▼
                                                    [quality-validator]
                                                            │
                                                            │ 검증 통과
                                                            │
                                                            ▼
                                                    [ppt-generator]
                                                            │
                                                            ▼
                                                    final-draft.pptx
```

---

## Phase별 핵심 포인트

### Phase 1: 입력 수집
- **목표**: URL 크롤링 + 문서 읽기
- **출력**: `crawling-result.json`
- **실패 시**: 전체 중단 (필수 Phase)
- **상세 문서**: [crawling-strategy.md](./crawling-strategy.md)

### Phase 2: 통합 분석
- **목표**: 크롤링 결과 + 문서 → 구조화된 JSON
- **에이전트**: input-analyzer (단일)
- **출력**: `analyzed-structure.json`
- **실패 시**: 전체 중단 (필수 Phase)
- **상세 문서**: [agents/input-analyzer.md](./agents/input-analyzer.md)

### Phase 3-1: 선행 섹션 생성
- **목표**: 정책 및 용어 섹션 생성
- **에이전트**: policy-generator, glossary-generator (순차)
- **출력**: `policy.md`, `glossary.md`
- **실패 시**: 빈 섹션 생성 + 계속 진행
- **왜 선행?**: Phase 3-2가 정책 ID를 참조하기 때문

### Phase 3-2: 후행 섹션 생성
- **목표**: 화면 및 프로세스 섹션 생성
- **에이전트**: screen-generator, process-generator (병렬)
- **출력**: `screen.md`, `process.md`
- **실패 시**: 부분 성공 (성공한 섹션만 포함)
- **병렬화 가능**: 두 에이전트는 서로 독립적

### Phase 3.5: 품질 검증
- **목표**: 생성된 섹션들의 ID 참조 무결성 검증
- **에이전트**: quality-validator (단일)
- **출력**: `validation-report.md` (PASS/FAIL)
- **실패(FAIL) 시**: Phase 4 계속 진행 (경고 포함)

### Phase 4: PPT 생성
- **목표**: 마크다운 → PPT 변환
- **스킬**: ppt-generator (별도 독립 스킬)
- **출력**: `final-draft.pptx`
- **실패 시**: HTML 대체 버전 생성

---

## 병렬 실행 포인트

**Phase 3-2만 병렬 가능**:
- screen-generator ⚡ process-generator (동시 실행)
- 실행 시간: ~5분 → ~2.5분 (2배 속도 향상)

**나머지는 순차 실행 필수**:
- Phase 1 → 2 → 3-1 → 3-2 → 3.5 → 4

---

## 다음 단계

- **Phase 1 크롤링 상세**: [crawling-strategy.md](./crawling-strategy.md)
- **데이터 스키마**: [schemas.md](./schemas.md)
- **에러 핸들링**: [error-handling.md](./error-handling.md)
