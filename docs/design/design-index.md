# Draftify 설계 문서 인덱스

**버전**: 1.3
**최종 갱신**: 2025-12-29
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
- 5계층 아키텍처 (사용자 → 스킬 → 오케스트레이션 → 실행 → 데이터)
- 구성요소 간 관계 및 데이터 흐름

**언제 읽나**: 전체 시스템 구조를 이해할 때

---

### 2. [workflow.md](./workflow.md)
**내용**: Phase 1-4 데이터 흐름 (Section 4)
- Phase 1: 입력 수집 및 크롤링
- Phase 2: 통합 분석 (input-analyzer)
- Phase 3-1: 선행 섹션 생성 (정책, 용어) - **병렬 실행**
- Phase 3-2: 후행 섹션 생성 (화면 → 프로세스) - **순차 실행**
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

### 4. [auto-draft-guideline.md](./auto-draft-guideline.md)
**내용**: 출력 문서 표준 규격
- 10개 표준 섹션 정의 (표지, 변경 이력, 목차, 섹션 타이틀, 용어 정의, 정책 정의, 프로세스 흐름, 화면 정의, 참고 문헌, EOD)
- ID 명명 규칙 (POL-*, SCR-*, API-*)
- 섹션별 필수 항목 및 작성 기준
- 모든 generator 에이전트의 출력 형식 기준

**언제 읽나**: 출력 문서 형식을 이해하거나 generator 에이전트를 구현할 때

---

## 에이전트별 문서 (agents/)

각 에이전트의 프롬프트 및 상세 로직을 포함합니다.

### Main Agent
- **[orchestrator.md](./agents/orchestrator.md)**: auto-draft-orchestrator (Main Agent)
  - Phase 1-3.5 제어 (Phase 4는 /auto-draft 스킬 계층에서 실행)
  - 서브 에이전트 생명주기 관리
  - 에러 핸들링

### Skills
- **[.claude/skills/auto-draft/SKILL.md](../../.claude/skills/auto-draft/SKILL.md)**: /auto-draft 스킬
  - 사용자 인터페이스 (인자 검증)
  - orchestrator 호출 (Phase 1-3.5)
  - /draftify-ppt 호출 (Phase 4)

- **[.claude/skills/draftify-ppt/SKILL.md](../../.claude/skills/draftify-ppt/SKILL.md)**: /draftify-ppt 스킬
  - 마크다운 → PPT 변환
  - Phase 4 실행

### Sub-Agents (ordered)
1. **[front-matter-generator.md](./agents/front-matter-generator.md)**: Phase 3-0 front matter (01-04)
   - Cover / Revision History / TOC / Section Divider

2. **[back-matter-generator.md](./agents/back-matter-generator.md)**: Phase 3-0 back matter (09-10)
   - References (optional) / EOD

3. **[input-analyzer.md](./agents/input-analyzer.md)**: Phase 2 analysis
   - Consolidate crawl + docs
   - Generate analyzed-structure.json

4. **[policy-generator.md](./agents/policy-generator.md)**: Phase 3-1 policy generation
   - Assign policy IDs (POL-*)
   - Generate policy markdown

5. **[glossary-generator.md](./agents/glossary-generator.md)**: Phase 3-1 glossary generation
   - Sort terms
   - Generate glossary markdown

6. **[screen-generator.md](./agents/screen-generator.md)**: Phase 3-2 screen definitions
   - Assign screen IDs (SCR-*)
   - Embed screenshots
   - Reference policies

7. **[process-generator.md](./agents/process-generator.md)**: Phase 3-2 process flows
   - Define flow steps
   - Reference screens/policies

8. **[quality-validator.md](./agents/quality-validator.md)**: Phase 3.5 validation
   - Validate IDs and references
   - Detect duplicates/sequencing


---

## 구현 가이드 (Implementation Guides)

### 5. [design-system.md](./design-system.md)
**내용**: UI/UX 디자인 시스템
- 색상 팔레트 (Duolingo 스타일: 밝고 친절)
- 타이포그래피 스케일 (한글 최적화)
- UI 컴포넌트 (Button, Input, Progress, Alert, Card)
- i18n 가이드라인 (한글화 규칙, 번역 파일 구조)
- 화면별 디자인 레퍼런스 (`design-style/` 활용법)

**언제 읽나**: 웹 UI 구현 시, 디자인 시스템을 따라야 할 때

---

### 6. [user-flow.md](./user-flow.md)
**내용**: 사용자 흐름도
- Mermaid 다이어그램으로 시각화된 전체 흐름
- 시나리오별 단계 정의 (정상 흐름, SPA 크롤링 실패 등)
- 오류 흐름 (E1-E3: URL 유효성 실패, 크롤링 실패, PPT 생성 실패)
- 성공/실패 분기 정리

