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

**문서 종료**
