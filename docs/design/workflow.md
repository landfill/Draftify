# Draftify 데이터 흐름 (Workflow)

**버전**: 1.3
**최종 갱신**: 2025-12-29

> **Note**: 이 문서는 Phase 1-4 워크플로우의 완전한 명세입니다.
> Phase 1-3.5는 orchestrator 에이전트가 담당하고, Phase 4는 /auto-draft 스킬 계층에서 실행됩니다.

---

## 목차

1. [전체 데이터 흐름도](#41-전체-데이터-흐름도)
2. [단계별 데이터 변환](#42-단계별-데이터-변환)
3. [데이터 의존성 그래프](#43-데이터-의존성-그래프)
4. [결과 수집 및 반영 규칙](#44-결과-수집-및-반영-규칙)

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
│ Phase 3-1: 선행 섹션 생성 (병렬)     │
│                                     │
│ ┌─────────────────┐                │
│ │ policy-generator│ → 06-policy-definition.md │
│ └─────────────────┘                │
│         ⫸ 동시 실행 ⫷              │
│ ┌─────────────────┐                │
│ │glossary-        │ → 05-glossary.md │
│ │generator        │                │
│ └─────────────────┘                │
└─────────────────────────────────────┘
  │
  │ 06-policy-definition.md, 05-glossary.md
  │
  ▼
┌─────────────────────────────────────┐
│ Phase 3-2: 후행 섹션 생성 (순차)     │
│                                     │
│ ┌─────────────────┐                │
│ │screen-generator │ → 08-screen-definition.md │
│ │(정책 ID 참조)    │                │
│ └────────┬────────┘                │
│          ↓                          │
│ ┌─────────────────┐                │
│ │process-generator│ → 07-process-flow.md │
│ │(화면 ID 참조)    │                │
│ └─────────────────┘                │
└─────────────────────────────────────┘
  │
  │ 10개 섹션 마크다운 파일들
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
│ ← orchestrator 반환 → /auto-draft   │
│   (스킬 계층으로 제어권 반환)        │
└─────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────┐
│ Phase 4: PPT 생성 (/auto-draft 스킬) │
│                                     │
│ /draftify-ppt 스킬 호출              │
│ • 섹션 마크다운 파싱                 │
│ • 회사 템플릿 적용                   │
│ • 스크린샷 임베딩                    │
└─────────────────────────────────────┘
  │
  │ <project>-draft-V{version}.pptx
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
| **3-0. 기본 섹션 생성** | analyzed-structure.json | front-matter-generator, back-matter-generator (**병렬**) | 01-cover.md, 02-revision-history.md, 03-table-of-contents.md, 04-section-divider.md, 09-references.md(옵션), 10-eod.md |
| **3-1. 선행 생성** | analyzed-structure.json | 2개 에이전트 **병렬** 실행 | 06-policy-definition.md, 05-glossary.md |
| **3-2. 후행 생성** | analyzed-structure.json, 06-policy-definition.md, 08-screen-definition.md | 2개 에이전트 순차 실행 (screen → process) | 08-screen-definition.md, 07-process-flow.md |
| **3.5. 검증** | 모든 섹션.md, guideline | validator 에이전트 | validation-report.md (PASS/FAIL) |
| **4. 문서 생성** | 모든 섹션.md, 스크린샷, validation-report | 별도 스킬 (draftify-ppt) | <project>-draft-V{version}.pptx 또는 HTML |

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
                            │ 06-policy-definition.md       │ 05-glossary.md    │
                            └───────────────┬───────────────┘                   │
                                            │                                   │
                                            ▼                                   │
                                    06-policy-definition.md, 05-glossary.md     │
                                            │                                   │
                            ┌───────────────┴───────────────────────────────────┘
                            │
                            ▼
                    [screen-generator]
                    (정책 ID 참조)
                            │
                            │ 08-screen-definition.md
                            ▼
                    [process-generator]
                    (정책 ID + 화면 ID 참조)
                            │
                            │ 모든 섹션.md
                            ▼
                    [quality-validator]
                            │
                            │ 검증 통과
                            ▼
                    [draftify-ppt]
                            │
                            ▼
                    <project>-draft-V{version}.pptx
```

---

## 4.4 결과 수집 및 반영 규칙

### 순차 수집 원칙
병렬 실행 결과는 **항상 순차적으로 수집**한다.

수집 순서:
1. 결과 수신
2. 충돌 여부 검증
3. 기준 충족 여부 판단
4. 반영 또는 폐기 결정

### 작업 단위/소유권 규칙
- **ID 생성 소유권**
  - 정책 ID: policy-generator만 생성/재할당
  - 화면/요소 ID: screen-generator만 생성/재할당
  - process-generator는 기존 ID만 참조
  - quality-validator는 읽기 전용
- **파일 소유권**
  - 각 섹션 파일은 해당 에이전트만 생성/수정
  - 오케스트레이터는 결과를 선택/수집만 수행 (직접 수정 금지)

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

### Phase 3-0: 기본 섹션 생성
- **목표**: 표지/이력/목차/섹션 타이틀/참고문헌/EOD 기본 섹션 생성
- **에이전트**: front-matter-generator, back-matter-generator (**병렬**)
- **출력**: `01-cover.md`, `02-revision-history.md`, `03-table-of-contents.md`, `04-section-divider.md`, `09-references.md`(옵션), `10-eod.md`
- **의존성**: Phase 2 완료 (analyzed-structure.json)

### Phase 3-1: 선행 섹션 생성
- **목표**: 정책 및 용어 섹션 생성
- **에이전트**: policy-generator, glossary-generator (**병렬**)
- **출력**: `06-policy-definition.md`, `05-glossary.md`
- **타임아웃**: 3분 (병렬 실행, 더 오래 걸리는 작업 기준)
- **실패 시**: 빈 섹션 생성 + 계속 진행
- **왜 선행?**: Phase 3-2가 정책 ID를 참조하기 때문
- **왜 병렬?**: 두 에이전트가 서로 의존성 없음 (동일한 analyzed-structure.json만 참조)

### Phase 3-2: 후행 섹션 생성
- **목표**: 화면 및 프로세스 섹션 생성
- **에이전트**: screen-generator → process-generator (순차)
- **출력**: `08-screen-definition.md`, `07-process-flow.md`
- **실패 시**: 부분 성공 (성공한 섹션만 포함)
- **왜 순차?**: process-generator가 08-screen-definition.md의 화면 ID를 참조하기 때문

### Phase 3.5: 품질 검증
- **목표**: 생성된 섹션들의 ID 참조 무결성 검증
- **에이전트**: quality-validator (단일)
- **출력**: `validation-report.md` (PASS/FAIL)
- **완료 후**: orchestrator 반환 → /auto-draft 스킬 계층
- **실패(FAIL) 시**: Phase 4 계속 진행 (경고 포함)

### Phase 4: PPT 생성 (/auto-draft 스킬 계층)
- **목표**: 마크다운 → PPT 변환
- **실행 주체**: /auto-draft 스킬 (orchestrator 아님)
- **호출 스킬**: /draftify-ppt
- **출력**: `<project>-draft-V{version}.pptx`
- **실패 시**: HTML 대체 버전 생성

> **Note**: Phase 4는 orchestrator가 아닌 /auto-draft 스킬 계층에서 실행됩니다.
> 이는 서브 에이전트가 스킬을 직접 호출할 수 없는 Claude Code 제약 때문입니다.

---

## 실행 순서 요약

**전체 워크플로우 순차 실행**:
```
┌─────────────── orchestrator 영역 ───────────────┐
│                                                  │
│ Phase 1 → Phase 2 → Phase 3-1 → Phase 3-2 → Phase 3.5
│                         ↓           ↓            │
│                 06-policy-definition.md          │
│                 05-glossary.md                   │
│                               08-screen-definition.md
│                                     ↓            │
│                               07-process-flow.md │
│                                                  │
└──────────────────────┬───────────────────────────┘
                       │ 결과 반환
                       ▼
┌─────────────── /auto-draft 스킬 영역 ────────────┐
│                                                  │
│ Phase 4: /draftify-ppt 호출 → <project>-draft-V{version}.pptx  │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Phase 3-2 내부 순서**:
1. screen-generator → 08-screen-definition.md 생성
2. process-generator → 08-screen-definition.md 참조하여 07-process-flow.md 생성

---

## 다음 단계

- **Phase 1 크롤링 상세**: [crawling-strategy.md](./crawling-strategy.md)
- **데이터 스키마**: [schemas.md](./schemas.md)
- **에러 핸들링**: [error-handling.md](./error-handling.md)
