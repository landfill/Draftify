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
7. [프로젝트 관리 전략](#7-프로젝트-관리-전략)
8. [확장성 고려사항](#8-확장성-고려사항)

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

**선택**:
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
│  └────────────┘              └────────────┘          │
└─────────────┬──────────────────────┬─────────────────┘
              │                      │
              └──────────┬───────────┘
                         ▼
┌──────────────────────────────────────────────────────┐
│               오케스트레이션 계층                      │
│  ┌──────────────────────────────────────────┐        │
│  │      메인 스킬: /auto-draft              │        │
│  │  - 워크플로우 제어                        │        │
│  │  - 에이전트 생명주기 관리                  │        │
│  │  - 에러 핸들링                            │        │
│  └──────────────────────────────────────────┘        │
└─────────────┬────────────────────────────────────────┘
              │
      ┌───────┴────────┬─────────────┬────────────┐
      ▼                ▼             ▼            ▼
┌──────────┐   ┌──────────┐   ┌──────────┐  ┌──────────┐
│ Phase 1  │   │ Phase 2  │   │ Phase 3  │  │ Phase 4  │
│ 입력수집  │   │   분석   │   │   생성   │  │ PPT변환  │
└──────────┘   └──────────┘   └──────────┘  └──────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────┐
│                  실행 계층                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ MCP 서버 │  │에이전트들│  │ 스킬들   │          │
│  │          │  │          │  │          │          │
│  │Chrome    │  │input-    │  │ppt-      │          │
│  │DevTools  │  │analyzer  │  │generator │          │
│  │          │  │          │  │          │          │
│  │Git       │  │policy-   │  │          │          │
│  │(선택)    │  │generator │  │          │          │
│  │          │  │          │  │          │          │
│  │          │  │screen-   │  │          │          │
│  │          │  │generator │  │          │          │
│  │          │  │          │  │          │          │
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

#### 사용자 계층 → 오케스트레이션 계층
- **CLI**: 명령행 인자로 URL, 파일 경로 전달
- **웹 UI**: HTTP POST로 파일 업로드 및 설정 전송

#### 오케스트레이션 계층 → 실행 계층
- **메인 스킬 → MCP**: 크롤링, DOM 분석 요청
- **메인 스킬 → 에이전트**: Task tool로 에이전트 실행 (순차/병렬)
- **메인 스킬 → 서브 스킬**: PPT 생성 스킬 호출

#### 실행 계층 → 데이터 계층
- **MCP/에이전트**: Write tool로 중간 산출물 저장
- **PPT 스킬**: Python 스크립트로 최종 PPT 생성

---

## 3. 에이전트 구조

### 3.1 에이전트 설계 원칙

1. **단일 책임**: 각 에이전트는 하나의 명확한 역할만 수행
2. **독립성**: 에이전트 간 직접 의존 없음 (메인 스킬이 중재)
3. **재시도 가능**: 실패 시 독립적으로 재실행 가능
4. **투명성**: 모든 에이전트는 중간 결과를 파일로 저장

### 3.2 에이전트 목록 및 역할

| 에이전트 ID | 역할 | 실행 시점 | 입력 | 출력 | 선후행 관계 |
|------------|------|----------|------|------|-----------|
| **input-analyzer** | 모든 입력(크롤링 결과 + 문서)을 분석하여 구조화된 데이터 생성 | Phase 2 | crawling-result.json, 문서들 | analyzed-structure.json | Phase 1 이후 |
| **policy-generator** | 정책정의서 섹션 생성 | Phase 3 | analyzed-structure.json | policy-definition.md | Phase 2 이후 |
| **screen-generator** | 화면정의서 섹션 생성 | Phase 3 | analyzed-structure.json, 스크린샷 | screen-definition.md | Phase 2 이후 |
| **process-generator** | 프로세스 흐름 섹션 생성 | Phase 3 | analyzed-structure.json | process-flow.md | Phase 2 이후 |
| **quality-validator** | 생성된 모든 섹션의 품질 및 일관성 검증 | Phase 3.5 | 모든 .md 파일, guideline | validation-report.md | Phase 3 이후 |

### 3.3 에이전트 상세 정의

#### input-analyzer

**책임**:
- 크롤링 결과에서 화면 목록 추출
- PRD/SDD에서 정책 및 기능 추출
- README/agent.md에서 컨벤션 추출
- 모든 정보를 통합하여 단일 JSON으로 구조화

**도구 사용**:
- Read (파일 읽기)
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
- auto-draft-guideline.md Section 6 기준 준수
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

**도구 사용**:
- Read (JSON, 스크린샷 경로)
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

**도구 사용**:
- Read (JSON)
- Write (마크다운)

**출력 구조**:
- 프로세스 흐름 다이어그램 (텍스트 표현)
- 주요 분기 조건
- 시작/종료 지점

**실행 전략**: 병렬

---

#### quality-validator

**책임**:
- 생성된 모든 섹션이 guideline 준수하는지 검증
- 화면 ID, 정책 ID 참조 일관성 체크
- 누락 항목 탐지

**도구 사용**:
- Read (모든 섹션 파일, guideline)
- Write (검증 보고서)

**출력**:
- PASS/FAIL 상태
- 누락 항목 목록
- 불일치 사항
- 권장 사항

**실행 전략**: 순차 (Phase 3 이후)

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
│ Phase 3: 섹션별 콘텐츠 생성 (병렬)   │
│                                     │
│ ┌─────────────────┐                │
│ │ policy-generator│ → policy.md    │
│ └─────────────────┘                │
│ ┌─────────────────┐                │
│ │screen-generator │ → screen.md    │
│ └─────────────────┘                │
│ ┌─────────────────┐                │
│ │process-generator│ → process.md   │
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
| **1. 입력 수집** | URL, 문서 파일들 | MCP 크롤링, 파일 읽기 | crawling-result.json, 문서 텍스트 |
| **2. 분석** | crawling-result.json, 문서 텍스트 | input-analyzer 에이전트 | analyzed-structure.json |
| **3. 생성** | analyzed-structure.json | 3개 에이전트 병렬 실행 | 9개 섹션.md |
| **3.5. 검증** | 9개 섹션.md, guideline | validator 에이전트 | validation-report.md |
| **4. PPT 변환** | 9개 섹션.md, 스크린샷 | ppt-generator 스킬 | final-draft.pptx |

### 4.3 데이터 의존성 그래프

```
URL ────┐
문서들 ──┼──> [Phase 1] ──> crawling-result.json ──┐
        │                                         │
        └─────────────────────────────────────────┴──> [Phase 2: input-analyzer]
                                                            │
                                                            │ analyzed-structure.json
                                                            │
                            ┌───────────────────────────────┼───────────────────────────────┐
                            │                               │                               │
                            ▼                               ▼                               ▼
                    [policy-generator]              [screen-generator]              [process-generator]
                            │                               │                               │
                            │                               │                               │
                            └───────────────────────────────┴───────────────────────────────┘
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

### 5.2 Git MCP (선택)

**선택 이유**:
- 브랜치 전략 문서가 없을 때 .git 히스토리에서 추론 가능
- 커밋 메시지 패턴 분석으로 기능 추출 가능

**사용 시나리오**:
- 입력 문서가 부족한 경우
- 코드 기반으로만 MVP가 작성된 경우

**대안**:
- 문서 기반으로만 분석 (Git 정보 무시)

---

### 5.3 Claude Agent (서브에이전트)

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

### 5.4 Python + python-pptx (PPT 생성)

**선택 이유**:
1. **프로그래밍 방식 PPT 생성**
   - 템플릿 기반 슬라이드 생성
   - 레이아웃 제어
   - 이미지/텍스트 자동 배치

2. **성숙한 라이브러리**
   - python-pptx는 안정적이고 문서화 잘 됨
   - .pptx (Office Open XML) 표준 지원

**대안 고려**:
- **Google Slides API**: 클라우드 의존성, 로컬 완결성 저해 → 기각
- **LibreOffice CLI**: 템플릿 제어 제한적 → 기각
- **HTML → PPT 변환**: 품질 낮음 → 기각

---

### 5.5 웹 UI (선택)

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
- `--agent-rules <path>`: agent.md 경로
- `--api-doc <path>`: API 문서 경로
- `--output <name>`: 프로젝트명 명시
- `--template <path>`: PPT 템플릿 경로
- `--max-depth <n>`: 크롤링 최대 깊이

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

## 7. 프로젝트 관리 전략

### 7.1 출력 디렉토리 구조

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

### 7.2 프로젝트명 결정 로직

**우선순위**:
1. CLI `--output` 옵션 (명시적 지정)
2. PRD 파일의 `project.name` 필드
3. README.md의 첫 번째 제목 (# ...)
4. URL의 `<title>` 태그
5. 기본값: `mvp-<timestamp>`

**예시**:
- `--output todo-app` → `outputs/todo-app/`
- PRD에 `project: { name: "Todo App" }` → `outputs/todo-app/`
- 기본값 → `outputs/mvp-20251226-143015/`

### 7.3 버전 관리 (선택)

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

## 8. 확장성 고려사항

### 8.1 향후 지원 계획

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

### 8.2 제약사항

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

**처리 흐름**:
1. 시작 URL 접속 (Chrome DevTools MCP)
2. 현재 페이지에서 링크 추출
   - `<a>` 태그 href
   - 버튼의 onClick 핸들러
   - SPA 라우팅 (React Router, Next.js 등)
3. 발견된 URL을 큐에 추가
4. 중복 방지 (visited Set)
5. 각 페이지마다:
   - DOM 구조 분석
   - UI 요소 추출 (button, input, form 등)
   - 스크린샷 캡처
6. 큐가 빌 때까지 반복
7. 제약 조건:
   - 최대 페이지 수: 50
   - 최대 깊이: 5
   - 타임아웃: 페이지당 30초

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

### Phase 3: 섹션별 콘텐츠 생성

**목표**: analyzed-structure.json을 기반으로 기획서 섹션 생성

**에이전트**: policy-generator, screen-generator, process-generator (병렬 실행)

**처리 흐름** (각 에이전트별):
1. analyzed-structure.json 읽기
2. auto-draft-guideline.md 해당 섹션 기준 확인
3. 섹션 콘텐츠 생성
4. 마크다운 파일로 저장

**산출물**:
- `sections/06-policy-definition.md`
- `sections/08-screen-definition.md`
- `sections/07-process-flow.md`
- 기타 표준 섹션들

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

### Phase 4: PPT 생성

**목표**: 섹션 마크다운들을 회사 템플릿 기반 PPT로 변환

**스킬**: ppt-generator

**처리 흐름**:
1. 회사 템플릿 로드
2. 각 섹션 마크다운 파싱
3. 섹션 타입별 레이아웃 선택
4. 텍스트 및 이미지 삽입
5. .pptx 파일 저장

**산출물**:
- `final-draft.pptx`

---

## 부록 B: 데이터 스키마

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
      "id": "POL-001",
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
          "action": "navigate_to_signup"
        }
      ],
      "related_policies": ["POL-001", "POL-003"]
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
          "condition": "없음",
          "next_screen": "SCR-002"
        }
      ]
    }
  ]
}
```

---

## 부록 C: 구현 체크리스트

### 핵심 구현 항목

- [ ] Chrome DevTools MCP 설정 및 테스트
- [ ] 자동 크롤링 알고리즘 (BFS) 구현
- [ ] input-analyzer 에이전트 프롬프트 작성
- [ ] policy/screen/process generator 에이전트 프롬프트 작성
- [ ] quality-validator 에이전트 프롬프트 작성
- [ ] ppt-generator 스킬 구현 (Python + python-pptx)
- [ ] 회사 PPT 템플릿 준비
- [ ] 프로젝트명 자동 추론 로직

### 선택 구현 항목

- [ ] 웹 UI (React + Express)
- [ ] Git MCP 연동
- [ ] 버전 관리 기능

---

**문서 종료**