**언제 읽나**: 사용자 시나리오를 이해하거나 UI 흐름을 구현할 때

---

### 7. [coding-convention.md](./coding-convention.md)
**내용**: 코딩 컨벤션 및 AI 협업 가이드
- AI 소통 원칙 (프롬프트 엔지니어링 템플릿)
- 명명 규칙 (PascalCase, camelCase, kebab-case)
- TypeScript 작성 규칙
- Git 커밋 규칙
- i18n 코딩 규칙
- 보안 체크리스트

**언제 읽나**: 코드 작성 시, AI 협업 프롬프트 작성 시, 코드 리뷰 시

---

## 상세 기술 문서

### 8. [crawling-strategy.md](./crawling-strategy.md)
**내용**: Phase 1 크롤링 전략
- Tier 1-3 크롤링 전략
- Record mode (사용자가 직접 녹화)
- URL 정규화 및 우선순위

**언제 읽나**: Phase 1 크롤링 구현 시

---

### 9. [schemas.md](./schemas.md)
**내용**: 데이터 스키마 정의
- crawling-result.json 스키마
- analyzed-structure.json 스키마
- 섹션별 출력 형식

**언제 읽나**: 데이터 구조를 이해하거나 JSON 파일을 다룰 때

---

### 10. [implementation-checklist.md](./implementation-checklist.md)
**내용**: 구현 체크리스트
- 우선순위별 구현 순서
- 단계별 검증 방법

**언제 읽나**: 구현 계획 수립 시, 진행 상황 추적 시

---

### 11. [edge-cases.md](./edge-cases.md)
**내용**: 엣지 케이스 핸들링
- 14가지 엣지 케이스 시나리오
- 각 케이스별 대응 방법

**언제 읽나**: 예외 상황 처리 구현 시

---

### 12. [tech-stack.md](./tech-stack.md)
**내용**: 기술 스택 선택 및 근거
- Chrome DevTools MCP
- LLM 선택 (GLM/Gemini)
- 기술별 벤더 락인 리스크

**언제 읽나**: 기술 스택을 이해하거나 변경을 고려할 때

---

### 13. [config.md](./config.md)
**내용**: 설정 파일 명세
- Config schema
- 환경 변수

**언제 읽나**: 설정 파일을 다룰 때

---

### 14. [logging.md](./logging.md)
**내용**: 로깅 전략
- 로그 레벨 및 형식
- 디버깅 가이드

**언제 읽나**: 로깅을 구현하거나 디버깅 시

---

### 15. [project-management.md](./project-management.md)
**내용**: 프로젝트 관리
- 출력 디렉토리 구조
- 프로젝트 명명 규칙

**언제 읽나**: 프로젝트 구조를 이해하거나 파일 관리 시

---

### 16. [ui-design.md](./ui-design.md)
**내용**: 웹 UI 설계
- 화면 구성 (입력, 진행, 완료)
- 화면 전환 흐름
- UI 상태 표시

**언제 읽나**: 웹 UI 구현 시 (design-system.md와 함께 참고)

---

### 17. [record-mode-design.md](./record-mode-design.md)
**내용**: Record mode 설계
- 사용자가 브라우저에서 직접 페이지 녹화
- 크롤링 실패 시 대안

**언제 읽나**: Record mode 구현 시

---

## 레거시 문서

### [../archive/service-design.md](../archive/service-design.md)
**상태**: 아카이브됨
**내용**: 원본 모놀리식 설계 문서
**용도**: 참고용 (실제 구현은 위 분리된 문서들을 따름)

---

## 문서 읽기 가이드

### 🚀 빠른 시작 (Quick Start)
처음 프로젝트를 접하는 경우:
1. [architecture.md](./architecture.md) - 전체 구조 파악
2. [workflow.md](./workflow.md) - Phase별 흐름 이해
3. [auto-draft-guideline.md](./auto-draft-guideline.md) - 출력 형식 확인

### 💻 구현 시 (Implementation)
코드를 작성하는 경우:
1. [implementation-checklist.md](./implementation-checklist.md) - 우선순위 확인
2. [coding-convention.md](./coding-convention.md) - 코딩 규칙 준수
3. 해당 에이전트 문서 (agents/*.md) - 에이전트별 로직
4. [error-handling.md](./error-handling.md) - 에러 처리
5. [design-system.md](./design-system.md) - UI 구현 시

### 🐛 디버깅 시 (Debugging)
문제가 발생한 경우:
1. [logging.md](./logging.md) - 로그 확인 방법
2. [edge-cases.md](./edge-cases.md) - 엣지 케이스 확인
3. [error-handling.md](./error-handling.md) - 에러 복구 전략

---

**문서 끝**
