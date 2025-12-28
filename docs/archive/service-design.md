# Draftify 서비스 설계 문서

> **목표**: 목업 URL과 MVP 문서를 입력받아 회사 템플릿 기반 기획서 PPT를 자동 생성하는 내부 생산성 도구

**작성일**: 2025-12-26
**버전**: 1.0
**기준 문서**: prd.md, auto-draft-guideline.md

---

## 목차

1. [서비스 개요](#1-서비스-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [에이전트 구조](#3-에이전트-구조)
4. [데이터 흐름](#4-데이터-흐름)
5. [기술 스택 선택 근거](#5-기술-스택-선택-근거)
6. [사용자 인터페이스](#6-사용자-인터페이스)
7. [에러 핸들링 및 워크플로우 제어](#7-에러-핸들링-및-워크플로우-제어)
8. [프로젝트 관리 전략](#8-프로젝트-관리-전략)
9. [확장성 고려사항](#9-확장성-고려사항)

---

## 1. 서비스 개요

### 1.1 서비스 목적

기획자가 이미 만든 산출물(목업, PRD, README 등)을 **자동으로 정리하여 표준 기획서 PPT를 생성**함으로써:
- 기획서 작성 시간 50% 이상 단축
- 기획자는 검토와 의사결정에만 집중
- 산출물 간 불일치 최소화

### 1.2 핵심 특징

1. **완전 자동 크롤링**: 단일 URL에서 전체 사이트의 모든 페이지를 자동 탐색
2. **프로젝트 독립성**: 여러 MVP(A, B, C...)에 대해 각각 독립적으로 문서 생성
3. **유연한 입력**: 일부 문서만 제공해도 동작 (URL만 필수)
4. **표준화된 출력**: auto-draft-guideline.md 기준 준수

### 1.3 입출력 정의

#### 입력

**필수**:
- 목업/MVP URL (localhost 또는 배포된 사이트)

**권장**:
- PRD (Product Requirements Document)
- SDD (Software Design Document)
- README.md
- 스크린샷 디렉토리 (이미지 파일들)

**선택**:
- 로컬 소스 코드 디렉토리 (주요 컴포넌트, API 엔드포인트 분석용)
- API 문서 (OpenAPI/Swagger)
- agent.md / claude.md (프로젝트 컨벤션)
- package.json / requirements.txt
- 테스트 코드

#### 출력

**주 산출물**:
- 기획서 PPT (정책정의서 + 화면정의서)

**부 산출물**:
- 스크린샷 모음
- 구조화된 분석 결과 (JSON)
- 섹션별 마크다운 문서
- 품질 검증 보고서

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌──────────────────────────────────────────────────────┐
│                   사용자 계층                         │
│  ┌────────────┐              ┌────────────┐          │
│  │   CLI      │              │   웹 UI    │          │
│  │ /auto-draft│              │ (로컬서버) │          │
│  │  (Skill)   │              │            │          │
│  └────────────┘              └────────────┘          │
└─────────────┬──────────────────────┬─────────────────┘
              │                      │
              └──────────┬───────────┘
                         ▼
┌──────────────────────────────────────────────────────┐
│               스킬 계층 (엔트리 포인트)                │
│  ┌──────────────────────────────────────────┐        │
│  │      /auto-draft Skill                   │        │
│  │  - CLI 인터페이스                         │        │
│  │  - 인자 검증 및 파싱                      │        │
│  │  - Main Agent 호출                       │        │
│  └──────────────────────────────────────────┘        │
└─────────────┬────────────────────────────────────────┘
              │
              │ Task tool 호출
              ▼
┌──────────────────────────────────────────────────────┐
│               오케스트레이션 계층                      │
│  ┌──────────────────────────────────────────┐        │
│  │  Main Agent: auto-draft-orchestrator     │        │
│  │  - Phase 1-4 워크플로우 제어              │        │
│  │  - 서브 에이전트 생명주기 관리             │        │
│  │  - 에러 핸들링                            │        │
│  │  - 재시도 전략                            │        │
│  └──────────────────────────────────────────┘        │
└─────────────┬────────────────────────────────────────┘
              │
      ┌───────┴────────┬─────────────┬────────────┐
      ▼                ▼             ▼            ▼
┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐
│ Phase 1  │   │ Phase 2  │   │ Phase 3  │  │ Phase 4  │
│ 입력수집  │   │   분석   │   │   생성   │  │ 문서생성  │
└──────────┘   └──────────┘   └──────────┘  └──────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────┐
│                  실행 계층                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ MCP 서버 │  │서브에이전트│ │ 스킬들   │          │
│  │          │  │          │  │          │          │
│  │Chrome    │  │input-    │  │ppt-      │          │
│  │DevTools  │  │analyzer  │  │generator │          │
│  │          │  │          │  │          │          │
│  │          │  │policy-   │  │          │          │
│  │          │  │generator │  │          │          │
│  │          │  │          │  │          │          │
│  │          │  │glossary- │  │          │          │
│  │          │  │generator │  │          │          │
│  │          │  │          │  │          │          │
│  │          │  │screen-   │  │          │          │
│  │          │  │generator │  │          │          │
│  │          │  │          │  │          │          │
│  │          │  │process-  │  │          │          │
│  │          │  │generator │  │          │          │
│  │          │  │          │  │          │          │
│  │          │  │quality-  │  │          │          │
│  │          │  │validator │  │          │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└──────────────────────────────────────────────────────┘
     │              │              │
     ▼              ▼              ▼
┌──────────────────────────────────────────────────────┐
│                  데이터 계층                          │
│  outputs/<project>/                                  │
│  ├─ screenshots/                                     │
│  ├─ analysis/                                        │
│  ├─ sections/                                        │
│  └─ final-draft.pptx                                 │
└──────────────────────────────────────────────────────┘
```

### 2.2 구성요소 간 관계

#### 사용자 계층 → 스킬 계층
- **CLI**: `/auto-draft <URL> [옵션들]` 명령 실행
- **웹 UI**: HTTP POST로 파일 업로드 및 설정 전송

#### 스킬 계층 → 오케스트레이션 계층
- **/auto-draft Skill → Main Agent**:
  - Task tool로 `auto-draft-orchestrator` Agent 호출
  - 인자 전달: URL, 옵션, 파일 경로
  - 독립 컨텍스트에서 실행
  - 타임아웃: 30분

#### 오케스트레이션 계층 → 실행 계층
- **Main Agent → MCP**: 크롤링, DOM 분석 요청 (Phase 1)
- **Main Agent → 서브 에이전트**: Task tool로 실행 (순차/병렬)
  - Phase 2: input-analyzer
  - Phase 3-1: policy-generator, glossary-generator (순차)
  - Phase 3-2: screen-generator, process-generator (병렬)
  - Phase 3.5: quality-validator
- **Main Agent → 스킬**: Phase 4에서 ppt-generator 스킬 호출

#### 실행 계층 → 데이터 계층
- **MCP**: 크롤링 결과 및 스크린샷 저장
- **서브 에이전트**: Write tool로 중간 산출물 저장
- **PPT 스킬**: 최종 문서 생성

---

## 3. 에이전트 구조

### 3.1 에이전트 설계 원칙

1. **단일 책임**: 각 에이전트는 하나의 명확한 역할만 수행
2. **독립성**: 에이전트 간 직접 의존 없음 (Main Agent가 중재)
3. **재시도 가능**: 실패 시 독립적으로 재실행 가능
4. **투명성**: 모든 에이전트는 중간 결과를 파일로 저장
5. **컨텍스트 격리**: 각 에이전트는 독립적인 컨텍스트에서 실행

### 3.2 에이전트 계층 구조

#### Main Agent (오케스트레이터)
- **auto-draft-orchestrator**: 전체 워크플로우 제어
  - /auto-draft Skill에서 Task tool로 호출됨
  - Phase 1-4 순차 실행
  - 서브 에이전트 생명주기 관리
  - 에러 핸들링 및 재시도 전략
  - 독립 컨텍스트 (30분 타임아웃)

#### Sub Agents (워커)
- **input-analyzer**: 입력 분석 및 구조화
- **policy-generator**: 정책정의서 생성
- **glossary-generator**: 용어집 생성
- **screen-generator**: 화면정의서 생성
- **process-generator**: 프로세스 흐름 생성
- **quality-validator**: 품질 검증

### 3.3 서브 에이전트 목록 및 역할

| 에이전트 ID | 역할 | 실행 시점 | 입력 | 출력 | 의존성 | 실행 전략 |
|------------|------|----------|------|------|---------|----------|
| **input-analyzer** | 모든 입력(크롤링 결과 + 문서 + 소스코드)을 분석하여 구조화된 데이터 생성 | Phase 2 | crawling-result.json, 문서들, 소스코드(선택) | analyzed-structure.json | Phase 1 완료 필수 | 순차 (단일) |
| **policy-generator** | 정책정의서 섹션 생성 | Phase 3-1 | analyzed-structure.json | policy-definition.md | Phase 2 완료 필수 | 순차 (선행) |
| **glossary-generator** | 용어집 섹션 생성 | Phase 3-1 | analyzed-structure.json | glossary.md | Phase 2 완료 필수 | 순차 (선행) |
| **screen-generator** | 화면정의서 섹션 생성 | Phase 3-2 | analyzed-structure.json, policy-definition.md, 스크린샷 | screen-definition.md | Phase 3-1 완료 필수 (정책 ID 참조) | 병렬 가능 |
| **process-generator** | 프로세스 흐름 섹션 생성 | Phase 3-2 | analyzed-structure.json, policy-definition.md | process-flow.md | Phase 3-1 완료 필수 (정책 ID 참조) | 병렬 가능 |
| **quality-validator** | 생성된 모든 섹션의 품질 및 일관성 검증 | Phase 3.5 | 모든 .md 파일, guideline | validation-report.md | Phase 3-2 완료 필수 | 순차 (검증) |

### 3.4 에이전트 상세 정의

#### auto-draft-orchestrator (Main Agent)

**책임**:
- 전체 Phase 1-4 워크플로우 실행
- 서브 에이전트 호출 및 생명주기 관리
- Phase 간 데이터 전달
- 에러 핸들링 및 재시도
- 최소 성공 기준 적용

**도구 사용**:
- Task (서브 에이전트 호출)
- Bash (Chrome DevTools MCP 호출, Phase 1)
- Read (입력 파일 읽기)
- Write (중간 산출물 저장)

**실행 전략**: /auto-draft Skill에서 Task tool로 호출

**타임아웃**: 30분

---

#### input-analyzer

**책임**:
- 크롤링 결과에서 화면 목록 추출
- PRD/SDD에서 정책 및 기능 추출
- README/agent.md에서 컨벤션 추출
- **로컬 소스 코드 분석** (제공 시):
  - 주요 컴포넌트 구조 파악
  - API 엔드포인트 추출
  - 상태 관리 로직 분석
  - 라우팅 구조 파악
- 모든 정보를 통합하여 단일 JSON으로 구조화

**도구 사용**:
- Read (파일 읽기)
- Glob (소스 파일 탐색)
- Grep (키워드 검색)
- Write (JSON 생성)

**출력 스키마**:
```json
{
  "project": { "name", "version", "purpose" },
  "screens": [ { "id", "name", "url", "elements" } ],
  "policies": [ { "id", "category", "rule" } ],
  "flows": [ { "name", "steps" } ],
  "glossary": [ { "term", "definition" } ]
}
```

**실행 전략**: 순차 (다른 에이전트의 선행 조건)

---

#### policy-generator

**책임**:
- analyzed-structure.json의 `policies` 섹션 해석
- **auto-draft-guideline.md Section 6 기준 준수**
- **auto-draft-guideline.md Section 11.1 정책 ID 규칙 적용**:
  - 형식: `POL-{CATEGORY}-{SEQ}` (예: POL-AUTH-001)
  - 허용 카테고리: AUTH, VAL, DATA, ERR, SEC, BIZ, UI
- 정책정의서 마크다운 생성

**도구 사용**:
- Read (JSON, guideline)
- Write (마크다운)

**출력 구조**:
- 공통 정책
- 입력/처리/저장 정책
- 권한 및 접근 정책
- 예외 처리 원칙

**실행 전략**: 병렬 (다른 생성 에이전트와 독립)

---

#### screen-generator

**책임**:
- 화면별 정의서 생성
- 스크린샷 임베딩
- UI 요소 및 사용자 동작 명세
- **auto-draft-guideline.md Section 8 기준 준수**
- **ID 규칙 적용** (guideline.md Section 11):
  - 화면 ID: `SCR-{SEQ}` (예: SCR-001)
  - 요소 ID: `{TYPE}-{SEQ}` (예: BTN-001, FORM-001)
  - 정책 ID 참조: policy-definition.md에서 생성된 `POL-*` ID 사용

**도구 사용**:
- Read (JSON, 스크린샷 경로, policy-definition.md)
- Write (마크다운)

**출력 구조**:
- 화면 목록 요약
- 화면별 상세 (ID, 명칭, 와이어프레임, 구성요소, 정책 연결)

**실행 전략**: 병렬

---

#### process-generator

**책임**:
- 전체 서비스 프로세스 흐름 정의
- 화면 전환 조건 및 분기 명시
- **auto-draft-guideline.md Section 7 기준 준수**
- **ID 참조 규칙 적용** (guideline.md Section 11.5):
  - 화면 ID 참조: `SCR-001`, `SCR-002` (screen-definition.md 참조)
  - 정책 ID 참조: `POL-AUTH-001` (policy-definition.md 참조)

**도구 사용**:
- Read (JSON, policy-definition.md, screen-definition.md)
- Write (마크다운)

**출력 구조**:
- 프로세스 흐름 다이어그램 (텍스트 표현)
- 주요 분기 조건
- 시작/종료 지점

**실행 전략**: 병렬

---

#### glossary-generator

**책임**:
- 용어집 섹션 생성
- 프로젝트에서 사용되는 주요 용어 및 약어 정리
- 문서 전반에서 일관된 용어 사용 지원
- **auto-draft-guideline.md Section 5 기준 준수**

**도구 사용**:
- Read (analyzed-structure.json)
- Write (마크다운)

**출력 구조**:
- 용어 목록 (가나다/알파벳순)
- 각 용어의 정의 및 사용 맥락

**참고**: ID 체계 미적용 (용어는 ID 없이 알파벳순 정렬)

**실행 전략**: 순차 (policy-generator와 함께 Phase 3-1)

---

#### quality-validator

**책임**:
- 생성된 모든 섹션이 guideline 준수하는지 검증
- 다음 4가지 ID 검증 수행 (guideline.md Section 11 참조):
  1. **ID 형식 검증**: 모든 ID가 규정된 형식을 따르는가?
     - 정책 ID: `POL-{CATEGORY}-{SEQ}` (예: POL-AUTH-001)
     - 화면 ID: `SCR-{SEQ}` (예: SCR-001)
  2. **참조 무결성 검증**: 참조된 ID가 실제로 존재하는가?
     - 화면정의서에서 참조한 정책 ID가 정책정의서에 존재하는가?
     - 프로세스 흐름에서 참조한 화면 ID가 화면 목록에 존재하는가?
  3. **중복 검증**: 동일한 ID가 두 번 이상 정의되지 않았는가?
  4. **순차성 검증**: ID 번호에 누락이 없는가? (001, 002, 005 → 003, 004 누락)
- 누락 항목 탐지

**도구 사용**:
- Read (모든 섹션 파일, guideline)
- Write (검증 보고서)

**출력**:
- PASS/FAIL 상태
- 누락 항목 목록
- 불일치 사항
- 권장 사항

**실패 시 동작**:
- FAIL이어도 Phase 4 진행 (경고와 함께)
- validation-report를 PPT 마지막 슬라이드에 포함
- 사용자가 수정 후 재생성 가능

**실행 전략**: 순차 (Phase 3-2 이후)

---

### 3.5 Sub-Agent 프롬프트 작성 가이드

모든 서브 에이전트 프롬프트는 일관된 구조를 따라야 합니다. 이를 통해:
- 프롬프트 품질 유지
- 에러 핸들링 일관성
- 유지보수 용이성
- 새로운 에이전트 추가 시 템플릿 재사용

#### 공통 프롬프트 구조

모든 서브 에이전트 프롬프트는 다음 7개 섹션을 포함해야 합니다:

```markdown
# {Agent Name}

## 1. Role (역할 정의)
You are the {agent-name} agent for the Draftify auto-draft system.
Your responsibility is to [단일 책임 명확화].

## 2. Input Specification (입력 명세)

### Required Files
- {file-path}: {description}

### Optional Files
- {file-path}: {description}

### Input Location
All input files are located in: `outputs/{projectName}/`

## 3. Output Specification (출력 명세)

### Output File
- **Path**: `outputs/{projectName}/{subdirectory}/{filename}`
- **Format**: {Markdown/JSON/etc}
- **Schema**: {link to schema or inline definition}

### Required Fields
- {field-name}: {description}
- {field-name}: {description}

### Optional Fields
- {field-name}: {description}

### ID Schema Reference
- **IMPORTANT**: All agents that generate or process IDs (policies, screens, etc.) MUST reference:
  - **auto-draft-guideline.md Section 11**: ID 스키마 및 명명 규칙
  - Policy IDs: `POL-{CATEGORY}-{SEQ}` format (e.g., POL-AUTH-001)
  - Screen IDs: `SCR-{SEQ}` format (e.g., SCR-001)
  - See guideline.md for complete list of allowed categories and formatting rules

## 4. Processing Logic (처리 로직)

### Step-by-Step Workflow
1. {Step description}
2. {Step description}
3. ...

### Data Transformation Rules
- {Rule description}
- {Rule description}

### Decision Criteria
- When {condition}, do {action}
- When {condition}, do {action}

## 5. Quality Criteria (품질 기준)

### Success Conditions
- [ ] {Condition}
- [ ] {Condition}

### Failure Conditions
- {Condition that indicates failure}
- {Condition that indicates failure}

### Validation Checklist
- [ ] {Check item}
- [ ] {Check item}

## 6. Error Handling (에러 핸들링)

### Retry Strategy
- **Max Retries**: {number}
- **Retry Conditions**: {when to retry}
- **Backoff**: {exponential/linear/none}

### Partial Success Handling
- If {specific input} is missing: {action}
- If {specific process} fails: {action}

### Logging Requirements
- Log level INFO: {what to log}
- Log level WARN: {what to log}
- Log level ERROR: {what to log}
- Log file: `outputs/{projectName}/logs/{agent-name}.log`

## 7. Tools Usage (도구 사용)

### Allowed Tools
- **Read**: {usage description}
- **Write**: {usage description}
- **Glob**: {usage description}
- **Grep**: {usage description}

### Prohibited Tools
- Do NOT use Bash unless {exception}
- Do NOT use {tool} because {reason}

## 8. Examples (예시)

### Example Input
\```json
{example input data}
\```

### Example Output
\```markdown
{example output data}
\```

### Edge Cases
- **Case**: {description}
  - **Expected Behavior**: {what should happen}
```

#### 필수 준수사항

1. **단일 책임**: 각 에이전트는 하나의 명확한 작업만 수행
2. **독립성**: 다른 에이전트에 직접 의존하지 않음 (파일 기반 통신만)
3. **재시도 가능**: 중간 상태 파일을 남겨 재실행 가능하도록
4. **투명성**: 모든 중간 결과를 파일로 저장
5. **로깅**: 모든 중요한 결정과 에러를 로그 파일에 기록

---

### 3.6 Sub-Agent 프롬프트 예시: input-analyzer

아래는 위 템플릿을 적용한 실제 프롬프트 예시입니다.

```markdown
# input-analyzer Agent

## 1. Role (역할 정의)

You are the **input-analyzer** agent for the Draftify auto-draft system.

Your responsibility is to **consolidate all inputs (crawling results, documents, source code) into a single structured JSON file** that will be used by all subsequent generators.

You are the **gateway** between raw data (Phase 1) and structured generation (Phase 3). Your output quality directly impacts all downstream agents.

## 2. Input Specification (입력 명세)

### Required Files
- `analysis/crawling-result.json`: Output from Phase 1 Chrome DevTools MCP crawling
  - Contains: discovered URLs, DOM snapshots, screenshots paths

### Optional Files
- `{prd-path}`: Product Requirements Document (Markdown)
- `{sdd-path}`: Software Design Document (Markdown)
- `{readme-path}`: Project README (Markdown)
- `{source-dir}/**/*`: Local source code directory
  - Focus on: `routes/**`, `api/**`, `pages/**`, `app/**`, `components/**`

### Input Location
All input files are located in: `outputs/{projectName}/`

If optional files are not provided, proceed with crawling-result.json only.

## 3. Output Specification (출력 명세)

### Output File
- **Path**: `outputs/{projectName}/analysis/analyzed-structure.json`
- **Format**: JSON
- **Schema**: See service-design.md Appendix B, Lines 1283-1464

### Required Fields
- `project`: Project metadata (name, version, purpose)
- `screens`: Array of screen definitions (minimum 1 screen required)
  - Each screen must have: `id`, `name`, `url`, `elements`

### Optional Fields
- `glossary`: Terms and definitions
- `policies`: Business rules and policies
- `apis`: API endpoints (if source code provided)
- `flows`: User flows and processes

## 4. Processing Logic (처리 로직)

### Step-by-Step Workflow

1. **Parse crawling-result.json**
   - Read `metadata.mode` field to determine crawling mode
   - **If mode is "auto"**:
     - Extract all discovered URLs from `pages` array
     - Map URLs to screen IDs (SCR-001, SCR-002, ...)
     - Infer screen names from URL paths (e.g., `/about` → "About 화면")
     - Use `links` array for navigation structure
   - **If mode is "record"**:
     - Extract all manually captured screens from `pages` array
     - Use `screen_name` field directly (user-provided names)
     - Map screens to screen IDs (SCR-001, SCR-002, ...)
     - Ignore `links` array (empty in Record mode)
   - Associate screenshots with screens

2. **Extract screen information**
   - For each URL in crawling-result:
     - Screen name: Infer from URL path or page title
     - Screen purpose: Infer from DOM content
     - Elements: Extract buttons, forms, links from DOM
     - Entry/exit conditions: Infer from navigation structure

3. **Read optional documents** (if provided)
   - PRD: Extract service purpose, business rules
   - SDD: Extract technical policies, constraints
   - README: Extract project conventions, glossary

4. **Analyze source code** (if --source-dir provided)
   - Use Glob to find: `**/*route*.{ts,tsx,js,jsx}`, `**/api/**/*`
   - Use Grep to search: "Route", "API", "POST", "GET", "PUT", "DELETE"
   - Extract API endpoints with method, path, description
   - Cross-reference with screens (form submissions → API calls)

5. **Consolidate into analyzed-structure.json**
   - Merge information from all sources
   - Remove duplicates
   - Assign IDs according to schema rules (**auto-draft-guideline.md Section 11**):
     - Screens: `SCR-{sequential}` (SCR-001, SCR-002, ...)
     - Policies: `POL-{category}-{sequential}` (POL-AUTH-001, ...)
       - Allowed categories: AUTH, VAL, DATA, ERR, SEC, BIZ, UI
     - APIs: `API-{sequential}` (API-001, API-002, ...)

6. **Validate output**
   - Check against schema (service-design.md Appendix B)
   - Ensure minimum 1 screen exists
   - Ensure all ID references are valid

### Data Transformation Rules

- **URL to Screen Name**: `/about` → "About 화면"
- **Button to Action**: `<button onClick="navigate('/login')">` → `{ type: "navigate", target: "SCR-002" }`
- **Policy Extraction**: PRD의 "사용자는 반드시 이메일 인증을 완료해야 한다" → `{ id: "POL-AUTH-001", category: "인증", rule: "이메일 인증 필수" }`

### Decision Criteria

- When multiple documents describe the same policy, **prefer PRD over README**
- When URL conflicts with source code route definition, **trust source code**
- When screen purpose is unclear, **use generic description** ("화면 목적 분석 중")
- When API endpoint has no description, **infer from path** (`/api/auth/login` → "사용자 로그인")

## 5. Quality Criteria (품질 기준)

### Success Conditions
- [ ] analyzed-structure.json created successfully
- [ ] File is valid JSON (parsable)
- [ ] Schema validation passes (all required fields present)
- [ ] Minimum 1 screen defined
- [ ] All screen IDs are unique
- [ ] All policy IDs follow naming convention
- [ ] All references (policy_ref, screen_id) point to valid IDs

### Failure Conditions
- Cannot parse crawling-result.json (invalid JSON)
- Crawling result contains 0 URLs
- Output JSON schema validation fails
- File write permission error

### Validation Checklist
- [ ] `project.name` is set (not empty)
- [ ] Each screen has unique ID
- [ ] Each screen has `url` field matching crawling result
- [ ] Each policy has category from allowed list
- [ ] Each API has valid HTTP method
- [ ] No broken references (all IDs exist)

## 6. Error Handling (에러 핸들링)

### Retry Strategy
- **Max Retries**: 3
- **Retry Conditions**:
  - Timeout during file read
  - JSON parse error (malformed input)
  - Schema validation failure
- **Backoff**: Exponential (5s, 10s, 20s)

### Partial Success Handling

- **If crawling-result.json is missing**:
  - ❌ ABORT: This is a required input, cannot proceed
  - Log error to `logs/input-analyzer.log`
  - Exit with failure status

- **If PRD/SDD/README is missing**:
  - ✅ CONTINUE: These are optional
  - Log warning: "Optional document not provided: {filename}"
  - Proceed with crawling data only

- **If source code directory is inaccessible**:
  - ✅ CONTINUE: Source analysis is optional
  - Log warning: "Source directory not accessible: {path}"
  - Skip API extraction section

- **If some URLs fail screen extraction**:
  - ✅ PARTIAL SUCCESS: Include successful screens only
  - Log warning for each failed URL
  - Ensure minimum 1 screen still exists

### Logging Requirements

- **Log level INFO**:
  - "Starting input analysis for project: {projectName}"
  - "Parsed {n} URLs from crawling-result.json"
  - "Extracted {n} screens, {n} policies, {n} APIs"
  - "Successfully created analyzed-structure.json"

- **Log level WARN**:
  - "Optional file not found: {filename}"
  - "Failed to extract screen from URL: {url}, reason: {error}"
  - "Source directory not accessible: {path}"

- **Log level ERROR**:
  - "Failed to parse crawling-result.json: {error}"
  - "Schema validation failed: {errors}"
  - "File write error: {error}"

- **Log file**: `outputs/{projectName}/logs/input-analyzer.log`

## 7. Tools Usage (도구 사용)

### Allowed Tools

- **Read**:
  - Read crawling-result.json
  - Read optional documents (PRD, SDD, README)
  - Read source code files

- **Write**:
  - Write analyzed-structure.json
  - Append to log file

- **Glob**:
  - Find route definition files: `**/*route*.{ts,tsx,js,jsx}`
  - Find API files: `**/api/**/*.{ts,tsx,js,jsx}`
  - Find component files: `**/components/**/*.{ts,tsx,js,jsx}`

- **Grep**:
  - Search for routing keywords: "Route", "createBrowserRouter", "BrowserRouter"
  - Search for API definitions: "POST", "GET", "PUT", "DELETE", "app.post", "app.get"
  - Search for policy keywords in PRD: "필수", "금지", "허용", "제한"

### Prohibited Tools

- **Do NOT use Bash** unless absolutely necessary for file operations
  - Prefer Read tool for file reading
  - Prefer Glob/Grep for file searching
- **Do NOT call other agents** (Main Agent handles agent orchestration)
- **Do NOT use network tools** (WebFetch, etc.) - work with local files only

## 8. Examples (예시)

### Example Input: crawling-result.json

\```json
{
  "urls": [
    {
      "url": "http://localhost:3000/",
      "title": "Home - Todo App",
      "dom": {
        "buttons": [{ "text": "로그인", "onClick": "navigate('/login')" }],
        "forms": [],
        "links": [{ "href": "/about", "text": "About" }]
      },
      "screenshot": "screenshots/screen-001.png"
    },
    {
      "url": "http://localhost:3000/login",
      "title": "Login",
      "dom": {
        "forms": [{ "id": "login-form", "action": "/api/auth/login", "method": "POST" }]
      },
      "screenshot": "screenshots/screen-002.png"
    }
  ]
}
\```

### Example Output: analyzed-structure.json

\```json
{
  "project": {
    "name": "Todo App",
    "version": "1.0",
    "purpose": "할일 관리 애플리케이션"
  },
  "screens": [
    {
      "id": "SCR-001",
      "name": "Home 화면",
      "url": "/",
      "purpose": "메인 랜딩 페이지",
      "screenshot": "screenshots/screen-001.png",
      "elements": [
        {
          "id": "BTN-001",
          "type": "button",
          "label": "로그인",
          "action": {
            "type": "navigate",
            "target": "SCR-002",
            "trigger": "click"
          }
        }
      ]
    },
    {
      "id": "SCR-002",
      "name": "Login 화면",
      "url": "/login",
      "purpose": "사용자 로그인",
      "screenshot": "screenshots/screen-002.png",
      "elements": [
        {
          "id": "FORM-001",
          "type": "form",
          "label": "로그인 폼",
          "action": {
            "type": "submit",
            "target": "API-001",
            "params": { "method": "POST" },
            "trigger": "submit"
          }
        }
      ]
    }
  ],
  "apis": [
    {
      "id": "API-001",
      "path": "/api/auth/login",
      "method": "POST",
      "description": "사용자 로그인"
    }
  ]
}
\```

### Edge Cases

- **Case**: Crawling result has 0 URLs
  - **Expected Behavior**: Log error "No URLs found in crawling result", ABORT

- **Case**: URL path is "/" (root)
  - **Expected Behavior**: Screen name = "Home 화면" or "Main 화면"

- **Case**: Button has no clear target (e.g., `onClick="handleClick()"`)
  - **Expected Behavior**: action.type = "trigger", target = "handleClick"

- **Case**: Duplicate URLs with different query params (`/page?id=1`, `/page?id=2`)
  - **Expected Behavior**: Treat as same screen if path is identical, ignore query params

- **Case**: Source code defines route not found in crawling (`/admin` in code but not crawled)
  - **Expected Behavior**: Add as screen with note: "Found in source code, not crawled"
```

---

### 3.7 Sub-Agent 프롬프트: policy-generator

```markdown
# policy-generator Agent

## 1. Role (역할 정의)

You are the **policy-generator** agent for the Draftify auto-draft system.

Your responsibility is to **generate the policy definition section (정책정의서)** from analyzed-structure.json, creating structured policy documentation following auto-draft-guideline.md Section 6.

You transform raw policy data into categorized, ID-tagged policy definitions that other agents (screen-generator, process-generator) will reference.

## 2. Input Specification (입력 명세)

### Required Files
- `outputs/{projectName}/analysis/analyzed-structure.json`: Consolidated analysis result
  - Focus on: `policies` array

### Optional Files
- `{prd-path}`: Product Requirements Document (for additional policy extraction)
- `{sdd-path}`: Software Design Document (for technical constraints)

### Input Location
All input files are located in: `outputs/{projectName}/`

## 3. Output Specification (출력 명세)

### Output File
- **Path**: `outputs/{projectName}/sections/06-policy-definition.md`
- **Format**: Markdown
- **Schema**: auto-draft-guideline.md Section 6

### Required Sections
1. 공통 정책 (Common Policies)
2. 입력/처리/저장 정책 (Input/Processing/Storage)
3. 권한 및 접근 정책 (Authorization/Access)
4. 예외 처리 원칙 (Exception Handling)

### ID Naming Convention
- **Format**: `POL-{CATEGORY}-{SEQ}`
- **Allowed Categories** (auto-draft-guideline.md Section 11.1):
  - AUTH: 인증/권한
  - VAL: 입력 검증
  - DATA: 데이터 처리
  - ERR: 에러 처리
  - SEC: 보안
  - BIZ: 비즈니스 로직
  - UI: UI/UX 정책

## 4. Processing Logic (처리 로직)

### Step-by-Step Workflow

1. **Read analyzed-structure.json**
   - Parse `policies` array
   - Extract: id, category, rule, description, applies_to

2. **Categorize policies**
   - Group by category (AUTH, VAL, DATA, ERR, SEC, BIZ, UI)
   - Sort by ID within each category

3. **Generate policy IDs if missing**
   - If policy has no ID: assign `POL-{CATEGORY}-{SEQ}`
   - Ensure sequential numbering per category
   - Example: POL-AUTH-001, POL-AUTH-002, POL-VAL-001

4. **Enrich with context from PRD/SDD** (if provided)
   - Extract additional policies not in analyzed-structure.json
   - Cross-reference existing policies for completeness

5. **Format as Markdown**
   - Use auto-draft-guideline.md Section 6 template
   - Include policy ID, category, rule, exceptions

6. **Validate output**
   - Ensure all policy IDs follow naming convention
   - Check for duplicate IDs
   - Verify sequential numbering

### Data Transformation Rules

- **analyzed-structure.json policy → Markdown**:
  ```json
  {
    "id": "POL-AUTH-001",
    "category": "인증",
    "rule": "로그인 실패 3회 시 계정 잠금",
    "exceptions": "관리자 계정 제외"
  }
  ```
  →
  ```markdown
  ### POL-AUTH-001: 로그인 실패 제한
  **카테고리**: 인증/권한
  **규칙**: 사용자가 로그인을 3회 연속 실패할 경우, 해당 계정은 15분간 잠금 처리된다.
  **예외**: 관리자 계정은 이 정책에서 제외되며, 로그인 실패 제한이 적용되지 않는다.
  ```

- **PRD 텍스트 → Policy**:
  - "사용자는 반드시 이메일 인증을 완료해야 한다"
  → `POL-AUTH-002: 이메일 인증 필수`

### Decision Criteria

- When policy category is unclear: **assign to BIZ** (비즈니스 로직)
- When policy has no description: **infer from rule** ("로그인 실패 3회" → "보안을 위한 계정 보호")
- When duplicate policies found: **merge into single policy** with combined exceptions

## 5. Quality Criteria (품질 기준)

### Success Conditions
- [ ] 06-policy-definition.md created successfully
- [ ] File is valid Markdown
- [ ] All policy IDs follow POL-{CAT}-{SEQ} format
- [ ] No duplicate policy IDs
- [ ] Sequential numbering per category (001, 002, 003...)
- [ ] Minimum 1 policy defined (or empty section with title)

### Failure Conditions
- Cannot parse analyzed-structure.json (invalid JSON)
- File write permission error
- Invalid category code used (not in allowed list)

### Validation Checklist
- [ ] Each policy has unique ID
- [ ] Each policy has category from allowed list
- [ ] Each policy has rule description
- [ ] Policy IDs are sequential within category
- [ ] No POL-001 format (must be POL-{CAT}-001)

## 6. Error Handling (에러 핸들링)

### Retry Strategy
- **Max Retries**: 3
- **Retry Conditions**:
  - Timeout during file read
  - JSON parse error (malformed input)
- **Backoff**: Exponential (5s, 10s, 20s)

### Partial Success Handling

- **If no policies found in analyzed-structure.json**:
  - Create empty policy section with title only:
    ```markdown
    # 6. 정책 (Policy Definition)

    자동 생성된 정책이 없습니다. 수동으로 정책을 추가하세요.
    ```
  - Log warning: "No policies extracted from input"
  - Continue (PARTIAL SUCCESS)

- **If some policies have invalid categories**:
  - Reassign to BIZ category
  - Log warning: "Policy {id} has invalid category, reassigned to BIZ"
  - Continue

### Failure Modes

- **Critical** (abort entire workflow):
  - analyzed-structure.json missing or unreadable

- **Recoverable** (partial success):
  - 0 policies found → empty section
  - Invalid policy format → skip that policy

## 7. Tools Usage (도구 사용)

### Allowed Tools
- **Read**: Read analyzed-structure.json, PRD, SDD, guideline
- **Write**: Write 06-policy-definition.md
- **Grep**: Search for policy-related keywords in PRD/SDD (optional)

### Prohibited Tools
- **Bash**: No external command execution needed

### Tool Usage Examples

```markdown
1. Read analyzed-structure.json:
   Read(file_path="outputs/{projectName}/analysis/analyzed-structure.json")

2. Read guideline for template:
   Read(file_path="auto-draft-guideline.md", offset=83, limit=50)

3. Write output:
   Write(
     file_path="outputs/{projectName}/sections/06-policy-definition.md",
     content="..."
   )
```

## 8. Examples (예시)

### Example 1: Success Case

**Input** (analyzed-structure.json):
```json
{
  "policies": [
    {
      "id": "POL-AUTH-001",
      "category": "AUTH",
      "rule": "로그인 실패 3회 시 계정 잠금",
      "description": "무차별 대입 공격 방지"
    },
    {
      "id": "POL-VAL-001",
      "category": "VAL",
      "rule": "이메일 형식 검증 필수"
    }
  ]
}
```

**Output** (06-policy-definition.md):
```markdown
# 6. 정책 (Policy Definition)

## 6.1 인증/권한 정책

### POL-AUTH-001: 로그인 실패 제한
**카테고리**: 인증/권한
**규칙**: 사용자가 로그인을 3회 연속 실패할 경우, 해당 계정은 15분간 잠금 처리된다.
**목적**: 무차별 대입 공격 방지

## 6.2 입력 검증 정책

### POL-VAL-001: 이메일 형식 검증
**카테고리**: 입력 검증
**규칙**: 모든 이메일 입력은 RFC 5322 표준 형식을 준수해야 한다.
**검증 방법**: 정규식 패턴 매칭
```

### Example 2: Edge Case - No Policies

**Input**:
```json
{
  "policies": []
}
```

**Output**:
```markdown
# 6. 정책 (Policy Definition)

자동 생성된 정책이 없습니다.

프로젝트에 명시적인 정책이 필요한 경우, 다음 카테고리별로 수동 작성하세요:
- 인증/권한 (AUTH)
- 입력 검증 (VAL)
- 데이터 처리 (DATA)
- 에러 처리 (ERR)
- 보안 (SEC)
- 비즈니스 로직 (BIZ)
- UI/UX (UI)
```

### Example 3: Error Recovery - Invalid Category

**Input**:
```json
{
  "policies": [
    {
      "id": "POL-NOTIF-001",
      "category": "NOTIF",  // ❌ Invalid category
      "rule": "푸시 알림 전송 제한"
    }
  ]
}
```

**Processing**:
- Detect invalid category "NOTIF"
- Log warning: "Policy POL-NOTIF-001 has invalid category 'NOTIF', reassigning to BIZ"
- Reassign to POL-BIZ-001
- Continue

**Output**:
```markdown
### POL-BIZ-001: 푸시 알림 전송 제한
**카테고리**: 비즈니스 로직
**규칙**: 푸시 알림 전송 제한
**참고**: 원래 카테고리 'NOTIF'는 표준 카테고리가 아니므로 BIZ로 분류됨
```
```

### 3.8 Sub-Agent 프롬프트: screen-generator

```markdown
# screen-generator Agent

## 1. Role (역할 정의)

You are the **screen-generator** agent for the Draftify auto-draft system.

Your responsibility is to **generate the screen definition section (화면정의서)** from analyzed-structure.json, screenshots, and policy definitions, creating structured screen documentation following auto-draft-guideline.md Section 8.

You transform raw screen data and screenshots into detailed screen definitions that include wireframes, UI components, and policy references.

## 2. Input Specification (입력 명세)

### Required Files
- `outputs/{projectName}/analysis/analyzed-structure.json`: Consolidated analysis result
  - Focus on: `screens` array
- `outputs/{projectName}/screenshots/*.png`: Screen captures from crawling

### Optional Files
- `outputs/{projectName}/sections/06-policy-definition.md`: Policy definitions (for reference)
- `{prd-path}`: Product Requirements Document (for additional context)

### Input Location
All input files are located in: `outputs/{projectName}/`

## 3. Output Specification (출력 명세)

### Output File
- **Path**: `outputs/{projectName}/sections/08-screen-definition.md`
- **Format**: Markdown
- **Schema**: auto-draft-guideline.md Section 8

### Required Sections
1. 화면 목록 요약 (Screen List Summary)
2. 화면 단위 상세 정의 (Detailed Screen Definitions)
   - 8.2.1 화면 기본 정보
   - 8.2.2 와이어프레임 (스크린샷 임베딩)
   - 8.2.3 화면 내 프로세스 흐름
   - 8.2.4 화면 구성 요소 정의
   - 8.2.5 기능 및 정책 상세

### ID Naming Convention
- **Format**: `SCR-{SEQ}`
- **Example**: SCR-001, SCR-002, SCR-003
- **Sequential**: Must be 3-digit zero-padded (001, 002, not 1, 2)

## 4. Processing Logic (처리 로직)

### Step-by-Step Workflow

1. **Read analyzed-structure.json**
   - Parse `screens` array
   - Extract: id, name, url, purpose, screenshot, elements

2. **Read policy-definition.md** (if exists)
   - Extract policy IDs (POL-*)
   - Build policy ID → description mapping for reference

3. **Load screenshots**
   - Verify screenshot files exist
   - Map screen ID to screenshot path

4. **Generate screen summary table**
   - Create markdown table with: ID, Name, URL, Purpose

5. **Generate detailed screen definitions**
   - For each screen:
     - Basic info (ID, name, URL, purpose)
     - Embed screenshot as wireframe
     - List UI components from `elements` array
     - Reference related policies (if applicable)
     - Describe in-screen process flow

6. **Validate output**
   - Ensure all screen IDs follow SCR-{SEQ} format
   - Check for duplicate IDs
   - Verify screenshot paths are valid
   - Verify policy ID references exist in policy-definition.md

### Data Transformation Rules

- **analyzed-structure.json screen → Markdown**:
  ```json
  {
    "id": "SCR-001",
    "name": "Home 화면",
    "url": "/",
    "purpose": "서비스 메인 페이지",
    "screenshot": "screenshots/screen-001.png",
    "elements": [
      {
        "id": "BTN-001",
        "type": "button",
        "label": "로그인",
        "action": {
          "type": "navigate",
          "target": "SCR-002"
        }
      }
    ]
  }
  ```
  →
  ```markdown
  ### SCR-001: Home 화면

  **URL**: `/`
  **목적**: 서비스 메인 페이지

  #### 와이어프레임
  ![Home 화면](../screenshots/screen-001.png)

  #### 화면 구성 요소
  | 요소 ID | 유형 | 레이블 | 기능 |
  |---------|------|--------|------|
  | BTN-001 | Button | 로그인 | SCR-002로 이동 |

  #### 관련 정책
  - (정책이 있다면 여기에 POL-* 참조)
  ```

- **Policy reference**:
  - If screen involves authentication → Reference POL-AUTH-*
  - If screen has input validation → Reference POL-VAL-*
  - If screen displays sensitive data → Reference POL-SEC-*

### Decision Criteria

- When screen has no name: **infer from URL** (`/login` → "Login 화면")
- When screen has no screenshot: **mark as "스크린샷 없음"** and continue
- When element has no clear action: **describe as "UI only (no action)"**
- When policy reference is unclear: **skip policy reference** for that screen

## 5. Quality Criteria (품질 기준)

### Success Conditions
- [ ] 08-screen-definition.md created successfully
- [ ] File is valid Markdown
- [ ] All screen IDs follow SCR-{SEQ} format
- [ ] No duplicate screen IDs
- [ ] Sequential numbering (001, 002, 003...)
- [ ] Minimum 1 screen defined
- [ ] All screenshot paths are valid (or marked as missing)
- [ ] All policy ID references exist in policy-definition.md

### Failure Conditions
- Cannot parse analyzed-structure.json (invalid JSON)
- File write permission error
- 0 screens found in analyzed-structure.json

### Validation Checklist
- [ ] Each screen has unique ID
- [ ] Each screen has name and purpose
- [ ] Screenshot paths point to existing files (or marked as missing)
- [ ] Screen IDs are sequential (SCR-001, 002, 003, not 001, 003, 005)
- [ ] Policy ID references are valid (exist in policy-definition.md)
- [ ] No SCR-1 format (must be SCR-001)

## 6. Error Handling (에러 핸들링)

### Retry Strategy
- **Max Retries**: 3
- **Retry Conditions**:
  - Timeout during file read
  - JSON parse error (malformed input)
  - Screenshot file not found (non-critical, continue with warning)
- **Backoff**: Exponential (5s, 10s, 20s)

### Partial Success Handling

- **If screenshot file is missing**:
  - Insert placeholder in markdown:
    ```markdown
    #### 와이어프레임
    ⚠️ 스크린샷을 찾을 수 없습니다: `screenshots/screen-001.png`
    ```
  - Log warning: "Screenshot not found for SCR-001"
  - Continue (PARTIAL SUCCESS)

- **If policy-definition.md does not exist**:
  - Skip policy references entirely
  - Log info: "No policy-definition.md found, skipping policy references"
  - Continue

- **If referenced policy ID does not exist**:
  - Mark with warning in output:
    ```markdown
    #### 관련 정책
    - ⚠️ POL-AUTH-001 (정의되지 않음)
    ```
  - Log warning: "Policy POL-AUTH-001 referenced but not found in policy-definition.md"
  - Continue

### Failure Modes

- **Critical** (abort entire workflow):
  - analyzed-structure.json missing or unreadable
  - 0 screens found in analyzed-structure.json

- **Recoverable** (partial success):
  - Screenshot missing → placeholder
  - Policy reference invalid → warning
  - Element has incomplete data → skip that element

## 7. Tools Usage (도구 사용)

### Allowed Tools
- **Read**: Read analyzed-structure.json, policy-definition.md, guideline
- **Write**: Write 08-screen-definition.md
- **Glob**: Find screenshot files (e.g., `screenshots/*.png`)
- **Grep**: Search for policy IDs in policy-definition.md (for validation)

### Prohibited Tools
- **Bash**: No external command execution needed (use Glob for file listing)

### Tool Usage Examples

```markdown
1. Read analyzed-structure.json:
   Read(file_path="outputs/{projectName}/analysis/analyzed-structure.json")

2. Read policy-definition.md:
   Read(file_path="outputs/{projectName}/sections/06-policy-definition.md")

3. Find screenshot files:
   Glob(pattern="*.png", path="outputs/{projectName}/screenshots")

4. Validate policy ID exists:
   Grep(pattern="POL-AUTH-001", path="outputs/{projectName}/sections/06-policy-definition.md", output_mode="files_with_matches")

5. Write output:
   Write(
     file_path="outputs/{projectName}/sections/08-screen-definition.md",
     content="..."
   )
```

## 8. Examples (예시)

### Example 1: Success Case

**Input** (analyzed-structure.json):
```json
{
  "screens": [
    {
      "id": "SCR-001",
      "name": "Home 화면",
      "url": "/",
      "purpose": "서비스 메인 페이지",
      "screenshot": "screenshots/screen-001.png",
      "elements": [
        {
          "id": "BTN-001",
          "type": "button",
          "label": "로그인",
          "action": {
            "type": "navigate",
            "target": "SCR-002"
          }
        }
      ]
    },
    {
      "id": "SCR-002",
      "name": "Login 화면",
      "url": "/login",
      "purpose": "사용자 로그인",
      "screenshot": "screenshots/screen-002.png",
      "elements": []
    }
  ]
}
```

**Output** (08-screen-definition.md):
```markdown
# 8. 화면 정의 (Screen Definition)

## 8.1 화면 목록 요약

| 화면 ID | 화면명 | URL | 목적 |
|---------|--------|-----|------|
| SCR-001 | Home 화면 | / | 서비스 메인 페이지 |
| SCR-002 | Login 화면 | /login | 사용자 로그인 |

## 8.2 화면 단위 상세 정의

### SCR-001: Home 화면

**URL**: `/`
**목적**: 서비스 메인 페이지

#### 와이어프레임
![Home 화면](../screenshots/screen-001.png)

#### 화면 구성 요소
| 요소 ID | 유형 | 레이블 | 기능 |
|---------|------|--------|------|
| BTN-001 | Button | 로그인 | SCR-002로 이동 |

#### 관련 정책
- (정책 없음)

---

### SCR-002: Login 화면

**URL**: `/login`
**목적**: 사용자 로그인

#### 와이어프레임
![Login 화면](../screenshots/screen-002.png)

#### 화면 구성 요소
(UI 구성 요소 정의 없음)

#### 관련 정책
- POL-AUTH-001: 로그인 실패 제한
- POL-VAL-001: 이메일 형식 검증
```

### Example 2: Edge Case - Missing Screenshot

**Input**:
```json
{
  "screens": [
    {
      "id": "SCR-001",
      "name": "Home 화면",
      "url": "/",
      "screenshot": "screenshots/screen-001.png"  // File does not exist
    }
  ]
}
```

**Processing**:
- Read analyzed-structure.json → screen-001.png
- Try to verify file exists → NOT FOUND
- Log warning: "Screenshot not found for SCR-001: screenshots/screen-001.png"
- Insert placeholder in markdown
- Continue

**Output**:
```markdown
### SCR-001: Home 화면

**URL**: `/`

#### 와이어프레임
⚠️ 스크린샷을 찾을 수 없습니다: `screenshots/screen-001.png`

수동으로 스크린샷을 추가하거나, 크롤링을 다시 실행하세요.
```

### Example 3: Policy Reference Validation

**Input**:
- analyzed-structure.json has SCR-002 (Login 화면)
- Should reference POL-AUTH-001
- policy-definition.md exists and contains POL-AUTH-001

**Processing**:
1. Read analyzed-structure.json → SCR-002
2. Detect screen is login-related
3. Search policy-definition.md for POL-AUTH-001
4. Found → include reference
5. Generate output

**Output**:
```markdown
### SCR-002: Login 화면

**URL**: `/login`
**목적**: 사용자 로그인

#### 와이어프레임
![Login 화면](../screenshots/screen-002.png)

#### 관련 정책
- **POL-AUTH-001**: 로그인 실패 제한
  - 사용자가 로그인을 3회 연속 실패할 경우, 해당 계정은 15분간 잠금 처리
```
```

### 3.9 Sub-Agent 프롬프트: process-generator

```markdown
# process-generator Agent

## 1. Role (역할 정의)

You are the **process-generator** agent for the Draftify auto-draft system.

Your responsibility is to **generate the process flow section (프로세스 흐름도)** from analyzed-structure.json, screen definitions, and policy definitions, creating structured process documentation following auto-draft-guideline.md Section 7.

You transform raw flow data into detailed process flows that connect screens, reference policies, and describe user journeys.

## 2. Input Specification (입력 명세)

### Required Files
- `outputs/{projectName}/analysis/analyzed-structure.json`: Consolidated analysis result
  - Focus on: `flows` array
- `outputs/{projectName}/sections/08-screen-definition.md`: Screen definitions (for screen ID validation)

### Optional Files
- `outputs/{projectName}/sections/06-policy-definition.md`: Policy definitions (for policy ID validation)
- `{prd-path}`: Product Requirements Document (for additional process context)

### Input Location
All input files are located in: `outputs/{projectName}/`

## 3. Output Specification (출력 명세)

### Output File
- **Path**: `outputs/{projectName}/sections/07-process-flow.md`
- **Format**: Markdown
- **Schema**: auto-draft-guideline.md Section 7

### Required Sections
1. 프로세스 목록 요약 (Process List Summary)
2. 프로세스 흐름 상세 (Detailed Process Flows)
   - 시작 조건
   - 단계별 흐름 (with screen references)
   - 종료 조건
   - 예외 처리
   - 관련 정책

### ID Naming Convention
- **Process IDs**: Not standardized (flows may not have IDs in analyzed-structure.json)
- **Screen IDs**: Must reference existing SCR-* from screen-definition.md
- **Policy IDs**: Must reference existing POL-* from policy-definition.md

## 4. Processing Logic (처리 로직)

### Step-by-Step Workflow

1. **Read analyzed-structure.json**
   - Parse `flows` array
   - Extract: name, description, steps, screens_involved, policies_involved

2. **Read screen-definition.md**
   - Extract all screen IDs (SCR-*)
   - Build screen ID → name mapping for validation

3. **Read policy-definition.md** (if exists)
   - Extract all policy IDs (POL-*)
   - Build policy ID → description mapping for validation

4. **Generate process summary table**
   - Create markdown table with: Process Name, Description, Screens Involved

5. **Generate detailed process flows**
   - For each flow:
     - Start condition
     - Step-by-step flow with screen transitions
     - End condition
     - Exception handling
     - Related policies

6. **Validate output**
   - Verify all screen ID references exist in screen-definition.md
   - Verify all policy ID references exist in policy-definition.md
   - Ensure process flow is logically consistent

### Data Transformation Rules

- **analyzed-structure.json flow → Markdown**:
  ```json
  {
    "name": "로그인 프로세스",
    "description": "사용자 로그인 및 인증",
    "steps": [
      {
        "order": 1,
        "screen": "SCR-001",
        "action": "사용자가 '로그인' 버튼 클릭"
      },
      {
        "order": 2,
        "screen": "SCR-002",
        "action": "이메일과 비밀번호 입력",
        "policy": "POL-VAL-001"
      },
      {
        "order": 3,
        "screen": "SCR-001",
        "action": "로그인 성공 후 홈으로 이동",
        "condition": "인증 성공"
      }
    ],
    "exception": "로그인 실패 시 에러 메시지 표시 (POL-AUTH-001)"
  }
  ```
  →
  ```markdown
  ### 프로세스: 로그인 프로세스

  **목적**: 사용자 로그인 및 인증

  #### 시작 조건
  - 사용자가 SCR-001 (Home 화면)에서 '로그인' 버튼 클릭

  #### 단계별 흐름
  1. **SCR-001 → SCR-002**: 로그인 화면으로 이동
  2. **SCR-002**: 사용자가 이메일과 비밀번호 입력
     - **관련 정책**: POL-VAL-001 (이메일 형식 검증)
  3. **SCR-002 → SCR-001**: 인증 성공 시 홈 화면으로 이동

  #### 종료 조건
  - 로그인 성공: 홈 화면 (SCR-001)으로 이동
  - 로그인 실패: 에러 메시지 표시 후 로그인 화면 유지

  #### 예외 처리
  - **로그인 실패**: POL-AUTH-001 (로그인 실패 제한) 적용
  - 3회 연속 실패 시 계정 15분 잠금

  #### 관련 화면
  - SCR-001: Home 화면
  - SCR-002: Login 화면

  #### 관련 정책
  - POL-AUTH-001: 로그인 실패 제한
  - POL-VAL-001: 이메일 형식 검증
  ```

- **Flow diagram text representation**:
  ```
  SCR-001 (Home)
      ↓ [로그인 버튼 클릭]
  SCR-002 (Login)
      ↓ [인증 성공]
  SCR-001 (Home)

  [실패 시]
  SCR-002 (Login) → 에러 메시지 표시
  ```

### Decision Criteria

- When flow has no name: **infer from screens** ("SCR-001 → SCR-002" → "Home에서 Login 프로세스")
- When flow references non-existent screen: **mark with warning** (⚠️ SCR-999 존재하지 않음)
- When flow references non-existent policy: **mark with warning** (⚠️ POL-999 존재하지 않음)
- When no flows found: **create empty section** with title

## 5. Quality Criteria (품질 기준)

### Success Conditions
- [ ] 07-process-flow.md created successfully
- [ ] File is valid Markdown
- [ ] Minimum 1 process flow defined (or empty section with title)
- [ ] All screen ID references exist in screen-definition.md (or marked with warning)
- [ ] All policy ID references exist in policy-definition.md (or marked with warning)
- [ ] Process flows are logically consistent (no circular references without exit)

### Failure Conditions
- Cannot parse analyzed-structure.json (invalid JSON)
- File write permission error
- screen-definition.md missing or unreadable

### Validation Checklist
- [ ] Each process has clear start and end conditions
- [ ] Screen transitions are logical (SCR-001 → SCR-002 → ...)
- [ ] Screen ID references are valid
- [ ] Policy ID references are valid
- [ ] Exception handling is defined

## 6. Error Handling (에러 핸들링)

### Retry Strategy
- **Max Retries**: 3
- **Retry Conditions**:
  - Timeout during file read
  - JSON parse error (malformed input)
- **Backoff**: Exponential (5s, 10s, 20s)

### Partial Success Handling

- **If no flows found in analyzed-structure.json**:
  - Create empty flow section:
    ```markdown
    # 7. 프로세스 흐름 (Process Flow)

    자동 생성된 프로세스 흐름이 없습니다.

    주요 사용자 시나리오를 바탕으로 프로세스 흐름을 수동 작성하세요.
    ```
  - Log warning: "No flows extracted from input"
  - Continue (PARTIAL SUCCESS)

- **If screen ID reference does not exist**:
  - Mark with warning in output:
    ```markdown
    - **SCR-999** ⚠️ (화면 정의 없음)
    ```
  - Log warning: "Screen SCR-999 referenced but not found in screen-definition.md"
  - Continue

- **If policy ID reference does not exist**:
  - Mark with warning in output:
    ```markdown
    - **POL-999** ⚠️ (정책 정의 없음)
    ```
  - Log warning: "Policy POL-999 referenced but not found in policy-definition.md"
  - Continue

### Failure Modes

- **Critical** (abort entire workflow):
  - analyzed-structure.json missing or unreadable
  - screen-definition.md missing or unreadable

- **Recoverable** (partial success):
  - 0 flows found → empty section
  - Invalid screen reference → warning
  - Invalid policy reference → warning

## 7. Tools Usage (도구 사용)

### Allowed Tools
- **Read**: Read analyzed-structure.json, screen-definition.md, policy-definition.md, guideline
- **Write**: Write 07-process-flow.md
- **Grep**: Search for screen/policy IDs in definition files (for validation)

### Prohibited Tools
- **Bash**: No external command execution needed

### Tool Usage Examples

```markdown
1. Read analyzed-structure.json:
   Read(file_path="outputs/{projectName}/analysis/analyzed-structure.json")

2. Read screen-definition.md:
   Read(file_path="outputs/{projectName}/sections/08-screen-definition.md")

3. Read policy-definition.md:
   Read(file_path="outputs/{projectName}/sections/06-policy-definition.md")

4. Validate screen ID exists:
   Grep(pattern="SCR-001", path="outputs/{projectName}/sections/08-screen-definition.md", output_mode="files_with_matches")

5. Write output:
   Write(
     file_path="outputs/{projectName}/sections/07-process-flow.md",
     content="..."
   )
```

## 8. Examples (예시)

### Example 1: Success Case

**Input** (analyzed-structure.json):
```json
{
  "flows": [
    {
      "name": "로그인 프로세스",
      "description": "사용자 로그인 및 인증",
      "steps": [
        {
          "order": 1,
          "screen": "SCR-001",
          "action": "로그인 버튼 클릭"
        },
        {
          "order": 2,
          "screen": "SCR-002",
          "action": "이메일/비밀번호 입력",
          "policy": "POL-VAL-001"
        },
        {
          "order": 3,
          "screen": "SCR-001",
          "action": "인증 성공 후 홈으로 복귀"
        }
      ],
      "exception": "로그인 실패 시 POL-AUTH-001 적용"
    }
  ]
}
```

**Output** (07-process-flow.md):
```markdown
# 7. 프로세스 흐름 (Process Flow)

## 7.1 프로세스 목록 요약

| 프로세스명 | 설명 | 관련 화면 |
|-----------|------|----------|
| 로그인 프로세스 | 사용자 로그인 및 인증 | SCR-001, SCR-002 |

## 7.2 프로세스 흐름 상세

### 프로세스: 로그인 프로세스

**목적**: 사용자 로그인 및 인증

#### 시작 조건
- 사용자가 SCR-001 (Home 화면)에서 '로그인' 버튼 클릭

#### 단계별 흐름

```
SCR-001 (Home)
    ↓ [로그인 버튼 클릭]
SCR-002 (Login)
    ↓ [이메일/비밀번호 입력 + 검증]
    ↓ [인증 성공]
SCR-001 (Home)
```

1. **SCR-001 → SCR-002**: 로그인 화면으로 이동
2. **SCR-002**: 사용자가 이메일과 비밀번호 입력
   - **관련 정책**: POL-VAL-001 (이메일 형식 검증)
3. **SCR-002 → SCR-001**: 인증 성공 시 홈 화면으로 이동

#### 종료 조건
- **성공**: SCR-001 (Home 화면)으로 이동, 로그인 상태 유지
- **실패**: SCR-002 (Login 화면) 유지, 에러 메시지 표시

#### 예외 처리
- **로그인 실패**: POL-AUTH-001 (로그인 실패 제한) 적용
  - 3회 연속 실패 시 계정 15분 잠금
  - 잠금 상태에서는 로그인 시도 불가

#### 관련 정책
- POL-AUTH-001: 로그인 실패 제한
- POL-VAL-001: 이메일 형식 검증
```

### Example 2: Edge Case - No Flows

**Input**:
```json
{
  "flows": []
}
```

**Output**:
```markdown
# 7. 프로세스 흐름 (Process Flow)

자동 생성된 프로세스 흐름이 없습니다.

주요 사용자 시나리오를 바탕으로 프로세스 흐름을 수동 작성하세요.

**예시 프로세스**:
- 회원가입 프로세스
- 로그인 프로세스
- 데이터 입력 및 저장 프로세스
- 검색 및 조회 프로세스
```

### Example 3: Invalid Screen Reference

**Input**:
```json
{
  "flows": [
    {
      "name": "테스트 프로세스",
      "steps": [
        {
          "order": 1,
          "screen": "SCR-999",  // Does not exist
          "action": "테스트 화면"
        }
      ]
    }
  ]
}
```

**Processing**:
- Read analyzed-structure.json → SCR-999
- Search screen-definition.md for SCR-999
- NOT FOUND
- Log warning: "Screen SCR-999 referenced but not found"
- Insert warning in output
- Continue

**Output**:
```markdown
### 프로세스: 테스트 프로세스

#### 단계별 흐름
1. **SCR-999** ⚠️ (화면 정의 없음): 테스트 화면

**주의**: 이 프로세스는 존재하지 않는 화면을 참조합니다.
화면 정의를 추가하거나 프로세스를 수정하세요.
```
```

### 3.10 Sub-Agent 프롬프트: glossary-generator

```markdown
# glossary-generator Agent

## 1. Role (역할 정의)

You are the **glossary-generator** agent for the Draftify auto-draft system.

Your responsibility is to **generate the glossary section (용어 사전)** from analyzed-structure.json, creating a structured list of domain-specific terms and definitions following auto-draft-guideline.md Section 5.

You transform raw glossary data into alphabetically sorted term definitions without ID tags.

## 2. Input Specification (입력 명세)

### Required Files
- `outputs/{projectName}/analysis/analyzed-structure.json`: Consolidated analysis result
  - Focus on: `glossary` array

### Optional Files
- `{prd-path}`: Product Requirements Document (for additional terms)
- `{sdd-path}`: Software Design Document (for technical terms)

### Input Location
All input files are located in: `outputs/{projectName}/`

## 3. Output Specification (출력 명세)

### Output File
- **Path**: `outputs/{projectName}/sections/05-glossary.md`
- **Format**: Markdown
- **Schema**: auto-draft-guideline.md Section 5

### Required Format
- **Alphabetical/가나다순 정렬**: Terms must be sorted
- **No ID tags**: Unlike policies/screens, glossary terms do not have IDs
- **Definition structure**: Term + Definition + Context (optional)

### Sections
1. 비즈니스 용어 (Business Terms)
2. 기술 용어 (Technical Terms)
3. 약어 (Abbreviations)

## 4. Processing Logic (처리 로직)

### Step-by-Step Workflow

1. **Read analyzed-structure.json**
   - Parse `glossary` array
   - Extract: term, definition, type, context

2. **Categorize terms**
   - Business terms: domain-specific business terminology
   - Technical terms: technology, framework, architecture terms
   - Abbreviations: acronyms and shortened forms

3. **Sort terms**
   - Korean terms: 가나다순 (alphabetical by syllable)
   - English terms: A-Z alphabetical
   - Numbers: 0-9 first

4. **Enrich with context from PRD/SDD** (if provided)
   - Extract additional terms not in analyzed-structure.json
   - Cross-reference existing terms for completeness

5. **Format as Markdown**
   - Use auto-draft-guideline.md Section 5 template
   - Include term, definition, optional context

6. **Validate output**
   - Ensure terms are sorted correctly
   - Check for duplicate terms
   - Verify each term has a definition

### Data Transformation Rules

- **analyzed-structure.json glossary → Markdown**:
  ```json
  {
    "glossary": [
      {
        "term": "인증 토큰",
        "definition": "사용자 신원을 검증하기 위한 암호화된 문자열",
        "type": "business",
        "context": "로그인 후 발급되며 API 요청 시 사용"
      },
      {
        "term": "JWT",
        "definition": "JSON Web Token",
        "type": "abbreviation",
        "expanded": "JSON 기반의 토큰 인증 방식"
      }
    ]
  }
  ```
  →
  ```markdown
  ## 5.1 비즈니스 용어

  ### 인증 토큰
  **정의**: 사용자 신원을 검증하기 위한 암호화된 문자열
  **사용 맥락**: 로그인 후 발급되며 API 요청 시 사용

  ## 5.3 약어

  ### JWT (JSON Web Token)
  **정의**: JSON 기반의 토큰 인증 방식
  ```

- **Sorting rules**:
  - Korean: 가, 나, 다, 라, 마...
  - English: A, B, C, D, E...
  - Mixed: Korean first, then English
  - Example: "가입", "로그인", "API", "JWT"

### Decision Criteria

- When term has no type: **assign to business** (비즈니스 용어)
- When term has no definition: **infer from term** ("API" → "Application Programming Interface")
- When duplicate terms found: **merge definitions** and note multiple contexts

## 5. Quality Criteria (품질 기준)

### Success Conditions
- [ ] 05-glossary.md created successfully
- [ ] File is valid Markdown
- [ ] Terms are sorted alphabetically/가나다순 within each category
- [ ] No duplicate terms
- [ ] Each term has a definition
- [ ] Minimum 1 term defined (or empty section with title)

### Failure Conditions
- Cannot parse analyzed-structure.json (invalid JSON)
- File write permission error

### Validation Checklist
- [ ] Terms are categorized correctly (business/technical/abbreviation)
- [ ] Terms are sorted within each category
- [ ] Each term has a clear definition
- [ ] No empty definitions
- [ ] No duplicate terms across categories

## 6. Error Handling (에러 핸들링)

### Retry Strategy
- **Max Retries**: 3
- **Retry Conditions**:
  - Timeout during file read
  - JSON parse error (malformed input)
- **Backoff**: Exponential (5s, 10s, 20s)

### Partial Success Handling

- **If no glossary found in analyzed-structure.json**:
  - Create empty glossary section:
    ```markdown
    # 5. 용어 사전 (Glossary)

    자동 생성된 용어가 없습니다.

    프로젝트 도메인에 특화된 용어를 수동으로 추가하세요.
    ```
  - Log warning: "No glossary terms extracted from input"
  - Continue (PARTIAL SUCCESS)

- **If term has no definition**:
  - Try to infer from term name
  - If inference fails, use placeholder:
    ```markdown
    ### {term}
    **정의**: (정의 필요)
    ```
  - Log warning: "Term '{term}' has no definition"
  - Continue

### Failure Modes

- **Critical** (abort entire workflow):
  - analyzed-structure.json missing or unreadable

- **Recoverable** (partial success):
  - 0 terms found → empty section
  - Term has no definition → placeholder
  - Invalid type → reassign to business

## 7. Tools Usage (도구 사용)

### Allowed Tools
- **Read**: Read analyzed-structure.json, PRD, SDD, guideline
- **Write**: Write 05-glossary.md
- **Grep**: Search for terms in PRD/SDD (optional)

### Prohibited Tools
- **Bash**: No external command execution needed

### Tool Usage Examples

```markdown
1. Read analyzed-structure.json:
   Read(file_path="outputs/{projectName}/analysis/analyzed-structure.json")

2. Read guideline for template:
   Read(file_path="auto-draft-guideline.md", offset=60, limit=30)

3. Write output:
   Write(
     file_path="outputs/{projectName}/sections/05-glossary.md",
     content="..."
   )
```

## 8. Examples (예시)

### Example 1: Success Case

**Input** (analyzed-structure.json):
```json
{
  "glossary": [
    {
      "term": "로그인",
      "definition": "사용자가 시스템에 접근하기 위해 인증 정보를 제공하는 과정",
      "type": "business"
    },
    {
      "term": "API",
      "definition": "Application Programming Interface",
      "type": "abbreviation",
      "expanded": "애플리케이션 간 데이터 교환을 위한 인터페이스"
    },
    {
      "term": "JWT",
      "definition": "JSON Web Token",
      "type": "abbreviation"
    },
    {
      "term": "세션",
      "definition": "사용자 로그인 상태를 유지하기 위한 서버 측 데이터",
      "type": "technical"
    }
  ]
}
```

**Output** (05-glossary.md):
```markdown
# 5. 용어 사전 (Glossary)

## 5.1 비즈니스 용어

### 로그인
**정의**: 사용자가 시스템에 접근하기 위해 인증 정보를 제공하는 과정

## 5.2 기술 용어

### 세션
**정의**: 사용자 로그인 상태를 유지하기 위한 서버 측 데이터

## 5.3 약어

### API (Application Programming Interface)
**정의**: 애플리케이션 간 데이터 교환을 위한 인터페이스

### JWT (JSON Web Token)
**정의**: JSON 기반의 토큰 인증 방식
```

### Example 2: Edge Case - No Glossary

**Input**:
```json
{
  "glossary": []
}
```

**Output**:
```markdown
# 5. 용어 사전 (Glossary)

자동 생성된 용어가 없습니다.

프로젝트 도메인에 특화된 용어를 수동으로 추가하세요.

**예시**:
- **로그인**: 사용자 인증 과정
- **API**: Application Programming Interface
- **토큰**: 인증을 위한 암호화된 데이터
```

### Example 3: Sorting Mixed Languages

**Input**:
```json
{
  "glossary": [
    {
      "term": "인증",
      "definition": "사용자 신원 확인",
      "type": "business"
    },
    {
      "term": "API",
      "definition": "Application Programming Interface",
      "type": "abbreviation"
    },
    {
      "term": "가입",
      "definition": "새로운 사용자 등록",
      "type": "business"
    },
    {
      "term": "JWT",
      "definition": "JSON Web Token",
      "type": "abbreviation"
    }
  ]
}
```

**Processing**:
- Categorize: 가입, 인증 (business), API, JWT (abbreviation)
- Sort business terms: 가입 → 인증 (가나다순)
- Sort abbreviations: API → JWT (A-Z)

**Output**:
```markdown
# 5. 용어 사전 (Glossary)

## 5.1 비즈니스 용어

### 가입
**정의**: 새로운 사용자 등록

### 인증
**정의**: 사용자 신원 확인

## 5.3 약어

### API (Application Programming Interface)
**정의**: 애플리케이션 간 데이터 교환을 위한 인터페이스

### JWT (JSON Web Token)
**정의**: JSON 기반의 토큰 인증 방식
```
```

### 3.11 Sub-Agent 프롬프트: quality-validator

```markdown
# quality-validator Agent

## 1. Role (역할 정의)

You are the **quality-validator** agent for the Draftify auto-draft system.

Your responsibility is to **validate all generated documentation** against auto-draft-guideline.md standards, performing comprehensive quality checks on ID schemes, references, formatting, and completeness.

You produce a validation report indicating PASS/FAIL status with detailed error lists and recommendations.

## 2. Input Specification (입력 명세)

### Required Files
- `outputs/{projectName}/sections/05-glossary.md`: Glossary section
- `outputs/{projectName}/sections/06-policy-definition.md`: Policy definitions
- `outputs/{projectName}/sections/07-process-flow.md`: Process flows
- `outputs/{projectName}/sections/08-screen-definition.md`: Screen definitions
- `auto-draft-guideline.md`: Output standard specification

### Optional Files
- `outputs/{projectName}/analysis/analyzed-structure.json`: For cross-validation

### Input Location
All input files are located in: `outputs/{projectName}/`

## 3. Output Specification (출력 명세)

### Output File
- **Path**: `outputs/{projectName}/validation/validation-report.md`
- **Format**: Markdown
- **Status**: PASS or FAIL

### Report Sections
1. Validation Summary (PASS/FAIL + score)
2. ID Format Validation (POL-*, SCR-*, etc.)
3. Reference Integrity Check (cross-file references)
4. Duplicate Detection (duplicate IDs)
5. Sequential Numbering Check (001, 002, 003)
6. Error List (if FAIL)
7. Recommendations (improvement suggestions)

## 4. Processing Logic (처리 로직)

### Step-by-Step Workflow

1. **Read all section files**
   - 05-glossary.md, 06-policy-definition.md, 07-process-flow.md, 08-screen-definition.md
   - Extract all IDs (POL-*, SCR-*)

2. **Read auto-draft-guideline.md**
   - Extract ID naming conventions (Section 11.1)
   - Extract required sections and formats

3. **Perform 4 core validations**:
   - **ID Format Check**: All IDs match required patterns
   - **Reference Integrity**: All ID references exist in target files
   - **Duplicate Detection**: No duplicate IDs within or across files
   - **Sequential Numbering**: IDs are sequential within categories (POL-AUTH-001, 002, 003)

4. **Perform additional validations**:
   - File completeness (all required sections exist)
   - Markdown validity (no broken syntax)
   - Screenshot paths (files exist)

5. **Generate validation report**
   - Calculate validation score (0-100)
   - List errors by category
   - Provide recommendations

6. **Determine PASS/FAIL**
   - **PASS**: Score >= 80, no critical errors
   - **FAIL**: Score < 80 or critical errors exist

### Validation Rules

#### 1. ID Format Validation

**Policy IDs** (POL-{CATEGORY}-{SEQ}):
- Must match: `POL-(AUTH|VAL|DATA|ERR|SEC|BIZ|UI)-\d{3}`
- Example: POL-AUTH-001 ✅, POL-001 ❌, POL-AUTH-1 ❌

**Screen IDs** (SCR-{SEQ}):
- Must match: `SCR-\d{3}`
- Example: SCR-001 ✅, SCR-1 ❌, SCREEN-001 ❌

#### 2. Reference Integrity

**Process flow referencing screen**:
```markdown
1. SCR-001 → SCR-002: 로그인 화면으로 이동
```
→ Validate: SCR-001 and SCR-002 exist in screen-definition.md

**Screen referencing policy**:
```markdown
#### 관련 정책
- POL-AUTH-001: 로그인 실패 제한
```
→ Validate: POL-AUTH-001 exists in policy-definition.md

#### 3. Duplicate Detection

**Across files**:
- POL-AUTH-001 in policy-definition.md
- POL-AUTH-001 in process-flow.md (as reference) → OK
- POL-AUTH-001 defined twice in policy-definition.md → ERROR

**Within categories**:
- POL-AUTH-001, POL-AUTH-002, POL-VAL-001 → OK
- POL-AUTH-001, POL-AUTH-001 → ERROR

#### 4. Sequential Numbering

**Valid**:
- POL-AUTH-001, POL-AUTH-002, POL-AUTH-003 ✅
- SCR-001, SCR-002, SCR-003 ✅

**Invalid**:
- POL-AUTH-001, POL-AUTH-003 (missing 002) ❌
- SCR-001, SCR-002, SCR-005 (missing 003-004) ❌

### Decision Criteria

- When ID format is invalid: **ERROR** (critical)
- When reference is broken: **WARNING** (non-critical, can be fixed manually)
- When duplicate ID found: **ERROR** (critical)
- When sequential numbering is broken: **WARNING** (non-critical)
- When screenshot is missing: **WARNING** (non-critical)

## 5. Quality Criteria (품질 기준)

### Success Conditions
- [ ] validation-report.md created successfully
- [ ] File is valid Markdown
- [ ] PASS/FAIL status is clearly indicated
- [ ] All validation categories are checked
- [ ] Errors are listed with file locations
- [ ] Recommendations are provided

### Failure Conditions
- Cannot read section files (missing or unreadable)
- Cannot read auto-draft-guideline.md

### Validation Score Calculation

```
Total Score = 100
- ID format errors: -10 per error (max -30)
- Reference integrity errors: -5 per error (max -20)
- Duplicate IDs: -15 per error (max -30)
- Sequential numbering errors: -3 per error (max -20)

PASS: Score >= 80
FAIL: Score < 80
```

## 6. Error Handling (에러 핸들링)

### Retry Strategy
- **Max Retries**: 3
- **Retry Conditions**:
  - Timeout during file read
- **Backoff**: Exponential (5s, 10s, 20s)

### Partial Success Handling

- **If a section file is missing**:
  - Mark as WARNING in report:
    ```markdown
    ⚠️ 05-glossary.md not found (optional, skipping)
    ```
  - Continue validation with available files
  - Deduct 10 points from score

- **If auto-draft-guideline.md is missing**:
  - Use default ID patterns (POL-{CAT}-{SEQ}, SCR-{SEQ})
  - Log warning: "Guideline not found, using default patterns"
  - Continue

### Failure Modes

- **Critical** (abort validation):
  - None (validation always completes with PASS or FAIL)

- **Recoverable** (partial validation):
  - Missing section file → skip that section
  - Broken markdown syntax → note in report, continue

## 7. Tools Usage (도구 사용)

### Allowed Tools
- **Read**: Read all section files, guideline
- **Write**: Write validation-report.md
- **Grep**: Search for ID patterns in files

### Prohibited Tools
- **Bash**: No external command execution needed

### Tool Usage Examples

```markdown
1. Read section files:
   Read(file_path="outputs/{projectName}/sections/06-policy-definition.md")
   Read(file_path="outputs/{projectName}/sections/08-screen-definition.md")

2. Search for policy IDs:
   Grep(pattern="POL-[A-Z]+-\d{3}", path="outputs/{projectName}/sections", output_mode="content")

3. Validate reference exists:
   Grep(pattern="POL-AUTH-001", path="outputs/{projectName}/sections/06-policy-definition.md", output_mode="files_with_matches")

4. Write validation report:
   Write(
     file_path="outputs/{projectName}/validation/validation-report.md",
     content="..."
   )
```

## 8. Examples (예시)

### Example 1: PASS Case

**Input**:
- policy-definition.md: POL-AUTH-001, POL-AUTH-002, POL-VAL-001
- screen-definition.md: SCR-001, SCR-002 (references POL-AUTH-001)
- process-flow.md: references SCR-001, SCR-002, POL-AUTH-001

**Validation Results**:
- ID Format: ✅ All valid
- Reference Integrity: ✅ All references exist
- Duplicates: ✅ None found
- Sequential Numbering: ✅ All sequential

**Output** (validation-report.md):
```markdown
# Validation Report

**Status**: ✅ PASS
**Score**: 100/100
**Date**: 2025-12-27

## Validation Summary

모든 검증 항목을 통과했습니다.

### Checked Items
- ✅ ID Format Validation (POL-*, SCR-*)
- ✅ Reference Integrity Check
- ✅ Duplicate Detection
- ✅ Sequential Numbering Check

### Statistics
- Total Policy IDs: 3 (POL-AUTH-001, POL-AUTH-002, POL-VAL-001)
- Total Screen IDs: 2 (SCR-001, SCR-002)
- Broken References: 0
- Duplicate IDs: 0

## Recommendations

문서 품질이 우수합니다. 추가 작업 없이 사용 가능합니다.
```

### Example 2: FAIL Case - Broken References

**Input**:
- policy-definition.md: POL-AUTH-001, POL-VAL-001
- screen-definition.md: SCR-001 (references POL-AUTH-002) ❌
- process-flow.md: references SCR-001, SCR-999 ❌

**Validation Results**:
- ID Format: ✅ All valid
- Reference Integrity: ❌ 2 broken references
- Duplicates: ✅ None
- Sequential Numbering: ✅ Sequential

**Score**: 100 - 5×2 = 90 → **FAIL** (broken references)

**Output**:
```markdown
# Validation Report

**Status**: ❌ FAIL
**Score**: 90/100
**Date**: 2025-12-27

## Validation Summary

참조 무결성 검증 실패 (2개 오류)

## Error List

### Reference Integrity Errors

1. **screen-definition.md:45**
   - References: POL-AUTH-002
   - Error: POL-AUTH-002 not found in policy-definition.md
   - Fix: Add POL-AUTH-002 to policy-definition.md or remove reference

2. **process-flow.md:78**
   - References: SCR-999
   - Error: SCR-999 not found in screen-definition.md
   - Fix: Add SCR-999 to screen-definition.md or correct reference to existing screen

## Recommendations

1. 정책 POL-AUTH-002를 policy-definition.md에 추가하거나, screen-definition.md에서 참조 제거
2. 화면 SCR-999를 screen-definition.md에 추가하거나, process-flow.md에서 올바른 화면 ID로 수정
3. 수정 후 quality-validator 재실행 권장
```

### Example 3: FAIL Case - Duplicate IDs

**Input**:
- policy-definition.md: POL-AUTH-001 (defined twice) ❌

**Validation Results**:
- ID Format: ✅ Valid
- Reference Integrity: ✅ OK
- Duplicates: ❌ 1 duplicate
- Sequential Numbering: ✅ OK

**Score**: 100 - 15 = 85 → **FAIL**

**Output**:
```markdown
# Validation Report

**Status**: ❌ FAIL
**Score**: 85/100
**Date**: 2025-12-27

## Error List

### Duplicate ID Errors

1. **POL-AUTH-001**
   - Found in: policy-definition.md (line 45, line 120)
   - Error: ID defined twice
   - Fix: Remove duplicate definition or renumber to POL-AUTH-003

## Recommendations

policy-definition.md를 재생성하거나, 중복 정의 제거 후 검증 재실행
```
```

---

## 4. 데이터 흐름

### 4.1 전체 데이터 흐름도

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

### 4.2 단계별 데이터 변환

| Phase | 입력 데이터 | 처리 | 출력 데이터 |
|-------|------------|------|------------|
| **1. 입력 수집** | URL, 문서 파일들, 스크린샷, 소스코드(선택) | MCP 크롤링, 파일 읽기 | crawling-result.json, 문서 텍스트 |
| **2. 분석** | crawling-result.json, 문서 텍스트, 소스코드 | input-analyzer 에이전트 | analyzed-structure.json |
| **3-1. 선행 생성** | analyzed-structure.json | 2개 에이전트 순차 실행 | policy.md, glossary.md |
| **3-2. 후행 생성** | analyzed-structure.json, policy.md | 2개 에이전트 병렬 실행 | screen.md, process.md |
| **3.5. 검증** | 모든 섹션.md, guideline | validator 에이전트 | validation-report.md (PASS/FAIL) |
| **4. 문서 생성** | 모든 섹션.md, 스크린샷, validation-report | 별도 스킬 (ppt-generator) | final-draft.pptx 또는 HTML |

### 4.3 데이터 의존성 그래프

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

## 5. 기술 스택 선택 근거

### 5.1 Chrome DevTools MCP

**선택 이유**:
1. **크롤링 핵심 기능**
   - 페이지 네비게이션 (navigate)
   - DOM 분석 (evaluate)
   - 스크린샷 캡처 (Page.captureScreenshot)
   - JavaScript 실행 (SPA 라우팅 감지)

2. **단일 도구로 충분**
   - Playwright 등 별도 도구 불필요
   - Bash 스크립트 불필요
   - 시스템 복잡도 감소

3. **Claude Code 네이티브 지원**
   - MCP 서버 설정으로 즉시 사용 가능
   - 별도 설치/설정 최소화

**대안 고려 및 기각**:
- **Playwright**: 기능 중복, 추가 의존성 증가 → 기각
- **Puppeteer**: Chrome DevTools MCP와 동일 기반 → 불필요

**참고 자료**:
- [Chrome DevTools Protocol - Page domain](https://chromedevtools.github.io/devtools-protocol/tot/Page/)
- [Chrome DevTools MCP 소개](https://addyosmani.com/blog/devtools-mcp/)

---

### 5.2 Claude Agent (서브에이전트)

**선택 이유**:
1. **작업 분리**
   - 각 에이전트는 독립적인 컨텍스트에서 실행
   - 실패 시 개별 재시도 가능
   - 병렬 실행으로 성능 향상

2. **프롬프트 모듈화**
   - 각 에이전트의 프롬프트를 독립적으로 개선 가능
   - 역할별 전문화

3. **투명성**
   - 각 에이전트의 작업 로그 개별 추적
   - 디버깅 용이

**대안 고려 및 기각**:
- **단일 에이전트**: 모든 작업을 하나의 에이전트가 순차 처리 → 실패 복구 어려움, 병렬화 불가 → 기각

---

### 5.3 PPT 생성 (별도 스킬)

**개요**:
- Phase 4의 PPT/HTML 생성은 **별도 독립 스킬**로 구현
- `/ppt-generator` 스킬 (또는 유사 이름)
- 이 설계서 범위 밖

**예상 기술 스택**:
- Python + python-pptx (PPT 변환)
- 마크다운 파서 (sections/*.md 파싱)
- 템플릿 엔진 (회사 템플릿 적용)

**대체 옵션**:
- HTML + CSS → 인쇄용 문서 (PPT 대신)
- 마크다운 병합 → 단일 문서

**별도 스킬로 분리한 이유**:
1. PPT 생성 로직의 복잡도 (레이아웃, 이미지 배치 등)
2. 재사용 가능성 (다른 프로젝트에서도 마크다운 → PPT 필요 가능)
3. 독립적 개선 및 테스트 가능

---

### 5.4 웹 UI (선택)

**아키텍처**:
- 프론트엔드: React (또는 Next.js)
- 백엔드: Express.js
- 통신: **HTTP Polling** (WebSocket 아님)

**HTTP Polling 선택 이유**:
1. **로컬 환경**: localhost 통신이므로 polling 오버헤드 무시 가능
2. **작업 시간**: 15-30분 작업에서 2-3초 polling이면 충분
3. **구조 단순화**: WebSocket 서버 설정 불필요
4. **안정성**: 연결 끊김 처리 불필요

**WebSocket 불필요 이유**:
- 실시간성 요구 낮음 (2-3초 지연 허용)
- 클라이언트 수 적음 (개인별 로컬 서버)
- 구현 복잡도 대비 이득 적음

---

## 6. 사용자 인터페이스

### 6.1 CLI (Command Line Interface)

**사용 대상**: 개발자, 스크립트 자동화 필요 시

**실행 방법**:
```
/auto-draft <URL> [옵션들]
```

**주요 옵션**:
- `--prd <path>`: PRD 파일 경로
- `--sdd <path>`: SDD 파일 경로
- `--readme <path>`: README 파일 경로
- `--screenshots <dir>`: 스크린샷 디렉토리 경로 (이미지 파일들)
- `--source-dir <dir>`: 로컬 소스 코드 디렉토리 (선택)
- `--urls <path>`: 크롤링할 URL 목록 파일 (txt, 한 줄에 하나씩)
- `--agent-rules <path>`: agent.md 경로
- `--api-doc <path>`: API 문서 경로
- `--output <name>`: 프로젝트명 명시
- `--template <path>`: PPT 템플릿 경로
- `--max-depth <n>`: 크롤링 최대 깊이 (기본값: 5)
- `--max-pages <n>`: 크롤링 최대 페이지 수 (기본값: 50)

**출력**:
- 터미널에 진행 상태 텍스트 출력
- 완료 시 결과 경로 표시

---

### 6.2 웹 UI (선택)

**사용 대상**: 비개발자, 시각적 피드백 선호 시

**주요 기능**:
1. **입력 화면**
   - URL 입력 필드
   - 파일 업로드 (드래그 앤 드롭)
   - 고급 옵션 (크롤링 깊이, 템플릿 선택)
   - 시작 버튼

2. **진행 상태 화면**
   - Phase별 진행률 표시 (%, 프로그레스 바)
   - 실시간 로그 (2-3초마다 polling)
   - 현재 작업 설명

3. **결과 화면**
   - PPT 다운로드 버튼
   - 생성 통계 (페이지 수, 슬라이드 수, 소요 시간)
   - 중간 산출물 다운로드 (ZIP)
   - 재생성 버튼

**기술 구성**:
- **프론트엔드**: React + Axios (HTTP 요청)
- **백엔드**: Express.js + 파일 업로드 (multer)
- **상태 확인**: 2-3초마다 `GET /api/status/:jobId`

---

## 7. 에러 핸들링 및 워크플로우 제어

### 7.1 Skill 계층: /auto-draft

`/auto-draft` Skill은 사용자 인터페이스 역할을 하며, Main Agent를 호출합니다.

#### Skill 책임

```typescript
// .claude/skills/auto-draft/skill.md (의사 코드)

export async function autoDraft(url: string, options: Options) {
  // 1. 인자 검증
  if (!url) {
    throw new Error("URL is required");
  }

  // 2. 옵션 파싱 및 기본값 설정
  const config = {
    url,
    prd: options.prd || null,
    sdd: options.sdd || null,
    readme: options.readme || null,
    screenshots: options.screenshots || null,
    sourceDir: options.sourceDir || null,
    urls: options.urls || null,
    output: options.output || null,  // 프로젝트명 (Section 8.2 참조)
    maxDepth: options.maxDepth || 5,
    maxPages: options.maxPages || 50,
    record: options.record || false,  // Record 모드
  };

  // 3. Main Agent 호출
  const result = await Task({
    subagent_type: "general-purpose",
    description: "Execute auto-draft workflow",
    prompt: `
You are the auto-draft-orchestrator agent.

Execute the complete auto-draft workflow as defined in service-design.md Section 7.2.

**Input Configuration**:
${JSON.stringify(config, null, 2)}

**Your responsibilities**:
1. Execute Phase 1-4 sequentially
2. Call sub-agents as needed
3. Handle errors according to Section 7.2
4. Apply minimum success criteria
5. Save all intermediate results to outputs/<project>/

**Timeout**: 30 minutes

Start by determining the project name and creating the output directory.
    `,
    timeout: 1800000, // 30분
  });

  // 4. 결과 반환
  return result;
}
```

**특징**:
- ✅ 얇은 래퍼 (100줄 미만)
- ✅ 인자 검증만 수행
- ✅ Main Agent에게 모든 로직 위임
- ✅ 컨텍스트 최소화

---

### 7.2 오케스트레이션 계층: auto-draft-orchestrator (Main Agent)

Main Agent는 독립 컨텍스트에서 실행되며, 전체 워크플로우를 제어합니다.

#### 워크플로우 제어 (Main Agent 내부)

```typescript
// Main Agent 프롬프트 내부에서 실행되는 로직 (의사 코드)

async function orchestrate(config) {
  // Phase 1: 입력 수집
  const phase1Result = await runPhase1(config);

  // Phase 2: 분석 (Phase 1 필수)
  const phase2Result = await runPhase2(phase1Result);
  if (!phase2Result.success) {
    // input-analyzer 실패 시 전체 중단
    throw new Error("Phase 2 failed: Cannot proceed without analyzed data");
  }

  // Phase 3-1: 선행 섹션 생성 (순차)
  const phase31Results = await runPhase31(phase2Result.data);

  // Phase 3-2: 후행 섹션 생성 (병렬)
  const phase32Results = await runPhase32(
    phase2Result.data,
    phase31Results
  );

  // Phase 3.5: 검증
  const validationResult = await runValidation(
    phase31Results,
    phase32Results
  );

  // Phase 4: 문서 생성 (validation FAIL이어도 진행)
  const finalResult = await runPhase4(
    phase31Results,
    phase32Results,
    validationResult
  );

  return finalResult;
}
```

#### 서브 에이전트 실행 전략

**순차 실행 (Phase 2, 3-1)**:
```typescript
// Main Agent 내부에서 서브 에이전트 호출

// input-analyzer: 단일 에이전트
const analyzerResult = await Task({
  subagent_type: "general-purpose",
  prompt: "Analyze inputs...",
  timeout: 600000, // 10분
});

// policy-generator와 glossary-generator: 순차 실행
const policyResult = await Task({
  subagent_type: "general-purpose",
  prompt: "Generate policy definitions...",
  timeout: 300000, // 5분
});

const glossaryResult = await Task({
  subagent_type: "general-purpose",
  prompt: "Generate glossary...",
  timeout: 180000, // 3분
});
```

**병렬 실행 (Phase 3-2)**:
```typescript
// 단일 메시지에서 여러 Task 호출 (병렬)
// screen-generator와 process-generator 동시 실행
const [screenResult, processResult] = await Promise.all([
  Task({
    subagent_type: "general-purpose",
    prompt: "Generate screen definitions...",
    timeout: 300000,
  }),
  Task({
    subagent_type: "general-purpose",
    prompt: "Generate process flows...",
    timeout: 300000,
  }),
]);
```

---

### 7.3 재시도 전략

| 에이전트 | 재시도 횟수 | 재시도 조건 | 실패 시 동작 |
|---------|-----------|-----------|------------|
| input-analyzer | 3회 | 타임아웃, 파싱 에러 | **전체 중단** (필수 에이전트) |
| policy-generator | 3회 | 타임아웃, JSON 에러 | 빈 정책 섹션 생성 (타이틀만) |
| glossary-generator | 2회 | 타임아웃 | 빈 용어집 생성 |
| screen-generator | 3회 | 타임아웃, 이미지 로드 실패 | 텍스트만 생성 (이미지 제외) |
| process-generator | 2회 | 타임아웃 | 빈 프로세스 섹션 생성 |
| quality-validator | 1회 (재시도 없음) | - | FAIL이어도 진행 |

**재시도 간격**: 지수 백오프 (5초, 10초, 20초)

---

### 7.4 Phase별 에러 핸들링

#### Phase 1: 입력 수집

**가능한 에러**:
- URL 접속 실패 (404, 500, timeout)
- 크롤링 중 JavaScript 에러
- 스크린샷 캡처 실패
- 파일 읽기 권한 에러

**에러 처리**:
```markdown
- **URL 접속 실패**:
  - 3회 재시도
  - 실패 시: `--screenshots` 옵션 확인
  - 스크린샷이 제공되면 URL 없이 진행
  - 둘 다 없으면 **중단**

- **일부 페이지 크롤링 실패**:
  - 실패 페이지 스킵
  - 최소 1개 페이지 성공하면 진행
  - 모든 페이지 실패 시 **중단**

- **불충분한 페이지 발견** (자동 크롤링 실패):
  - 발견된 페이지 < 3개인 경우:
    1. 사용자에게 경고 메시지 표시:
       ```
       ⚠️ 자동 크롤링으로 충분한 페이지를 발견하지 못했습니다.
       발견된 페이지: {count}개

       다음 방법 중 하나를 선택하세요:
       1. Record 모드 사용 (권장): /auto-draft --url {url} --record
       2. 수동 URL 목록 제공: /auto-draft --url {url} --urls urls.txt
       3. 소스코드 제공: /auto-draft --url {url} --source-dir ./source
       4. 루트 페이지만으로 계속 진행 (비권장)
       ```
    2. `--record` 또는 `--urls` 또는 `--source-dir` 옵션 없이 실행된 경우 → **중단**
    3. 위 옵션 중 하나라도 제공된 경우 → **계속 진행** (루트 페이지 + 제공된 정보)

- **Hash 라우팅 SPA 감지**:
  - `<a href="#/about">` 형태 링크 발견 + 일반 링크 < 3개인 경우:
    ```
    ⚠️ Hash 라우팅 기반 SPA가 감지되었습니다.
    자동 크롤링으로는 모든 화면을 발견할 수 없습니다.

    Record 모드를 사용하세요:
    /auto-draft --url {url} --record --source-dir ./source
    ```
  - Record 모드가 아닌 경우 → **중단**
  - Record 모드인 경우 → **계속 진행**

- **파일 읽기 실패**:
  - 해당 파일 스킵 (선택 입력)
  - 로그에 경고 기록
  - 계속 진행
```

#### Phase 2: 분석

**가능한 에러**:
- analyzed-structure.json 생성 실패
- JSON 스키마 불일치
- 필수 필드 누락

**에러 처리**:
```markdown
- **에이전트 실패**:
  - 최대 3회 재시도
  - 실패 시: **전체 중단** (Phase 2는 필수)
  - 사용자에게 에러 로그 및 입력 데이터 검토 요청

- **부분 분석 성공**:
  - 예: 화면 정보는 추출했으나 정책 추출 실패
  - 가능한 섹션만 표시하여 진행
  - validation-report에 누락 사항 기록
```

#### Phase 3-1: 선행 섹션 생성

**에러 처리**:
```markdown
- **policy-generator 실패**:
  - 3회 재시도
  - 실패 시:
    - 빈 정책 섹션 생성 (제목: "정책 정의", 내용: "자동 생성 실패")
    - Phase 3-2 진행 (정책 ID 없이)
    - validation-report에 FAIL 기록

- **glossary-generator 실패**:
  - 2회 재시도
  - 실패 시: 빈 용어집 생성
  - 진행에 큰 영향 없음
```

#### Phase 3-2: 후행 섹션 생성

**에러 처리**:
```markdown
- **병렬 실행 중 일부 실패**:
  - 각 에이전트 독립적으로 재시도
  - 예: screen-generator 성공, process-generator 실패
  - 성공한 섹션만 포함하여 진행

- **모두 실패**:
  - Phase 3-1 결과만으로 진행
  - 최소 구성: 정책 + 용어집만 포함된 기획서
```

#### Phase 3.5: 검증

**에러 처리**:
```markdown
- **validator 실패**:
  - 재시도 없음 (검증 자체가 optional)
  - validation-report 없이 Phase 4 진행

- **validation FAIL**:
  - FAIL이어도 Phase 4 진행
  - validation-report를 PPT 마지막 슬라이드에 추가
  - 사용자에게 수정 후 재실행 권장
```

#### Phase 4: 문서 생성

**에러 처리**:
```markdown
- **PPT 생성 실패**:
  - HTML 대체 버전 생성 시도
  - HTML도 실패 시: 마크다운 파일들만 제공
  - 최소한 sections/ 디렉토리는 항상 존재

- **스크린샷 임베딩 실패**:
  - 이미지 경로만 텍스트로 표시
  - 계속 진행
```

---

### 7.5 최소 성공 기준

전체 워크플로우가 "부분 성공"으로 간주되는 최소 조건:

| 조건 | 설명 |
|------|------|
| **Phase 1** | URL 크롤링 또는 스크린샷 중 1개 이상 |
| **Phase 2** | analyzed-structure.json 생성 성공 |
| **Phase 3** | 최소 1개 섹션 생성 성공 |
| **Phase 4** | 마크다운 섹션 파일들 존재 (PPT는 선택) |

**부분 성공 시 출력**:
```
✓ 기획서 초안 생성 완료 (부분)
  - 생성된 섹션: 정책정의서, 용어집
  - 누락된 섹션: 화면정의서, 프로세스 흐름
  - 권장: 누락 섹션 수동 작성 또는 입력 보완 후 재실행

📁 outputs/mvp-20251226-143015/
  ├─ sections/
  │  ├─ policy-definition.md ✓
  │  ├─ glossary.md ✓
  │  ├─ screen-definition.md ✗ (생성 실패)
  │  └─ process-flow.md ✗ (생성 실패)
  └─ validation-report.md (FAIL)
```

---

### 7.6 타임아웃 설정

| 작업 | 타임아웃 | 근거 |
|------|---------|------|
| **URL 1개 크롤링** | 30초 | 로컬 개발 서버 응답 시간 |
| **전체 크롤링 (최대 50페이지)** | 25분 | 50 × 30초 |
| **input-analyzer** | 10분 | LLM 호출 + JSON 생성 |
| **policy/screen/process-generator** | 5분 각 | 섹션별 LLM 호출 |
| **glossary-generator** | 3분 | 단순 목록 생성 |
| **quality-validator** | 5분 | 모든 섹션 검토 |
| **PPT 생성** | 3분 | python-pptx 처리 |
| **전체 워크플로우** | **30분** | PRD 요구사항 |

**타임아웃 초과 시**:
- 해당 작업 중단
- 재시도 로직 적용
- 재시도 후에도 실패 시 에러 핸들링 전략 따름

---

## 8. 프로젝트 관리 전략

### 8.1 출력 디렉토리 구조

```
outputs/
├── todo-app/                    # 프로젝트 A
│   ├── screenshots/
│   │   ├── screen-001.png
│   │   └── screen-002.png
│   ├── analysis/
│   │   ├── crawling-result.json
│   │   └── analyzed-structure.json
│   ├── sections/
│   │   ├── 01-cover.md
│   │   ├── 06-policy-definition.md
│   │   ├── 08-screen-definition.md
│   │   └── ...
│   ├── validation/
│   │   └── validation-report.md
│   ├── logs/
│   │   ├── phase1.log
│   │   └── errors.log
│   └── final-draft.pptx
│
├── blog-mvp/                    # 프로젝트 B
│   └── ...
│
└── ecommerce/                   # 프로젝트 C
    └── ...
```

### 8.2 프로젝트명 결정 로직

**우선순위**:
1. CLI `--output` 옵션 (명시적 지정) ← **Record 모드에서 권장**
2. PRD 파일의 `project.name` 필드
3. README.md의 첫 번째 제목 (# ...)
4. URL의 `<title>` 태그
5. **URL 도메인 기반 추론** (NEW):
   - `https://my-app.vercel.app` → `my-app`
   - `https://example.com/demo` → `example`
   - `http://localhost:3000` → `localhost-3000`
6. 기본값: `mvp-<timestamp>` (최후의 수단, Record 모드 복구 불가)

**예시**:
- `--output todo-app` → `outputs/todo-app/`
- PRD에 `project: { name: "Todo App" }` → `outputs/todo-app/`
- URL `https://wordcrack.world` → `outputs/wordcrack/`
- 기본값 → `outputs/mvp-20251226-143015/`

**도메인 추론 규칙**:
```typescript
function inferProjectNameFromURL(url: string): string {
  const parsed = new URL(url);

  // vercel.app, netlify.app 등: 서브도메인 사용
  if (parsed.hostname.endsWith('.vercel.app') ||
      parsed.hostname.endsWith('.netlify.app')) {
    return parsed.hostname.split('.')[0];  // "my-app.vercel.app" → "my-app"
  }

  // localhost: 포트 포함
  if (parsed.hostname === 'localhost') {
    return `localhost-${parsed.port}`;  // "localhost:3000" → "localhost-3000"
  }

  // 일반 도메인: 메인 도메인만
  const parts = parsed.hostname.split('.');
  return parts.length > 2 ? parts[parts.length - 2] : parts[0];
  // "blog.example.com" → "example"
  // "example.com" → "example"
}
```

**중요**: URL 기반 추론은 **타임스탬프보다 안정적**이므로 Record 모드에서 복구 가능합니다.

### 8.3 버전 관리 (선택)

동일 프로젝트에 대해 여러 번 실행 시:

```
outputs/
└── todo-app/
    ├── 2025-12-26_14-30-15/     # 첫 실행
    ├── 2025-12-26_16-45-30/     # 두 번째 실행
    └── latest → 2025-12-26_16-45-30/  # 심볼릭 링크
```

**활성화 조건**:
- 동일 프로젝트명으로 재실행 시
- `--version` 옵션 제공 시

---

## 9. 확장성 고려사항

### 9.1 향후 지원 계획

#### 다중 프로젝트 동시 처리
- 입력: 여러 프로젝트 URL 배열
- 각 프로젝트별로 독립적인 워크플로우 병렬 실행
- 웹 UI에서 프로젝트 목록 관리

#### Figma 연동
- Figma MCP 서버 추가
- 디자인 파일에서 직접 화면 추출
- URL 크롤링 대체 가능

#### 고급 크롤링
- 인증 페이지 지원 (로그인 자동화)
- 무한 스크롤 페이지 처리
- 동적 데이터 로딩 대기 로직

### 9.2 제약사항

**현재 버전에서 지원하지 않음**:
- 인증/권한 관리 (내부망 접근 제어로 대체)
- 협업 기능 (공유, 버전 비교)
- 다국어 지원 (한국어만)
- 외부 데이터 수집

---

## 부록 A: Phase별 상세 흐름

### Phase 1: 입력 수집 및 자동 크롤링

**목표**: 단일 URL에서 전체 사이트의 모든 페이지를 발견하고 분석

**핵심 알고리즘**: BFS (Breadth-First Search)

**크롤링 전략 (Tier 기반 - 순차적 Fallback)**:

**Tier 1 (DOM 링크 - 신뢰도 최고)**:
- `<a href="...">` 링크 태그
- `sitemap.xml` (존재 시)
- React Router `<Link to="...">` (DOM 기반)
- Next.js `<Link href="...">` (DOM 기반)
- **Hash 링크 처리**:
  - `<a href="#/about">` 형태의 링크 발견 시:
    1. Hash 라우팅 SPA로 판단
    2. 발견된 Hash 링크를 별도 목록에 수집
    3. **일반 경로 링크(non-hash)가 < 3개인 경우**:
       - Hash 라우팅 감지 메시지 표시 (Section 7.4 Phase 1 참조)
       - **Record 모드가 아닌 경우**: 즉시 **중단** (사용자 안내 후)
       - **Record 모드인 경우**: 계속 진행 (Record UI에서 Hash 링크 목록 표시)
    4. **일반 경로 링크가 >= 3개인 경우**:
       - 일반 링크 우선 크롤링
       - Hash 링크는 무시 (crawling-result.json에 기록하지 않음)
       - 정상 진행
- **충분성 기준**: 10개 이상 발견 시 크롤링 시작 (Hash 링크 제외)

**Tier 2A (소스코드 분석 - 정확도 높음)**:
- **적용 조건**: `--source-dir` 옵션 제공 시
- Next.js App Router: `app/**/page.tsx` 파일 스캔
  - `app/about/page.tsx` → `/about`
  - `app/products/[id]/page.tsx` → `/products/{id}` (동적 라우팅)
- Next.js Pages Router: `pages/**/*.tsx` 파일 스캔
  - `pages/about.tsx` → `/about`
- React Router: `src/App.tsx`에서 `<Route path="...">` 파싱
- Vue Router: `router/index.js`에서 경로 추출
- **성공률**: Next.js 95%, React Router 85%, Vue Router 70%
- **충분성 기준**: 10개 이상 발견 시 크롤링 시작

**Tier 2B (번들 분석 - 자동, 범용적)** ⭐ **NEW**:
- **적용 조건**: 항상 (자동)
- 배포된 JavaScript 번들 다운로드 (index.js, main.js, app.js)
- 정규식으로 경로 패턴 추출:
  - 문자열 경로: `["/about", "/products", "/contact"]`
  - Next.js 라우트 매니페스트 파싱
  - React Router path 속성: `path: "/dashboard"`
- 필터링: `/api`, `/static`, `/_next`, `.js`, `.css` 제외
- **장점**: 소스코드 없이도 작동, 매우 빠름 (5-10초)
- **성공률**: 40-50%
- **충분성 기준**: 5개 이상 발견 시 크롤링 시작

**Tier 2C (자동 인터랙션 탐색 - 실험적)** ⭐ **NEW**:
- **적용 조건**: Tier 2A/2B에서 충분한 경로 미발견 시
- History API (pushState/replaceState) 모니터링
- 클릭 가능 요소 자동 탐색:
  - `<button>`, `[role="button"]`, `.card`, `.nav-item` 등
  - 네비게이션 요소 우선 클릭
  - 최대 15개 요소 (30-45초 소요)
- URL 변경 또는 DOM 대폭 변화 감지 시 새 페이지로 인식
- **안전장치**: 위험 버튼 제외 (삭제, 로그아웃, 결제, 제출 등)
- **성공률**: 50-60% (State 기반 SPA)
- **충분성 기준**: 3개 이상 발견 시 크롤링 시작

**Tier 3 (수동 입력 - 최후의 수단)**:
- CLI `--urls urls.txt` 옵션
- 사용 시나리오:
  - Canvas/WebGL 기반 복잡한 인터랙션 (예: 3D 지구본)
  - 인증 필요 페이지
  - 동적 라우팅 (`/user/:id`)의 구체적인 예시 URL
  - **Hash 라우팅 SPA** (예: `/#/about`, `/#/products`) - 아래 참조
- **자동 탐색 실패 시**: 사용자에게 안내 메시지 표시

---

### **Hash 라우팅 SPA 대응 방안** ⚠️ 특수 케이스

**문제**:
```javascript
// Angular.js, 구형 Vue.js, 일부 React 앱
URL: https://example.com/#/about
URL: https://example.com/#/products
URL: https://example.com/#/contact

// Hash만 변경, 서버 요청 없음
// Tier 1-2C 모두 실패
```

**영향도**: 10-15% (레거시 SPA)

**대응 방법**:

#### **Option A: Record 모드 사용** ⭐ **권장**

```bash
/auto-draft --url https://example.com --record --source-dir ./source
```

**이유**:
- Hash 라우팅도 결국 State 기반과 동일 (URL 변경 없음)
- Record 모드로 100% 대응 가능
- 추가 개발 불필요

**프로세스**:
1. 사용자가 수동으로 `/#/about`, `/#/products` 등 탐색
2. 각 화면에서 "캡처" 버튼 클릭
3. 스크린샷 + DOM 자동 저장

---

#### **Option B: Tier 2D (Hash 감지) 추가** - 향후 계획

**구현 개요**:
```python
async def tier2d_hash_routing(page, base_url):
    """Hash 라우팅 감지 및 자동 크롤링"""

    # 1. hashchange 이벤트 리스닝
    await page.evaluate('''
        window.__hash_routes = new Set();

        window.addEventListener('hashchange', () => {
            window.__hash_routes.add(location.hash);
        });
    ''')

    # 2. 모든 링크 클릭 (hash만 변경하는 링크)
    hash_links = await page.evaluate('''
        Array.from(document.querySelectorAll('a[href^="#"]'))
            .map(a => a.getAttribute('href'))
    ''')

    for hash_link in hash_links:
        await page.goto(f"{base_url}{hash_link}")
        await asyncio.sleep(1)  # DOM 렌더링 대기

        # 스크린샷 캡처
        screenshot = await take_screenshot(page)

    # 3. 발견된 hash 경로 반환
    discovered_hashes = await page.evaluate('Array.from(window.__hash_routes)')
    return discovered_hashes
```

**예상 성공률**: 40-50%

**구현 시기**: MVP 이후, Phase 2 구현

**제약사항**:
- JavaScript로 동적 생성되는 hash 링크는 발견 어려움
- 여전히 일부 케이스는 Record 모드 필요

---

#### **현재 MVP 전략**: Option A (Record 모드) 사용

**이유**:
1. ✅ 즉시 사용 가능 (추가 개발 불필요)
2. ✅ 100% 성공률 (사용자가 직접 탐색)
3. ✅ Canvas/WebGL 앱도 동일 방법으로 대응
4. ⚠️ 반자동 (사용자 시간 5-10분 소요)

**사용자 안내 메시지**:
```
⚠️ Hash 라우팅 SPA 감지됨 (예: /#/about)

자동 크롤링이 어려운 구조입니다.
다음 중 하나를 선택하세요:

1. Record 모드 사용 (권장):
   /auto-draft --url https://example.com --record
   → 각 화면을 수동으로 탐색하며 캡처

2. 수동 URL 입력:
   /auto-draft --url https://example.com --urls urls.txt
   → urls.txt에 모든 hash 경로 나열:
     https://example.com/#/about
     https://example.com/#/products
     https://example.com/#/contact
```

---

**순차 적용 원칙**:
1. Tier 1 시도 → 충분하면 종료
2. Tier 2A 시도 (소스 제공 시) → 충분하면 종료
3. Tier 2B 시도 (항상) → 충분하면 종료
4. Tier 2C 시도 (선택적) → 충분하면 종료
5. **자동 크롤링 실패 감지**:
   - Tier 1-2C 모두 시도했으나 발견된 페이지 수 < 3개
   - 사용자에게 Record 모드 권장 메시지 표시:
     ```
     ⚠️ 자동 크롤링으로 충분한 화면을 발견하지 못했습니다.
     발견된 페이지: {count}개

     다음과 같은 경우 Record 모드 사용을 권장합니다:
     - Hash 라우팅 기반 SPA (예: /#/dashboard)
     - State 기반 화면 전환 (URL 변경 없음)
     - 인증이 필요한 화면

     Record 모드로 재시작하시겠습니까? (y/n)
     ```
   - 사용자가 'y' 선택 시: Record 모드로 자동 재시작
   - 사용자가 'n' 선택 시: Tier 3 사용 또는 루트 페이지만 크롤링
6. Tier 3 사용 또는 루트 페이지만 크롤링 (fallback)

**예상 전체 성공률**: 60-70% (보수적 추정, 검증 기반)
- **URL 라우팅 SPA**: 80-90% 자동 성공
- **State 기반 SPA**: Record 모드 필요 (반자동)
- **Tier 3 의존도**: 30-40%

**처리 흐름**: 자동 크롤링 (Tier 1-3) 또는 Record 모드

**제약 조건**:
- 최대 페이지 수: 50 (기본값, `--max-pages`로 조정 가능)
- 최대 깊이: 5 (기본값, `--max-depth`로 조정 가능)
- 타임아웃: 페이지당 30초
- 50페이지 초과 시: 우선순위 기반 선택
  - 메인 네비게이션 링크 우선
  - 정적 경로 우선 (`/about` > `/user?id=123`)

---

### **Record 모드** ⭐ **NEW (State 기반 SPA 대응)**

**목적**: State 기반 SPA 스크린샷 자동 캡처 (~50% 케이스)

**문제**:
```javascript
// wordcrack.world, kiki-lights 같은 앱
URL: / (고정)
State: 'home', 'quiz', 'result'  // React useState

문제:
→ URL 변화 없음
→ Tier 2B/2C 실패
→ 스크린샷 자동 캡처 불가 ❌
```

**해결책**: 사용자가 탐색 + 시스템이 자동 캡처

#### CLI 인터페이스

```bash
/auto-draft --url <url> --record [options]

옵션:
  --record              Record 모드 활성화
  --source-dir <dir>    소스코드 (선택, 화면 목록 추론용)
  --expected-screens N  예상 화면 개수
  --output <name>       프로젝트명 명시 (권장, 복구 기능에 필요)
```

#### 프로젝트명 결정 (Record 모드)

**중요**: Record 모드에서는 **복구 기능**을 위해 안정적인 프로젝트명이 필수입니다.

**권장 사용법**:
```bash
/auto-draft --url https://example.com --record --output my-project
```

**프로젝트명 결정 우선순위** (Section 8.2와 동일):
1. `--output` 옵션 (명시적 지정) ← **Record 모드에서 권장**
2. PRD 파일의 `project.name` 필드
3. README.md의 첫 번째 제목
4. URL의 `<title>` 태그
5. 기본값: `mvp-<timestamp>` ← **복구 불가능** (매번 다른 경로)

**복구 파일 경로**:
```python
recovery_file = f"outputs/{project_name}/.record-recovery.json"
```

**복구 시나리오**:
```bash
# 첫 실행 - 3개 화면 캡처 후 브라우저 크래시
$ /auto-draft --url https://example.com --record --output my-project

# 재실행 - 기존 3개 화면을 복구하고 이어서 진행
$ /auto-draft --url https://example.com --record --output my-project
⚠️ 이전 Record 세션 발견!
캡처된 화면: home, quiz, result (3개)
이어서 진행하시겠습니까? (y/n)
```

**주의사항**:
- `--output` 없이 실행 시 기본값 `mvp-<timestamp>` 사용
- 매번 다른 타임스탬프 생성 → 복구 파일 경로가 달라짐 → 복구 불가
- **Record 모드에서는 반드시 `--output` 사용 권장**

#### 워크플로우

```python
async def record_mode(url, source_dir):
    # 1. 소스코드에서 예상 화면 목록 추론 (선택)
    expected_screens = infer_screens_from_source(source_dir)
    # 예: ['home', 'quiz', 'result', 'leaderboard']

    # 2. Chrome 열기 + Record UI 주입
    page = await chrome_open(url)
    await inject_record_ui(page, expected_screens)

    # 3. 사용자 안내
    print("🎥 Record 모드")
    print("1. 각 화면을 차례로 탐색하세요")
    print("2. 새 화면이 나타나면 '📸 캡처' 버튼 클릭")
    print("3. 모든 화면 완료 후 '✅ 완료' 클릭")

    # 4. 사용자 인터랙션 대기
    captured_screens = []
    while not done:
        # 캡처 버튼 클릭 감지
        if user_clicked_capture():
            screen_name = input("화면 이름: ")
            screenshot = await take_screenshot(page)
            dom_state = await capture_dom(page)

            captured_screens.append({
                'name': screen_name,
                'screenshot': screenshot,
                'dom': dom_state
            })

        # 완료 버튼 감지
        if user_clicked_done():
            break

    # 5. crawling-result.json 생성
    return generate_crawl_result(captured_screens)
```

#### 스크린샷에서 화면 목록 추론

```python
def infer_screens_from_source(source_dir):
    """소스코드에서 화면/State 패턴 추출"""
    screens = set()

    for file in glob(f"{source_dir}/**/*.js"):
        content = open(file).read()

        # 패턴 1: State 상수 배열
        # const SCREENS = ['home', 'quiz', 'result'];
        matches = re.findall(r'\[(["\'][a-z_]+["\'],?\s*)+\]', content)

        # 패턴 2: Switch case
        # case 'quiz': showQuiz();
        cases = re.findall(r'case\s+["\']([a-z_]+)["\']:', content)
        screens.update(cases)

        # 패턴 3: 컴포넌트 파일명
        # QuizScreen.jsx → 'quiz'

    return list(screens)
```

#### Record UI (브라우저 내 주입)

```javascript
// 브라우저에 주입되는 UI
const recordUI = `
  <div id="draftify-record" style="position: fixed; top: 10px; right: 10px;
       background: #000; color: #fff; padding: 20px; z-index: 999999;">
    <h3>🎥 Record Mode</h3>
    <p>캡처된 화면: <span id="count">0</span> / ${expectedScreens.length}</p>
    <button id="capture-btn">📸 현재 화면 캡처</button>
    <button id="done-btn">✅ 완료</button>

    ${expectedScreens.length > 0 ? `
      <h4>예상 화면:</h4>
      <ul>
        ${expectedScreens.map(s => `<li>${s}</li>`).join('')}
      </ul>
    ` : ''}
  </div>
`;
```

#### crawling-result.json (Record 모드)

```json
{
  "metadata": {
    "mode": "record",
    "timestamp": "2025-12-27T10:30:00Z",
    "crawling_strategy": "record_mode",
    "total_pages": 3,
    "base_url": "https://wordcrack.world"
  },
  "pages": [
    {
      "url": "https://wordcrack.world/",
      "screen_name": "home",
      "screenshot": "outputs/screenshots/home.png",
      "dom": {
        "title": "Word Crack World",
        "h1": "Word Crack World",
        "buttons": ["Movies", "Songs", "Books"]
      },
      "discoveredBy": "user_interaction"
    },
    {
      "url": "https://wordcrack.world/",
      "screen_name": "quiz",
      "screenshot": "outputs/screenshots/quiz.png",
      "dom": {...},
      "discoveredBy": "user_interaction"
    }
  ],
  "crawling_strategy": "record_mode"
}
```

#### 성능 및 제약

**장점**:
- ✅ **State 기반 SPA 100% 지원**
- ✅ Canvas/WebGL 앱도 가능
- ✅ 정확한 스크린샷 (실제 사용 화면 그대로)

**단점**:
- ⚠️ 완전 자동 아님 (반자동)
- ⚠️ 사용자 시간 소요 (5분~10분)

**예상 시간**:
- 5개 화면: ~5분
- 10개 화면: ~10분

**상세 설계**: `record-mode-design.md` 참조

---

#### Phase 1 상세 알고리즘

##### 1. URL 정규화 함수

중복 URL 방지를 위한 정규화 규칙:

```typescript
function normalizeURL(urlString: string, baseURL: string): string {
  try {
    const url = new URL(urlString, baseURL);

    // 1. 프로토콜 통일 (http → https)
    url.protocol = 'https:';

    // 2. 트레일링 슬래시 제거 (단, root는 유지)
    if (url.pathname !== '/') {
      url.pathname = url.pathname.replace(/\/$/, '');
    }

    // 3. 쿼리 파라미터 정렬 및 필터링
    // 페이지네이션 파라미터만 유지, 나머지 제거
    const allowedParams = ['page', 'tab', 'category'];
    const params = new URLSearchParams();
    allowedParams.forEach(key => {
      if (url.searchParams.has(key)) {
        params.set(key, url.searchParams.get(key)!);
      }
    });

    // 파라미터를 알파벳순으로 정렬
    const sortedParams = new URLSearchParams(
      Array.from(params.entries()).sort()
    );
    url.search = sortedParams.toString();

    // 4. 해시 프래그먼트 제거
    url.hash = '';

    // 5. 도메인 소문자화
    url.hostname = url.hostname.toLowerCase();

    return url.toString();
  } catch (error) {
    // 파싱 실패 시 원본 반환
    return urlString;
  }
}

// 사용 예시:
normalizeURL('/home/', 'http://localhost:3000')
// → "https://localhost:3000/home"

normalizeURL('/search?q=test&utm_source=google', 'http://localhost:3000')
// → "https://localhost:3000/search"

normalizeURL('/products?category=books&page=2', 'http://localhost:3000')
// → "https://localhost:3000/products?category=books&page=2"
```

**정규화 규칙 요약**:
| 입력 | 출력 | 이유 |
|------|------|------|
| `/home/` | `/home` | 트레일링 슬래시 제거 |
| `/home?utm_source=x` | `/home` | 추적 파라미터 제거 |
| `/home#section` | `/home` | 해시 제거 (SPA 내부 네비게이션) |
| `/Home` vs `/home` | `/home` | 경로 소문자화 (서버 설정 따름) |
| `/page?b=2&a=1` | `/page?a=1&b=2` | 파라미터 정렬 |

##### 2. 우선순위 계산 함수

50페이지 초과 시 우선순위 점수 기반으로 중요한 페이지 선택:

```typescript
interface LinkInfo {
  url: string;
  depth: number;           // BFS 깊이
  isInMainNav: boolean;    // nav, header 태그 내부 여부
  hasQueryParams: boolean; // 쿼리 파라미터 존재 여부
  isDynamic: boolean;      // 동적 세그먼트 포함 여부 (/user/:id)
  text: string;            // 링크 텍스트
  tier: 1 | 2 | 3;         // 발견 Tier
}

function calculatePriority(link: LinkInfo): number {
  let score = 100;  // 기본 점수

  // 1. 깊이 페널티 (깊이가 깊을수록 감점)
  score -= link.depth * 15;

  // 2. 메인 네비게이션 보너스
  if (link.isInMainNav) {
    score += 50;
  }

  // 3. 정적 경로 보너스
  if (!link.hasQueryParams) {
    score += 30;
  }

  // 4. 동적 세그먼트 페널티
  if (link.isDynamic) {
    score -= 40;
  }

  // 5. Tier 보너스 (Tier 1이 가장 신뢰도 높음)
  switch (link.tier) {
    case 1: score += 20; break;
    case 2: score += 10; break;
    case 3: score += 0; break;
  }

  // 6. 링크 텍스트 길이 페널티 (너무 짧거나 긴 텍스트)
  if (link.text.length < 2 || link.text.length > 50) {
    score -= 10;
  }

  // 7. 특수 키워드 보너스
  const importantKeywords = ['home', 'about', 'login', 'signup', 'dashboard', 'profile'];
  const lowerPath = link.url.toLowerCase();
  if (importantKeywords.some(keyword => lowerPath.includes(keyword))) {
    score += 25;
  }

  return Math.max(0, score);  // 최소값 0
}

// 사용 예시:
calculatePriority({
  url: '/about',
  depth: 1,
  isInMainNav: true,
  hasQueryParams: false,
  isDynamic: false,
  text: 'About Us',
  tier: 1
})
// → 100 - 15 + 50 + 30 + 20 + 25 = 210

calculatePriority({
  url: '/user/123/posts?page=5',
  depth: 3,
  isInMainNav: false,
  hasQueryParams: true,
  isDynamic: true,
  text: 'View Posts',
  tier: 2
})
// → 100 - 45 - 40 + 10 = 25
```

**우선순위 점수 해석**:
- **200+**: 최우선 (메인 네비게이션, 정적 경로, 얕은 깊이)
- **100-199**: 높은 우선순위
- **50-99**: 중간 우선순위
- **0-49**: 낮은 우선순위 (50페이지 초과 시 제외 가능)

##### 3. Tier 2A: 소스코드 라우트 추출

```python
def extract_routes_from_source(source_dir: str) -> list[str]:
    """
    로컬 소스코드에서 라우트 정의 자동 추출

    Args:
        source_dir: 소스코드 디렉토리 경로

    Returns:
        발견된 경로 목록 (예: ["/", "/about", "/products/{id}"])
    """
    routes = set()

    # Next.js App Router 감지
    app_dir = os.path.join(source_dir, 'app')
    if os.path.exists(app_dir):
        for page_file in glob(f"{app_dir}/**/page.tsx") + glob(f"{app_dir}/**/page.js"):
            # app/about/page.tsx → /about
            # app/products/[id]/page.tsx → /products/{id}
            route = page_file.replace(app_dir, '') \
                             .replace('/page.tsx', '') \
                             .replace('/page.js', '') \
                             .replace('[', '{') \
                             .replace(']', '}')

            # 라우트 그룹 (app/(marketing)/about) 제외
            if not re.search(r'\([^)]+\)', route):
                routes.add(route or '/')

    # Next.js Pages Router 감지
    pages_dir = os.path.join(source_dir, 'pages')
    if os.path.exists(pages_dir):
        for page_file in glob(f"{pages_dir}/**/*.tsx") + glob(f"{pages_dir}/**/*.js"):
            # pages/about.tsx → /about
            # pages/api/* 제외
            if '/api/' not in page_file:
                route = page_file.replace(pages_dir, '') \
                                 .replace('.tsx', '') \
                                 .replace('.js', '') \
                                 .replace('[', '{') \
                                 .replace(']', '}') \
                                 .replace('/index', '')

                # _app, _document 등 내부 파일 제외
                if not os.path.basename(page_file).startswith('_'):
                    routes.add(route or '/')

    # React Router 감지 (src/App.tsx, src/routes.tsx)
    for router_file in ['src/App.tsx', 'src/App.js', 'src/routes.tsx', 'src/routes.js']:
        file_path = os.path.join(source_dir, router_file)
        if os.path.exists(file_path):
            content = open(file_path).read()

            # <Route path="/about" /> 패턴
            route_paths = re.findall(r'<Route\s+path="([^"]+)"', content)
            routes.update(route_paths)

            # createBrowserRouter([{ path: "/about" }]) 패턴
            router_paths = re.findall(r'path:\s*["\']([^"\']+)["\']', content)
            routes.update(router_paths)

    # Vue Router 감지 (src/router/index.js)
    vue_router = os.path.join(source_dir, 'src/router/index.js')
    if os.path.exists(vue_router):
        content = open(vue_router).read()

        # { path: '/about', ... } 패턴
        vue_paths = re.findall(r'path:\s*["\']([^"\']+)["\']', content)
        routes.update(vue_paths)

    return sorted(list(routes))


# 사용 예시:
extract_routes_from_source('./my-nextjs-app')
# → ["/", "/about", "/products", "/products/{id}", "/contact"]
```

##### 4. Tier 2B: 배포된 번들 분석

```python
async def extract_routes_from_bundle(page) -> list[str]:
    """
    배포된 JavaScript 번들에서 경로 패턴 추출

    - 소스코드 없이도 작동
    - Minified 코드에서도 경로 발견
    - 매우 빠름 (5-10초)

    Returns:
        발견된 경로 목록
    """

    # 1. 메인 번들 스크립트 찾기
    scripts = await page.evaluate('''
        Array.from(document.querySelectorAll('script[src]'))
             .map(s => s.src)
             .filter(src => {
                 const lower = src.toLowerCase();
                 return lower.includes('index') ||
                        lower.includes('main') ||
                        lower.includes('app') ||
                        lower.includes('chunk');
             })
    ''')

    discovered_routes = set()

    # 2. 각 번들 다운로드 및 분석 (최대 5개)
    for script_url in scripts[:5]:
        try:
            # 번들 다운로드 (최대 2MB)
            response = await fetch(script_url)
            content = await response.text()

            if len(content) > 2_000_000:
                print(f"번들 너무 큼, 스킵: {script_url}")
                continue

            # 3. 경로 패턴 추출
            routes = extract_route_patterns_from_js(content)
            discovered_routes.update(routes)

        except Exception as e:
            print(f"번들 분석 실패: {script_url}, {e}")
            continue

    return sorted(list(discovered_routes))


def extract_route_patterns_from_js(js_content: str) -> set[str]:
    """
    JavaScript 코드에서 경로 패턴 추출
    """
    routes = set()

    # 패턴 1: 문자열 경로 리터럴 ("/about", "/products" 등)
    # - 단순 문자열로 된 경로 추출
    # - API, 정적 리소스, Next.js 내부 경로 제외
    string_routes = re.findall(
        r'["\'](/[a-zA-Z0-9\-_]+(?:/[a-zA-Z0-9\-_]+)*)["\']',
        js_content
    )

    for route in string_routes:
        # 필터링
        if any(x in route for x in ['/api', '/static', '/_next', '/assets', '.js', '.css', '.png', '.jpg']):
            continue
        if len(route) < 50 and route.count('/') <= 4:
            routes.add(route)

    # 패턴 2: Next.js __NEXT_DATA__ 또는 라우트 매니페스트
    manifest_match = re.search(r'"routes":\s*\[(.*?)\]', js_content)
    if manifest_match:
        manifest_routes = re.findall(r'["\'"]([^"\']+)["\'"]', manifest_match.group(1))
        routes.update(r for r in manifest_routes if r.startswith('/'))

    # 패턴 3: path: "/xxx" 패턴 (React Router, Vue Router)
    path_definitions = re.findall(r'path:\s*["\'"]([^"\']+)["\'"]', js_content)
    routes.update(p for p in path_definitions if p.startswith('/'))

    # 패턴 4: route("/xxx") 함수 호출
    route_calls = re.findall(r'route\(["\'"]([^"\']+)["\'"]', js_content)
    routes.update(r for r in route_calls if r.startswith('/'))

    return routes


# 사용 예시:
await extract_routes_from_bundle(page)
# → ["/", "/about", "/products", "/contact", "/dashboard"]
```

##### 5. Tier 2C: 자동 인터랙션 탐색

```python
async def auto_explore_spa(page, max_clicks: int = 15) -> dict:
    """
    클릭 가능 요소를 자동으로 탐색하며 새 페이지 발견

    - History API 모니터링
    - 안전한 요소만 클릭
    - URL 변경 또는 DOM 대폭 변화 감지

    Args:
        page: Chrome DevTools Page 객체
        max_clicks: 최대 클릭 시도 횟수

    Returns:
        {
            'pages': [발견한 페이지 목록],
            'routes': [발견한 경로 목록]
        }
    """

    # 1. History API 가로채기 (모니터링)
    await page.evaluate('''
        window.__discoveredRoutes = new Set();

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function(...args) {
            window.__discoveredRoutes.add(location.pathname);
            console.log('[Draftify] 경로 발견:', location.pathname);
            return originalPushState.apply(this, args);
        };

        history.replaceState = function(...args) {
            window.__discoveredRoutes.add(location.pathname);
            return originalReplaceState.apply(this, args);
        };
    ''')

    # 2. 클릭 가능 요소 추출 (안전한 것만)
    clickables = await page.evaluate('''
        const DANGEROUS_KEYWORDS = [
            '삭제', 'delete', '제거', 'remove',
            '로그아웃', 'logout', 'sign out',
            '결제', 'payment', 'pay', 'checkout',
            '제출', 'submit', '전송', 'send'
        ];

        function isSafeToClick(text) {
            const lower = text.toLowerCase();
            return !DANGEROUS_KEYWORDS.some(kw => lower.includes(kw));
        }

        function getUniqueSelector(el) {
            if (el.id) return `#${el.id}`;
            if (el.className) return `${el.tagName.toLowerCase()}.${el.className.split(' ')[0]}`;
            return el.tagName.toLowerCase();
        }

        const elements = [];

        document.querySelectorAll(`
            button,
            [role="button"],
            a,
            .card,
            .nav-item,
            [onclick]
        `).forEach(el => {
            const rect = el.getBoundingClientRect();
            const style = window.getComputedStyle(el);
            const text = el.textContent.trim();

            // 보이는 요소 + 안전한 텍스트
            if (rect.width > 0 && rect.height > 0 &&
                style.visibility !== 'hidden' &&
                style.display !== 'none' &&
                isSafeToClick(text)) {

                elements.push({
                    selector: getUniqueSelector(el),
                    text: text.substring(0, 30),
                    tag: el.tagName.toLowerCase(),
                    inNav: !!el.closest('nav, header, aside')
                });
            }
        });

        // 네비게이션 요소 우선 정렬
        elements.sort((a, b) => {
            if (a.inNav && !b.inNav) return -1;
            if (!a.inNav && b.inNav) return 1;
            return 0;
        });

        return elements;
    ''')

    discovered_pages = []
    visited_states = set()

    # 3. 순차적으로 클릭 시도
    for i, clickable in enumerate(clickables[:max_clicks]):
        try:
            # 현재 상태 저장
            before_url = page.url()
            before_state = await get_page_signature(page)

            # 클릭!
            await page.click(clickable['selector'], timeout=3000)
            await page.wait_for_timeout(1500)  # 1.5초 대기

            # 변화 확인
            after_url = page.url()
            after_state = await get_page_signature(page)

            # URL 변경 또는 DOM 대폭 변경 감지
            state_hash = hash(json.dumps(after_state))

            if (after_url != before_url or after_state != before_state) and \
               state_hash not in visited_states:

                visited_states.add(state_hash)

                # 새 페이지 발견!
                discovered_pages.append({
                    'url': after_url,
                    'trigger': clickable['text'],
                    'screenshot': await take_screenshot(page)
                })

                print(f"[Tier 2C] 페이지 발견: {after_url} (트리거: {clickable['text']})")

                # 뒤로가기
                await page.go_back()
                await page.wait_for_timeout(1000)

        except Exception as e:
            # 클릭 실패해도 계속 진행
            print(f"[Tier 2C] 클릭 실패: {clickable['selector']}")
            continue

    # 4. History API로 발견한 경로 수집
    discovered_routes = await page.evaluate('Array.from(window.__discoveredRoutes)')

    return {
        'pages': discovered_pages,
        'routes': discovered_routes
    }


async def get_page_signature(page) -> dict:
    """페이지의 고유 시그니처 생성 (변화 감지용)"""
    return await page.evaluate('''
        ({
            title: document.title,
            h1: document.querySelector('h1')?.textContent || '',
            mainText: document.body.textContent.substring(0, 200),
            elementCount: document.querySelectorAll('*').length
        })
    ''')


# 사용 예시:
result = await auto_explore_spa(page, max_clicks=15)
# → {
#     'pages': [
#         {'url': '/about', 'trigger': 'About', 'screenshot': '...'},
#         {'url': '/contact', 'trigger': 'Contact Us', 'screenshot': '...'}
#     ],
#     'routes': ['/about', '/contact', '/products']
# }
```

##### 6. 통합 크롤링 함수 (BFS 전 단계)

```python
async def phase1_intelligent_crawling(url: str, options: CrawlOptions) -> CrawlResult:
    """
    Tier 순차 적용 + 충분성 검사를 통한 지능형 크롤링

    Args:
        url: 크롤링할 루트 URL
        options: 크롤링 옵션
            - source_dir: 소스코드 디렉토리 (선택)
            - urls: 수동 URL 목록 파일 (선택)
            - max_pages: 최대 페이지 수 (기본 50)
            - max_depth: 최대 깊이 (기본 5)

    Returns:
        크롤링 결과
    """

    discovered_urls = {url}  # 루트 URL
    crawling_log = []

    print(f"\n🚀 Phase 1 크롤링 시작: {url}")
    print(f"   옵션: max_pages={options.max_pages}, max_depth={options.max_depth}\n")

    # ============ Tier 1: DOM 링크 ============
    print("[Tier 1] DOM <a> 링크 추출 중...")
    tier1_links = await extract_dom_links(url)
    discovered_urls.update(tier1_links)

    crawling_log.append({
        'tier': 1,
        'method': 'DOM links',
        'found': len(tier1_links),
        'total': len(discovered_urls)
    })

    print(f"   → {len(tier1_links)}개 링크 발견 (누적: {len(discovered_urls)}개)")

    # 충분성 검사: 10개 이상 발견 시 크롤링 시작
    if len(discovered_urls) >= 10:
        print(f"✅ Tier 1 성공! 충분한 링크 확보. BFS 크롤링 시작.\n")
        return await bfs_crawl(discovered_urls, options)

    # ============ Tier 2A: 소스코드 분석 (제공 시) ============
    if options.source_dir:
        print(f"\n[Tier 2A] 소스코드 분석 중: {options.source_dir}")
        tier2a_routes = extract_routes_from_source(options.source_dir)
        tier2a_urls = {urljoin(url, route) for route in tier2a_routes}
        discovered_urls.update(tier2a_urls)

        crawling_log.append({
            'tier': '2A',
            'method': '소스코드 분석',
            'found': len(tier2a_routes),
            'total': len(discovered_urls)
        })

        print(f"   → {len(tier2a_routes)}개 경로 발견 (누적: {len(discovered_urls)}개)")

        if len(discovered_urls) >= 10:
            print(f"✅ Tier 2A 성공! BFS 크롤링 시작.\n")
            return await bfs_crawl(discovered_urls, options)

    # ============ Tier 2B: 번들 분석 (항상 시도) ============
    print(f"\n[Tier 2B] 배포된 번들 분석 중...")
    page = await navigate_to(url)
    tier2b_routes = await extract_routes_from_bundle(page)
    tier2b_urls = {urljoin(url, route) for route in tier2b_routes}
    discovered_urls.update(tier2b_urls)

    crawling_log.append({
        'tier': '2B',
        'method': '번들 분석',
        'found': len(tier2b_routes),
        'total': len(discovered_urls)
    })

    print(f"   → {len(tier2b_routes)}개 경로 발견 (누적: {len(discovered_urls)}개)")

    if len(discovered_urls) >= 5:
        print(f"✅ Tier 2B 성공! BFS 크롤링 시작.\n")
        return await bfs_crawl(discovered_urls, options)

    # ============ Tier 2C: 자동 인터랙션 탐색 ============
    print(f"\n[Tier 2C] 자동 클릭 탐색 중... (최대 15개 요소)")
    exploration_result = await auto_explore_spa(page, max_clicks=15)

    tier2c_urls = {p['url'] for p in exploration_result['pages']}
    tier2c_urls.update({urljoin(url, r) for r in exploration_result['routes']})
    discovered_urls.update(tier2c_urls)

    crawling_log.append({
        'tier': '2C',
        'method': '자동 탐색',
        'found': len(tier2c_urls),
        'total': len(discovered_urls),
        'pages': exploration_result['pages']  # 스크린샷 포함
    })

    print(f"   → {len(tier2c_urls)}개 페이지 발견 (누적: {len(discovered_urls)}개)")

    if len(discovered_urls) >= 3:
        print(f"✅ Tier 2C 성공! BFS 크롤링 시작.\n")
        return await bfs_crawl(discovered_urls, options)

    # ============ Tier 3: 수동 URL (최후의 수단) ============
    if options.urls:
        print(f"\n[Tier 3] 수동 URL 목록 사용: {options.urls}")
        tier3_urls = read_manual_urls(options.urls)
        discovered_urls.update(tier3_urls)

        crawling_log.append({
            'tier': 3,
            'method': '수동 입력',
            'found': len(tier3_urls),
            'total': len(discovered_urls)
        })

        print(f"   → {len(tier3_urls)}개 URL 제공됨 (누적: {len(discovered_urls)}개)")
        print(f"✅ Tier 3 사용. BFS 크롤링 시작.\n")
        return await bfs_crawl(discovered_urls, options)

    # ============ 최악의 경우: 루트만 ============
    print("\n⚠️  경고: 추가 페이지를 발견하지 못했습니다.")
    print("    루트 페이지만 분석합니다.")
    print(f"\n💡 팁: --urls 옵션으로 수동 URL 목록을 제공할 수 있습니다:")
    print(f"    /auto-draft --url {url} --urls urls.txt\n")

    crawling_log.append({
        'tier': 'fallback',
        'method': '루트 페이지만',
        'found': 0,
        'total': 1
    })

    return await crawl_single_page(url)


# 사용 예시:
result = await phase1_intelligent_crawling(
    url="https://my-mvp.vercel.app",
    options=CrawlOptions(
        source_dir="./my-mvp-source",  # 선택
        urls="urls.txt",                # 선택
        max_pages=50,
        max_depth=5
    )
)
```

**실행 예시 (Next.js SPA)**:
```
🚀 Phase 1 크롤링 시작: https://my-nextjs-app.vercel.app
   옵션: max_pages=50, max_depth=5

[Tier 1] DOM <a> 링크 추출 중...
   → 2개 링크 발견 (누적: 3개)

[Tier 2A] 소스코드 분석 중: ./my-nextjs-app
   → 0개 경로 발견 (누적: 3개)

[Tier 2B] 배포된 번들 분석 중...
   → 8개 경로 발견 (누적: 11개)
✅ Tier 2B 성공! BFS 크롤링 시작.

[BFS 크롤링] 11개 URL 발견, 크롤링 시작...
```

##### 7. BFS 크롤링 알고리즘 (의사코드)

```typescript
interface CrawlResult {
  url: string;
  title: string;
  dom: DOMSnapshot;
  screenshot: string;
  depth: number;
  links: LinkInfo[];
}

async function crawlWebsite(
  startURL: string,
  maxPages: number = 50,
  maxDepth: number = 5
): Promise<CrawlResult[]> {

  // 초기화
  const queue: Array<{url: string, depth: number}> = [
    { url: startURL, depth: 0 }
  ];
  const visited = new Set<string>();
  const results: CrawlResult[] = [];

  // 우선순위 큐 (나중에 정렬에 사용)
  const pendingLinks: Array<LinkInfo & {depth: number}> = [];

  while (queue.length > 0 && results.length < maxPages) {
    // 우선순위가 높은 URL부터 처리
    queue.sort((a, b) => a.depth - b.depth);  // 깊이 우선

    const { url: currentURL, depth } = queue.shift()!;

    // 1. 정규화 및 중복 체크
    const normalizedURL = normalizeURL(currentURL, startURL);

    if (visited.has(normalizedURL)) {
      continue;
    }

    if (depth > maxDepth) {
      console.warn(`Max depth ${maxDepth} exceeded for ${currentURL}`);
      continue;
    }

    visited.add(normalizedURL);

    // 2. 페이지 크롤링 (Chrome DevTools MCP 사용)
    try {
      // 2-1. 페이지 이동
      await chromeDevTools.navigate_page(currentURL);

      // 2-2. 페이지 로드 대기 (SPA 렌더링 고려)
      await chromeDevTools.wait_for({
        selector: 'body',
        state: 'visible',
        timeout: 30000
      });

      // 2-3. DOM 분석 (Tier 1 링크 추출)
      const domData = await chromeDevTools.evaluate_script(`
        {
          // 모든 <a> 태그 추출
          const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
            href: a.href,
            text: a.textContent.trim(),
            isInMainNav: a.closest('nav, header') !== null,
            tier: 1
          }));

          // 버튼, 폼 등 UI 요소 추출
          const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
            text: btn.textContent.trim(),
            onClick: btn.getAttribute('onclick') || ''
          }));

          const forms = Array.from(document.querySelectorAll('form')).map(form => ({
            id: form.id,
            action: form.action,
            method: form.method
          }));

          return { links, buttons, forms, title: document.title };
        }
      `);

      // 2-4. Tier 2 링크 추출 (onClick 핸들러 파싱)
      const tier2Links = extractLinksFromClickHandlers(domData.buttons);

      // 2-5. 스크린샷 캡처
      const screenshot = await chromeDevTools.take_screenshot({
        format: 'png',
        path: `screenshots/screen-${String(results.length + 1).padStart(3, '0')}.png`
      });

      // 3. 결과 저장
      const allLinks = [...domData.links, ...tier2Links];

      results.push({
        url: normalizedURL,
        title: domData.title,
        dom: {
          buttons: domData.buttons,
          forms: domData.forms,
          links: allLinks
        },
        screenshot: screenshot.path,
        depth: depth,
        links: allLinks
      });

      // 4. 새로운 링크를 큐에 추가
      for (const link of allLinks) {
        const linkInfo: LinkInfo & {depth: number} = {
          url: link.href,
          depth: depth + 1,
          isInMainNav: link.isInMainNav,
          hasQueryParams: link.href.includes('?'),
          isDynamic: /\/:\w+/.test(link.href),  // /user/:id 패턴
          text: link.text,
          tier: link.tier,
        };

        pendingLinks.push(linkInfo);
      }

      // 5. 우선순위 계산 및 큐 정렬
      pendingLinks.sort((a, b) => calculatePriority(b) - calculatePriority(a));

      // 6. maxPages 고려하여 큐에 추가
      const remainingSlots = maxPages - results.length - queue.length;
      const linksToAdd = pendingLinks.splice(0, remainingSlots);

      for (const link of linksToAdd) {
        const normalized = normalizeURL(link.url, startURL);
        if (!visited.has(normalized)) {
          queue.push({ url: link.url, depth: link.depth });
        }
      }

    } catch (error) {
      console.error(`Failed to crawl ${currentURL}:`, error);
      // 에러 로그 기록 후 계속 진행
      continue;
    }
  }

  // 7. Tier 3 수동 URL 처리 (--urls 옵션)
  // (별도 함수로 분리, 결과에 병합)

  return results;
}

// Tier 2: onClick 핸들러에서 경로 추출
function extractLinksFromClickHandlers(buttons: any[]): LinkInfo[] {
  const links: LinkInfo[] = [];

  for (const btn of buttons) {
    // navigate('/path') 패턴
    const navigateMatch = btn.onClick.match(/navigate\(['"](.+?)['"]\)/);
    if (navigateMatch) {
      links.push({
        url: navigateMatch[1],
        text: btn.text,
        isInMainNav: false,
        tier: 2
      });
    }

    // router.push('/path') 패턴
    const routerMatch = btn.onClick.match(/router\.push\(['"](.+?)['"]\)/);
    if (routerMatch) {
      links.push({
        url: routerMatch[1],
        text: btn.text,
        isInMainNav: false,
        tier: 2
      });
    }
  }

  return links;
}
```

**알고리즘 핵심 특징**:
1. **BFS (너비 우선 탐색)**: 깊이가 얕은 페이지부터 우선 처리
2. **우선순위 큐**: maxPages 초과 시 중요한 링크만 선택
3. **정규화**: 중복 URL 자동 제거
4. **Tier 기반 발견**: 신뢰도 높은 링크 우선
5. **SPA 지원**: wait_for로 렌더링 대기
6. **에러 복구**: 개별 페이지 실패 시 전체 중단하지 않음

**산출물**:
- `crawling-result.json`: 발견된 모든 페이지 정보
- `screenshots/`: 페이지별 스크린샷

---

### Phase 2: 통합 분석

**목표**: 크롤링 결과 + 문서들을 통합하여 구조화된 데이터 생성

**에이전트**: input-analyzer

**처리 흐름**:
1. crawling-result.json 파싱
2. 각 문서 파일 읽기 (PRD, SDD, README 등)
3. 정보 추출:
   - 화면 목록 및 구조
   - 정책 및 규칙
   - 프로세스 흐름
   - 용어 정의
4. 중복 제거 및 통합
5. JSON 스키마에 맞춰 구조화

**산출물**:
- `analyzed-structure.json`

---

### Phase 3-1: 선행 섹션 생성

**목표**: 정책 및 용어 섹션 생성 (다른 섹션의 참조 대상)

**에이전트**: policy-generator, glossary-generator (순차 실행)

**처리 흐름**:
1. **policy-generator**:
   - analyzed-structure.json의 `policies` 읽기
   - auto-draft-guideline.md Section 6 기준 확인
   - 정책 ID 할당 (POL-001, POL-002...)
   - 정책정의서 마크다운 생성
2. **glossary-generator**:
   - analyzed-structure.json의 `glossary` 읽기
   - 용어 목록 가나다순/알파벳순 정렬
   - 용어집 마크다운 생성

**산출물**:
- `sections/06-policy-definition.md` (정책 ID 포함)
- `sections/04-glossary.md`

---

### Phase 3-2: 후행 섹션 생성

**목표**: 화면 및 프로세스 섹션 생성 (정책 ID 참조)

**에이전트**: screen-generator, process-generator (병렬 실행)

**처리 흐름** (각 에이전트별):
1. analyzed-structure.json 읽기
2. policy-definition.md에서 정책 ID 목록 추출
3. auto-draft-guideline.md 해당 섹션 기준 확인
4. 정책 ID를 참조하여 섹션 콘텐츠 생성
5. 마크다운 파일로 저장

**산출물**:
- `sections/08-screen-definition.md` (정책 ID 참조)
- `sections/07-process-flow.md` (정책 ID 참조)

---

### Phase 3.5: 품질 검증

**목표**: 생성된 섹션들의 품질 및 일관성 검증

**에이전트**: quality-validator

**검증 항목**:
- guideline 필수 섹션 존재 여부
- 화면 ID 참조 일관성 (SCR-001 등)
- 정책 ID 참조 일관성 (POL-001 등)
- 중복 내용 체크
- 누락 항목 탐지

**산출물**:
- `validation-report.md` (PASS/FAIL + 권장사항)

---

### Phase 4: 문서 생성

**목표**: 섹션 마크다운들을 최종 문서로 변환

**스킬**: ppt-generator (별도 스킬로 구현 예정)

**개요**:
- 이 Phase는 별도의 독립 스킬로 작성됩니다
- 마크다운 섹션 파일들을 입력으로 받아 PPT 또는 HTML 생성
- 상세 구현 사항은 ppt-generator 스킬 문서 참조

**주요 기능**:
1. 마크다운 → PPT 변환 (python-pptx 활용)
2. 회사 템플릿 적용
3. 스크린샷 임베딩
4. 대체 출력: HTML 뷰어 (PPT 생성 실패 시)

**산출물**:
- `final-draft.pptx` (또는 `final-draft.html`)

**참고**:
- 이 설계서에서는 Phase 4의 입출력 인터페이스만 정의
- 내부 구현은 별도 스킬에서 담당

---

## 부록 B: 데이터 스키마

### crawling-result.json 스키마

**목적**: Phase 1 크롤링 결과를 Phase 2 (input-analyzer)에 전달하는 중간 데이터

**지원 모드**: 자동 크롤링 (Tier 1-3) + Record 모드

#### 통합 스키마

```json
{
  "metadata": {
    "mode": "auto" | "record",  // 크롤링 모드 (record = manual_capture)
    "timestamp": "ISO 8601 format (예: 2025-12-27T10:30:00Z)",
    "crawling_strategy": "tier1" | "tier2a" | "tier2b" | "tier2c" | "tier3" | "record_mode",
    "total_pages": 15,
    "max_depth": 5,
    "max_pages": 50,
    "base_url": "https://example.com",
    "source_dir_provided": true | false,
    "expected_screens": ["home", "quiz", "result"]  // Record 모드만, 선택
  },
  "pages": [
    {
      "url": "https://example.com/about",
      "screen_name": "about" | null,  // Record 모드만 (사용자 입력)
      "screenshot": "outputs/screenshots/screen-001.png",
      "dom": {
        "title": "About Us",
        "h1": "회사 소개",
        "h2": "우리의 미션",
        "buttons": ["문의하기", "채용 정보"],
        "inputs": [
          {
            "type": "text",
            "placeholder": "이메일 입력",
            "name": "email"
          }
        ],
        "links": [
          {
            "text": "홈으로",
            "href": "/"
          }
        ],
        "elementCount": 125
      },
      "depth": 1,  // BFS 깊이 (Record 모드는 0)
      "discoveredBy": "tier1" | "tier2a" | "tier2b" | "tier2c" | "tier3" | "user_interaction",
      "timestamp": "ISO 8601 format"
    }
  ],
  "links": [
    // 자동 크롤링 모드만 (BFS용)
    // Record 모드에서는 빈 배열 []
    {
      "url": "https://example.com/contact",
      "text": "문의하기",
      "source_page": "https://example.com/about",
      "priority": 0.85,
      "visited": false
    }
  ],
  "errors": [
    // 실패한 페이지 (선택)
    {
      "url": "https://example.com/admin",
      "error": "401 Unauthorized",
      "timestamp": "ISO 8601 format"
    }
  ]
}
```

#### 필드 설명

**metadata**:
- `mode`: 크롤링 모드 (auto = 자동 크롤링, record = 수동 캡처)
  - Note: `mode == "record"`는 manual capture를 의미 (별도 필드 불필요)
- `crawling_strategy`: 실제 사용된 Tier 전략 (어떤 전략으로 페이지를 찾았는가)
  - 예: "tier1" (DOM 링크), "tier2b" (번들 분석), "record_mode" (수동)
- `expected_screens`: 소스코드에서 추론한 화면 목록 (Record 모드 전용, 선택)

**pages[].screen_name**:
- Record 모드: 사용자가 입력한 화면 이름 (필수)
- 자동 모드: `null` (input-analyzer가 URL에서 추론)

**pages[].discoveredBy**:
- `tier1`: DOM 링크 (`<a href>`)
- `tier2a`: 소스코드 분석
- `tier2b`: 번들 패턴 추출
- `tier2c`: 자동 인터랙션 탐색
- `tier3`: 사용자 수동 입력
- `user_interaction`: Record 모드 사용자 캡처

**links[]**:
- 자동 크롤링 모드만 사용 (BFS 큐 관리)
- Record 모드에서는 빈 배열 `[]`

**errors[]**:
- 실패한 페이지 목록 (선택)
- validation-report.md에 포함될 수 있음

#### 예시 1: 자동 크롤링 모드

```json
{
  "metadata": {
    "mode": "auto",
    "timestamp": "2025-12-27T10:30:00Z",
    "crawling_strategy": "tier2b",
    "total_pages": 12,
    "max_depth": 3,
    "max_pages": 50,
    "base_url": "https://todo-app.com"
  },
  "pages": [
    {
      "url": "https://todo-app.com/",
      "screen_name": null,
      "screenshot": "outputs/screenshots/screen-001.png",
      "dom": {...},
      "depth": 0,
      "discoveredBy": "tier1"
    }
  ],
  "links": [
    {
      "url": "https://todo-app.com/about",
      "text": "About",
      "source_page": "https://todo-app.com/",
      "priority": 0.9,
      "visited": true
    }
  ],
  "errors": []
}
```

#### 예시 2: Record 모드

```json
{
  "metadata": {
    "mode": "record",
    "timestamp": "2025-12-27T11:00:00Z",
    "crawling_strategy": "record_mode",
    "total_pages": 5,
    "base_url": "https://wordcrack.world",
    "source_dir_provided": true,
    "expected_screens": ["home", "quiz", "result", "leaderboard"]
  },
  "pages": [
    {
      "url": "https://wordcrack.world/",
      "screen_name": "home",
      "screenshot": "outputs/screenshots/home.png",
      "dom": {...},
      "depth": 0,
      "discoveredBy": "user_interaction",
      "timestamp": "2025-12-27T11:05:23Z"
    },
    {
      "url": "https://wordcrack.world/",
      "screen_name": "quiz",
      "screenshot": "outputs/screenshots/quiz.png",
      "dom": {...},
      "depth": 0,
      "discoveredBy": "user_interaction",
      "timestamp": "2025-12-27T11:07:45Z"
    }
  ],
  "links": [],
  "errors": []
}
```

---

### analyzed-structure.json 스키마

```json
{
  "project": {
    "name": "프로젝트명",
    "version": "1.0",
    "purpose": "서비스 목적",
    "organization": "조직명",
    "created_date": "2025-12-26"
  },
  "glossary": [
    {
      "term": "용어",
      "definition": "정의",
      "context": "사용 맥락"
    }
  ],
  "policies": [
    {
      "id": "POL-AUTH-001",
      "category": "인증",
      "rule": "규칙 내용",
      "condition": "적용 조건",
      "exception": "예외 사항"
    }
  ],
  "screens": [
    {
      "id": "SCR-001",
      "name": "메인 화면",
      "url": "/home",
      "purpose": "화면 목적",
      "screenshot": "screenshots/screen-001.png",
      "entry_condition": "진입 조건",
      "exit_condition": "이탈 조건",
      "elements": [
        {
          "id": "BTN-001",
          "type": "button",
          "label": "시작하기",
          "action": {
            "type": "navigate",
            "target": "SCR-002",
            "params": {},
            "trigger": "click"
          }
        },
        {
          "id": "FORM-001",
          "type": "form",
          "label": "로그인 폼",
          "action": {
            "type": "submit",
            "target": "API-001",
            "params": { "method": "POST" },
            "trigger": "submit"
          }
        }
      ],
      "related_policies": ["POL-AUTH-001", "POL-VAL-003"]
    }
  ],
  "apis": [
    {
      "id": "API-001",
      "path": "/api/auth/login",
      "method": "POST",
      "description": "사용자 로그인",
      "request_body": {
        "email": "string",
        "password": "string"
      },
      "response": {
        "success": { "token": "string", "user": "object" },
        "error": { "message": "string", "code": "number" }
      },
      "related_policies": ["POL-AUTH-001"]
    }
  ],
  "flows": [
    {
      "name": "회원가입 프로세스",
      "description": "신규 사용자 등록 흐름",
      "steps": [
        {
          "order": 1,
          "screen_id": "SCR-001",
          "action": "시작하기 클릭",
          "condition": {
            "type": "always",
            "expression": null,
            "policy_ref": null
          },
          "next_screen": "SCR-002"
        },
        {
          "order": 2,
          "screen_id": "SCR-002",
          "action": "회원가입 폼 제출",
          "condition": {
            "type": "policy_check",
            "expression": "form.isValid === true",
            "policy_ref": "POL-VAL-001"
          },
          "next_screen": "SCR-003"
        }
      ]
    }
  ]
}
```

#### 스키마 필드 상세 설명

##### 1. policies.id 생성 규칙

**형식**: `POL-{CATEGORY_CODE}-{SEQUENTIAL}`

**카테고리 코드 (3-4자)**:
- `AUTH`: 인증/권한
- `VAL`: 입력 검증
- `DATA`: 데이터 처리
- `ERR`: 에러 처리
- `SEC`: 보안
- `BIZ`: 비즈니스 로직
- `UI`: UI/UX 정책

**연번**: 카테고리별 001부터 시작

**예시**:
- `POL-AUTH-001`: 첫 번째 인증 정책
- `POL-AUTH-002`: 두 번째 인증 정책
- `POL-VAL-001`: 첫 번째 검증 정책

##### 2. screens.elements.action 구조

**type** (필수):
- `navigate`: 다른 화면으로 이동
- `submit`: 폼 제출 (API 호출)
- `trigger`: 상태 변경 또는 이벤트 발생
- `external`: 외부 링크 이동

**target** (필수):
- type이 `navigate`일 때: 화면 ID (예: `SCR-002`)
- type이 `submit`일 때: API ID (예: `API-001`)
- type이 `trigger`일 때: 이벤트명 (예: `modal_open`)
- type이 `external`일 때: 외부 URL (예: `https://example.com`)

**params** (선택):
- 추가 매개변수 객체

**trigger** (필수):
- `click`: 클릭 이벤트
- `submit`: 폼 제출 이벤트
- `change`: 값 변경 이벤트
- `focus`: 포커스 이벤트

##### 3. flows.steps.condition 구조

**type** (필수):
- `always`: 항상 실행 (조건 없음)
- `policy_check`: 정책 기반 조건
- `user_state`: 사용자 상태 기반 (로그인 여부 등)
- `data_validation`: 데이터 유효성 검증

**expression** (선택):
- JavaScript 표현식 (예: `user.isAuthenticated === true`)
- type이 `always`일 때는 `null`

**policy_ref** (선택):
- 참조하는 정책 ID (예: `POL-AUTH-001`)
- type이 `policy_check`일 때 필수

##### 4. apis 섹션 (신규 추가)

**목적**: 로컬 소스 코드 분석 시 API 엔드포인트 정보 저장

**id**: `API-{SEQUENTIAL}` 형식

**사용 시나리오**:
- `--source-dir` 옵션 제공 시 input-analyzer가 소스 코드에서 API 추출
- screen-generator가 화면-API 연결 관계 표시
- policy-generator가 API 관련 정책 생성

---

## 부록 C: 구현 체크리스트

### 1단계: 기반 설정

- [x] Chrome DevTools MCP 설정 및 테스트 ✅ (2025-12-27 완료)
  - POC 테스트 완료, 검증 보고서: `chrome-devtools-mcp-verification.md`
- [ ] 프로젝트 디렉토리 구조 생성
  ```
  .claude/
  ├─ skills/auto-draft/
  └─ agents/auto-draft-orchestrator/
  ```
- [x] auto-draft-guideline.md 검토 (이미 완료)
- [x] Phase 1 크롤링 전략 개선 ✅ (2025-12-27 완료)
  - Tier 2A/2B/2C 전략 설계 및 문서화
  - `phase1-improvement-proposal.md` 작성

### 2단계: Skill 구현

- [ ] `/auto-draft` Skill 구현 (`.claude/skills/auto-draft/skill.md`)
  - [ ] CLI 인터페이스
  - [ ] 인자 검증 및 파싱
  - [ ] Main Agent 호출 로직

### 3단계: Main Agent 구현

- [ ] `auto-draft-orchestrator` Agent 프롬프트 작성
  - [ ] Phase 1-4 워크플로우 제어
  - [ ] 에러 핸들링 전략 구현
  - [ ] 서브 에이전트 호출 로직
  - [ ] 재시도 전략 구현

### 4단계: 서브 에이전트 프롬프트 작성

- [ ] input-analyzer 프롬프트
- [ ] policy-generator 프롬프트
- [ ] glossary-generator 프롬프트
- [ ] screen-generator 프롬프트
- [ ] process-generator 프롬프트
- [ ] quality-validator 프롬프트

### 5단계: Phase 1 구현 및 검증

**5.1 Tier 1 (DOM 링크)**:
- [ ] `<a href>` 링크 추출
- [ ] sitemap.xml 파싱
- [ ] URL 정규화 함수 구현
- [ ] 우선순위 계산 함수 구현

**5.2 Tier 2A (소스코드 분석)**:
- [ ] Next.js App Router 경로 추출
- [ ] Next.js Pages Router 경로 추출
- [ ] React Router 파싱 구현
- [ ] Vue Router 파싱 구현

**5.3 Tier 2B (번들 분석)** ⭐ **우선순위 높음**:
- [ ] JavaScript 번들 다운로드 로직
- [ ] 정규식 경로 패턴 추출 구현
- [ ] Next.js 라우트 매니페스트 파싱
- [ ] React Router path 속성 추출
- [ ] 필터링 로직 (API, 정적 리소스 제외)

**5.4 Tier 2C (자동 탐색)** - 선택적:
- [ ] History API 모니터링 구현
- [ ] 안전한 클릭 요소 추출
- [ ] 위험 키워드 필터링
- [ ] DOM 변화 감지 로직
- [ ] 페이지 시그니처 생성

**5.5 Record 모드** ⭐ **우선순위 높음** (State 기반 SPA 대응):
- [ ] CLI `--record` 옵션 파싱
- [ ] Chrome 열기 + Record UI 주입
- [ ] 캡처 버튼 이벤트 처리
- [ ] 스크린샷 자동 저장
- [ ] DOM 상태 캡처
- [ ] 소스코드에서 화면 목록 추론 (`infer_screens_from_source`)
- [ ] crawling-result.json 생성 (record 모드)
- [ ] 검증 로직 (빠뜨린 화면 경고)

**5.6 통합 및 BFS**:
- [ ] `phase1_intelligent_crawling()` 통합 함수 구현
- [ ] Record 모드 분기 처리
- [ ] Tier 순차 적용 + 충분성 검사 로직
- [ ] BFS 크롤링 알고리즘 구현
- [ ] 스크린샷 캡처 로직
- [ ] `crawling-result.json` 생성

**구현 우선순위**:
1. **Record 모드 (MVP)** - State 기반 SPA 필수 대응
2. Tier 2B (번들 분석) - URL 라우팅 SPA용
3. Tier 1 + BFS - 기본 크롤링
4. Tier 2A (소스코드) - 소스 제공 시 정확도 향상
5. Tier 2C (자동 탐색) - 선택적, 시간 여유 시

### 6단계: 별도 스킬 및 유틸리티

- [ ] ppt-generator 스킬 구현 (Python + python-pptx)
- [ ] 회사 PPT 템플릿 준비
- [ ] 프로젝트명 자동 추론 로직

### 선택 구현 항목

- [ ] 웹 UI (React + Express)
- [ ] 버전 관리 기능

---

## 부록 D: 데이터 흐름 검증 체크리스트

**목적**: Phase 간 데이터 전달의 무결성을 보장하고, 구현 시 버그를 최소화

### Phase 1 → Phase 2

**출력 파일**: `outputs/{projectName}/analysis/crawling-result.json`

**검증 항목**:
- [ ] 파일이 존재하고 읽기 가능
- [ ] Valid JSON 형식
- [ ] `metadata` 객체 존재
- [ ] `metadata.mode` 필드 = "auto" 또는 "record"
- [ ] `pages` 배열 존재 (최소 1개 요소)
- [ ] 각 `page` 객체의 필수 필드:
  - [ ] `url` (string)
  - [ ] `screenshot` (파일 경로)
  - [ ] `dom` (객체)
- [ ] **mode="record"인 경우**:
  - [ ] 각 `page`에 `screen_name` 필드 존재
  - [ ] `discoveredBy` = "user_interaction"
- [ ] **mode="auto"인 경우**:
  - [ ] `links` 배열 존재
  - [ ] `discoveredBy` = "tier1" | "tier2a" | "tier2b" | "tier2c" | "manual"

**실패 시 영향**: Phase 2 (input-analyzer) 전체 실패 → 워크플로우 중단

---

### Phase 2 → Phase 3-1

**출력 파일**: `outputs/{projectName}/analysis/analyzed-structure.json`

**검증 항목**:
- [ ] 파일이 존재하고 읽기 가능
- [ ] Valid JSON 형식
- [ ] `project` 객체 존재
  - [ ] `project.name` 설정됨 (not empty)
  - [ ] `project.version` 설정됨
- [ ] `screens` 배열 존재 (최소 1개)
  - [ ] 각 screen의 `id` 형식: `SCR-{SEQ}` (예: SCR-001)
  - [ ] 각 screen의 `name` 필드 존재
  - [ ] 각 screen의 `url` 필드 존재
- [ ] `policies` 배열 존재 (빈 배열 허용)
  - [ ] 각 policy의 `id` 형식: `POL-{CAT}-{SEQ}` (예: POL-AUTH-001)
  - [ ] 각 policy의 `category` = AUTH | VAL | DATA | ERR | SEC | BIZ | UI
- [ ] `glossary` 배열 존재 (빈 배열 허용)
- [ ] `flows` 배열 존재 (빈 배열 허용)
- [ ] `apis` 배열 존재 (빈 배열 허용, 소스코드 제공 시만)

**실패 시 영향**: Phase 3-1 전체 실패 → 워크플로우 중단

---

### Phase 3-1 → Phase 3-2

**출력 파일**:
- `outputs/{projectName}/sections/06-policy-definition.md`
- `outputs/{projectName}/sections/05-glossary.md`

**검증 항목 (policy-definition.md)**:
- [ ] 파일이 존재하고 읽기 가능
- [ ] Valid Markdown 형식
- [ ] 최소 1개 정책 ID 존재 또는 "정책 없음" 명시
- [ ] 모든 정책 ID가 `POL-{CAT}-{SEQ}` 형식
- [ ] 정책 ID 중복 없음
- [ ] 카테고리별 순차 번호 (POL-AUTH-001, 002, 003...)

**검증 항목 (glossary.md)**:
- [ ] 파일이 존재하고 읽기 가능
- [ ] Valid Markdown 형식
- [ ] 용어가 알파벳/가나다순 정렬

**실패 시 영향**: Phase 3-2 일부 실패 (screen/process generator가 정책 ID 참조 불가)

---

### Phase 3-2 → Phase 3.5

**출력 파일**:
- `outputs/{projectName}/sections/08-screen-definition.md`
- `outputs/{projectName}/sections/07-process-flow.md`

**검증 항목 (screen-definition.md)**:
- [ ] 파일이 존재하고 읽기 가능
- [ ] Valid Markdown 형식
- [ ] 최소 1개 화면 정의 존재
- [ ] 모든 화면 ID가 `SCR-{SEQ}` 형식
- [ ] 화면 ID가 analyzed-structure.json의 screens와 일치
- [ ] **정책 ID 참조가 policy-definition.md에 존재**:
  - 예: "관련 정책: POL-AUTH-001" → policy-definition.md에 POL-AUTH-001 존재 확인
- [ ] 스크린샷 파일 경로가 유효 (파일 존재)

**검증 항목 (process-flow.md)**:
- [ ] 파일이 존재하고 읽기 가능
- [ ] Valid Markdown 형식
- [ ] **화면 ID 참조가 screen-definition.md에 존재**:
  - 예: "SCR-001 → SCR-002" → 두 ID 모두 screen-definition.md에 존재
- [ ] **정책 ID 참조가 policy-definition.md에 존재**:
  - 예: "조건: POL-AUTH-001" → policy-definition.md에 존재

**실패 시 영향**: Phase 3.5 검증 FAIL (하지만 Phase 4 계속 진행)

---

### Phase 3.5 → Phase 4

**출력 파일**: `outputs/{projectName}/validation/validation-report.md`

**검증 항목**:
- [ ] 파일이 존재하고 읽기 가능
- [ ] PASS/FAIL 상태 명시됨
- [ ] FAIL인 경우: 에러 목록, 누락 항목, 권장사항 포함
- [ ] PASS인 경우: 검증 통과 섹션 목록

**특이사항**:
- validation-report.md가 FAIL이어도 Phase 4는 계속 진행
- FAIL 내용이 PPT 마지막 슬라이드에 포함됨

**실패 시 영향**: Phase 4 계속 진행 (경고와 함께)

---

### 검증 자동화 제안 (향후)

```bash
#!/bin/bash
# validate-data-flow.sh

echo "Validating Phase 1 → 2..."
test -f outputs/$PROJECT/analysis/crawling-result.json || exit 1
jq -e '.metadata.mode' outputs/$PROJECT/analysis/crawling-result.json || exit 1

echo "Validating Phase 2 → 3-1..."
test -f outputs/$PROJECT/analysis/analyzed-structure.json || exit 1
jq -e '.screens | length > 0' outputs/$PROJECT/analysis/analyzed-structure.json || exit 1

echo "Validating Phase 3-1 → 3-2..."
test -f outputs/$PROJECT/sections/06-policy-definition.md || exit 1

echo "Validating Phase 3-2 → 3.5..."
test -f outputs/$PROJECT/sections/08-screen-definition.md || exit 1
test -f outputs/$PROJECT/sections/07-process-flow.md || exit 1

echo "✅ All data flow checks passed!"
```

---

### 사용 방법 (구현 시)

1. **Main Agent 프롬프트에 포함**:
   - 각 Phase 완료 후 이 체크리스트 실행
   - 실패 시 재시도 또는 부분 성공 처리

2. **Sub-Agent 프롬프트에 포함**:
   - 각 Agent의 "Quality Criteria" 섹션에 해당 Phase 검증 항목 반영

3. **quality-validator Agent**:
   - Phase 3.5에서 이 체크리스트 전체를 실행하여 검증

---

## 부록 E: 엣지 케이스 및 대응 방안

**목적**: "무엇이 잘못될 수 있는가?"에 대한 체계적 분석 및 대응 전략

### 카테고리 1: 입력 데이터 이슈

#### EC-001: URL은 있지만 접속 불가 (404/500)

**발생 조건**:
- 로컬 서버 중단 (localhost:3000 not running)
- 배포 사이트 다운 (Vercel/Netlify 장애)
- 네트워크 타임아웃

**영향**: Phase 1 전체 실패

**대응** (service-design.md Lines 1351-1355):
1. 3회 재시도 (5초 간격)
2. 실패 시: `--screenshots` 옵션 확인
3. 스크린샷이 제공되면 URL 없이 진행
4. 둘 다 없으면 **중단** + 사용자 안내

**우선순위**: P0 (CRITICAL)

---

#### EC-002: PRD는 있지만 JSON parse 실패

**발생 조건**:
- PRD가 순수 Markdown 형식 (구조화 안 됨)
- YAML frontmatter만 있음
- 특수 문자로 인한 파싱 에러

**영향**: 정책 추출 실패 (일부)

**대응**:
1. JSON 파싱 실패 감지
2. Markdown 텍스트로 fallback
3. 정규식으로 정책 문장 추출 시도
4. 실패 시 경고 로그 + 계속 진행 (화면 정보만으로 생성)

**우선순위**: P2 (LOW)

**로그 예시**:
```
WARN: Failed to parse PRD as JSON, falling back to text extraction
INFO: Extracted 3 policies from PRD text
```

---

#### EC-003: 소스코드 제공했지만 경로 구조 인식 불가

**발생 조건**:
- Next.js/React가 아닌 프레임워크 (Vue 3, Svelte)
- Custom routing 구조
- 비표준 디렉토리 명 (routes → routers → routing)

**영향**: Tier 2A 실패 → 경로 추출 0개

**대응** (service-design.md Lines 1646-1656):
1. Tier 2A 실패 감지
2. Tier 2B (번들 분석)로 자동 fallback
3. 경고 로그: "Source code structure not recognized, trying bundle analysis"
4. 계속 진행

**우선순위**: P1 (HIGH)

---

### 카테고리 2: 크롤링 이슈

#### EC-004: SPA이지만 모든 Tier 실패 (0 pages)

**발생 조건**:
- Canvas 기반 인터랙션 + Hash 아님
- 소스코드 미제공 (`--source-dir` 없음)
- JavaScript 번들 난독화

**영향**: 0 pages 발견 → 루트만 크롤링

**대응** (service-design.md Lines 1362-1376):
1. 발견된 페이지 < 3개 감지
2. 사용자 안내 메시지 표시:
   ```
   ⚠️ 자동 크롤링으로 충분한 페이지를 발견하지 못했습니다.
   발견된 페이지: 1개

   다음 방법 중 하나를 선택하세요:
   1. Record 모드 사용 (권장): /auto-draft --url {url} --record
   2. 수동 URL 목록 제공: /auto-draft --url {url} --urls urls.txt
   3. 소스코드 제공: /auto-draft --url {url} --source-dir ./source
   ```
3. `--record` 또는 `--urls` 또는 `--source-dir` 없으면 → **중단**
4. 위 옵션 하나라도 있으면 → 계속 진행

**우선순위**: P0 (CRITICAL)

---

#### EC-005: 50페이지 제한 초과 (대규모 사이트)

**발생 조건**:
- E-commerce 사이트 (수백 개 상품 페이지)
- 블로그 (수백 개 포스트)
- 문서 사이트 (수백 개 페이지)

**영향**: 일부 페이지 누락 (우선순위 낮은 페이지)

**대응** (service-design.md 부록 A, 우선순위 계산):
1. 모든 발견된 URL에 우선순위 점수 부여:
   ```typescript
   score = 100;
   score -= depth * 15;            // 깊이 페널티
   score += isInMainNav ? 50 : 0;  // 네비게이션 보너스
   score += !hasQueryParams ? 30 : 0;  // 정적 경로 보너스
   score -= isDynamic ? 40 : 0;    // 동적 라우팅 페널티
   ```
2. 점수 기준 정렬
3. 상위 50개만 크롤링
4. 로그에 누락된 페이지 수 기록:
   ```
   INFO: Discovered 150 URLs, crawling top 50 by priority
   WARN: 100 URLs skipped due to maxPages limit
   ```

**우선순위**: P1 (HIGH)

**사용자 대응**:
- `--max-pages 100` 옵션으로 제한 증가 가능

---

#### EC-006: 동일 화면이 여러 URL (중복)

**발생 조건**:
- `/`, `/home`, `/index` 모두 같은 화면
- 쿼리 파라미터만 다름: `/page?id=1`, `/page?id=2`

**영향**: 중복 화면 정의 → 불필요한 섹션

**대응**:
1. **URL 정규화** (부록 A):
   - 트레일링 슬래시 제거: `/home/` → `/home`
   - 쿼리 파라미터 제거: `/page?id=1` → `/page`
   - 프로토콜 통일: `http://` → `https://`

2. **DOM 유사도 비교** (선택, 향후):
   - 동일 URL이지만 다른 DOM → 별도 화면
   - 다른 URL이지만 동일 DOM → 중복 제거

**우선순위**: P3 (LOW, 정규화로 대부분 해결됨)

---

### 카테고리 3: 에이전트 실행 이슈

#### EC-007: input-analyzer 타임아웃 (10분 초과)

**발생 조건**:
- 소스코드 매우 큼 (10,000+ files)
- 크롤링 결과 매우 큼 (200+ pages)
- 시스템 리소스 부족

**영향**: Phase 2 실패 → **전체 워크플로우 중단**

**대응** (service-design.md Lines 1376-1386):
1. 타임아웃 감지 (10분)
2. 첫 재시도: 소스코드 분석 스킵 후 재실행
   ```
   WARN: input-analyzer timeout, retrying without source code analysis
   ```
3. 두 번째 재시도: 크롤링 결과 일부만 사용 (상위 50개 페이지)
4. 세 번째 재시도 실패 → **전체 중단** + 사용자 안내

**우선순위**: P0 (CRITICAL)

**로그 예시**:
```
ERROR: input-analyzer timeout (10 minutes)
INFO: Retry 1/3: Skipping source code analysis
INFO: Retry 2/3: Processing only top 50 pages
ERROR: Retry 3/3 failed, aborting workflow
```

---

#### EC-008: policy-generator가 0개 정책 생성

**발생 조건**:
- 단순한 정적 사이트 (블로그, 포트폴리오)
- PRD/SDD 미제공
- analyzed-structure.json의 `policies` 배열 = []

**영향**: screen-generator가 참조할 정책 없음

**대응** (service-design.md Lines 1393-1398):
1. policy-generator가 빈 정책 섹션 생성:
   ```markdown
   # 6. 정책 (Policy Definition)

   자동 생성된 정책이 없습니다. 수동으로 정책을 추가하세요.
   ```
2. screen-generator는 정책 참조 없이 화면만 정의
3. 로그: "No policies generated, screens will not reference policies"
4. **계속 진행** (PARTIAL SUCCESS)

**우선순위**: P2 (LOW)

---

#### EC-009: quality-validator가 100개 에러 발견

**발생 조건**:
- ID 참조 오류 대량 발생 (정책 ID 참조 실패)
- ID 중복 다수
- 순차성 오류 (POL-AUTH-001, 003, 005 → 002, 004 누락)

**영향**: validation FAIL

**대응** (service-design.md Lines 1266-1271):
1. validation-report.md 생성 (FAIL 상태)
2. **Phase 4 계속 진행** (경고와 함께)
3. PPT 마지막 슬라이드에 validation-report 내용 포함
4. 사용자에게 수정 후 재생성 권장

**우선순위**: P2 (LOW, 사후 수정 가능)

**로그 예시**:
```
WARN: Quality validation FAIL (100 errors detected)
INFO: Continuing to Phase 4 with warnings
INFO: Validation report will be included in final PPT
```

---

### 카테고리 4: ID 참조 이슈

#### EC-010: 화면에서 존재하지 않는 정책 참조 (POL-999)

**발생 조건**:
- screen-generator 버그
- policy-definition.md 생성 후 수동 삭제
- ID 번호 불일치

**영향**: 참조 무결성 실패 → quality-validator FAIL

**대응**:
1. quality-validator가 감지 (참조 무결성 검증)
2. validation-report.md에 기록:
   ```markdown
   ## ❌ 참조 무결성 오류

   - screen-definition.md에서 POL-999 참조
   - policy-definition.md에 POL-999 존재하지 않음

   **권장 조치**: policy-definition.md에 POL-999 추가 또는 참조 제거
   ```
3. Phase 4 계속 진행
4. 사용자 수정 필요

**우선순위**: P3 (LOW, 사후 수정)

---

#### EC-011: 정책 ID 중복 (POL-AUTH-001 2개)

**발생 조건**:
- policy-generator 버그
- 수동 수정 시 복사-붙여넣기 실수

**영향**: 참조 모호성 → quality-validator FAIL

**대응**:
1. quality-validator가 감지 (중복 검증)
2. validation-report.md에 기록:
   ```markdown
   ## ❌ ID 중복 오류

   - POL-AUTH-001이 2번 정의됨

   **권장 조치**: 중복 제거 또는 재생성
   ```
3. Phase 4 계속 진행
4. **재생성 권장** (policy-generator 다시 실행)

**우선순위**: P3 (LOW)

---

### 카테고리 5: Record 모드 이슈

#### EC-012: Record 모드에서 0개 화면 캡처 후 완료

**발생 조건**:
- 사용자 실수 (캡처 안 하고 "완료" 클릭)
- 브라우저 즉시 크래시

**영향**: analyzed-structure.json의 `screens` = []

**대응** (record-mode-design.md Lines 502-546):
1. 최소 1개 화면 검증:
   ```python
   if len(captured_screens) == 0:
       raise RecordModeError("최소 1개 화면이 필요합니다.")
   ```
2. 에러 메시지 표시 + 재시작 요청

**우선순위**: P1 (HIGH)

---

#### EC-013: 복구 파일 손상 (.record-recovery.json)

**발생 조건**:
- 파일 시스템 에러 (디스크 풀)
- 수동 편집 후 JSON 깨짐
- 권한 문제

**영향**: 복구 실패

**대응** (record-mode-design.md Lines 432-487):
1. 복구 파일 JSON 파싱 시도
2. 파싱 실패 감지:
   ```python
   try:
       previous_session = json.load(recovery_file)
   except json.JSONDecodeError:
       print("⚠️ 복구 파일 손상됨, 처음부터 시작합니다")
       os.remove(recovery_file)
       previous_session = None
   ```
3. 경고 표시 + 처음부터 다시 시작

**우선순위**: P2 (MODERATE)

---

#### EC-014: --output 없이 Record 모드 실행

**발생 조건**:
- 사용자가 권장사항 무시
- 튜토리얼 미숙지

**영향**: `mvp-<timestamp>` 프로젝트명 → 복구 불가

**대응** (service-design.md Lines 1923-1926):
1. Record 모드 시작 시 경고 표시:
   ```
   ⚠️ 경고: --output 옵션이 제공되지 않았습니다.
   프로젝트명이 'mvp-20251227-143015'로 설정됩니다.

   복구 기능을 사용하려면 --output 옵션을 사용하세요:
   /auto-draft --url {url} --record --output my-project

   계속하시겠습니까? (y/n)
   ```
2. 사용자 확인 대기
3. 'y' → 계속 진행 (복구 불가 상태)
4. 'n' → 중단

**우선순위**: P2 (MODERATE)

---

### 대응 우선순위 Summary

| 우선순위 | 엣지 케이스 | 대응 방법 | 사용자 영향 |
|---------|-----------|----------|-----------|
| **P0 (CRITICAL)** | EC-001, EC-004, EC-007 | 즉시 중단, 명확한 안내 | 워크플로우 차단 |
| **P1 (HIGH)** | EC-003, EC-005, EC-012 | Fallback, 부분 성공 | 기능 제한 |
| **P2 (MODERATE)** | EC-002, EC-008, EC-009, EC-013, EC-014 | 경고, 계속 진행 | 품질 저하 |
| **P3 (LOW)** | EC-006, EC-010, EC-011 | 사후 검증, 권장사항 | 사후 수정 가능 |

---

### 테스트 시나리오 (구현 후)

각 엣지 케이스에 대한 테스트 케이스:

```bash
# EC-001: URL 접속 불가
/auto-draft --url http://localhost:9999  # 존재하지 않는 포트

# EC-004: 0 pages 발견
/auto-draft --url https://canvas-only-app.com  # Canvas 기반

# EC-007: input-analyzer 타임아웃
/auto-draft --url {url} --source-dir /huge/monorepo  # 10,000+ files

# EC-012: Record 모드 0개 캡처
/auto-draft --url {url} --record
# → 캡처 안 하고 즉시 "완료" 클릭

# EC-014: --output 없이 Record 모드
/auto-draft --url {url} --record  # --output 없음
```

---

**문서 종료**
