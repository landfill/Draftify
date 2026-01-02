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

