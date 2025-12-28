# Draftify 시스템 아키텍처

**버전**: 1.0
**최종 갱신**: 2025-12-27
**원본 출처**: service-design.md Section 2

---

## 목차

1. [전체 구조](#21-전체-구조)
2. [구성요소 간 관계](#22-구성요소-간-관계)

---

## 2.1 전체 구조

Draftify는 **4계층 아키텍처**로 설계되었습니다:

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

---

## 2.2 구성요소 간 관계

### 사용자 계층 → 스킬 계층

**CLI 방식**:
```bash
/auto-draft <URL> [옵션들]
```
- 명령어 파싱 및 검증
- Skill로 전달

**웹 UI 방식** (선택):
- HTTP POST로 파일 업로드
- 설정 JSON 전송
- 로컬 서버에서 처리

---

### 스킬 계층 → 오케스트레이션 계층

**/auto-draft Skill → Main Agent**:

1. **인자 검증 및 파싱**:
   - URL, 옵션, 파일 경로 검증
   - 기본값 설정

2. **Task tool 호출**:
   ```typescript
   await Task({
     subagent_type: "general-purpose",
     description: "Execute auto-draft workflow",
     prompt: "You are the auto-draft-orchestrator agent...",
     timeout: 1800000  // 30분
   })
   ```

3. **독립 컨텍스트 실행**:
   - Main Agent는 독립된 컨텍스트에서 실행
   - 메인 세션 컨텍스트와 분리
   - 30분 타임아웃

---

### 오케스트레이션 계층 → 실행 계층

Main Agent는 3가지 유형의 실행 계층 컴포넌트를 호출합니다:

#### 1. Main Agent → MCP 서버

**Chrome DevTools MCP** (Phase 1):
- 페이지 네비게이션
- DOM 분석
- 스크린샷 캡처
- JavaScript 실행

**사용 예시**:
```bash
# Bash tool로 MCP 명령 실행
await chromeDevTools.navigate_page(url)
await chromeDevTools.take_screenshot()
```

---

#### 2. Main Agent → 서브 에이전트

**Task tool로 순차/병렬 실행**:

| Phase | 에이전트 | 실행 방식 | 의존성 |
|-------|---------|---------|--------|
| **Phase 2** | input-analyzer | 순차 (단일) | Phase 1 완료 필수 |
| **Phase 3-1** | policy-generator, glossary-generator | 순차 (2개) | Phase 2 완료 필수 |
| **Phase 3-2** | screen-generator, process-generator | **병렬** (2개) | Phase 3-1 완료 필수 |
| **Phase 3.5** | quality-validator | 순차 (단일) | Phase 3-2 완료 필수 |

**병렬 실행 예시** (Phase 3-2):
```typescript
// 단일 메시지에서 2개 Task tool 호출
const [screenResult, processResult] = await Promise.all([
  Task({
    subagent_type: "general-purpose",
    prompt: "Generate screen definitions...",
  }),
  Task({
    subagent_type: "general-purpose",
    prompt: "Generate process flows...",
  })
])
```

---

#### 3. Main Agent → 스킬

**ppt-generator 스킬** (Phase 4):
- 별도 독립 스킬
- 마크다운 섹션 → PPT 변환
- Main Agent가 호출

---

### 실행 계층 → 데이터 계층

각 실행 계층 컴포넌트는 독립적으로 데이터를 저장합니다:

#### MCP (Phase 1)
- **저장 경로**: `outputs/<project>/screenshots/`
- **저장 항목**: screen-001.png, screen-002.png...
- **중간 파일**: `analysis/crawling-result.json`

#### 서브 에이전트 (Phase 2-3)
- **Write tool 사용**: 중간 산출물 저장
- **저장 경로**: `outputs/<project>/sections/`
- **파일 예시**:
  - `analysis/analyzed-structure.json` (Phase 2)
  - `sections/06-policy-definition.md` (Phase 3-1)
  - `sections/08-screen-definition.md` (Phase 3-2)

#### PPT 스킬 (Phase 4)
- **저장 경로**: `outputs/<project>/`
- **최종 산출물**: `final-draft.pptx`

---

## 계층별 책임 분리

| 계층 | 책임 | 도구 | 컨텍스트 |
|------|------|------|---------|
| **사용자 계층** | UI 제공 | CLI, 웹 브라우저 | 사용자 세션 |
| **스킬 계층** | 인자 검증, Main Agent 호출 | Task tool | 메인 컨텍스트 (짧음) |
| **오케스트레이션 계층** | Phase 제어, 에러 핸들링 | Task, Bash, Read/Write | 독립 컨텍스트 (30분) |
| **실행 계층** | 실제 작업 수행 | MCP, Read/Write/Grep/Glob | 독립 컨텍스트 (각각) |
| **데이터 계층** | 파일 저장소 | 파일 시스템 | 없음 (영속성) |

---

## 설계 근거

### 왜 Skill + Main Agent 분리?

**문제** (Skill 단독):
- 크롤링 결과가 메인 컨텍스트에 로드 (50페이지 → 수만 토큰)
- 컨텍스트 폭발 → 토큰 한계 초과
- 에러 복구 어려움

**해결** (Skill + Main Agent):
- ✅ Skill: 100줄 미만 (인자 검증만)
- ✅ Main Agent: 독립 컨텍스트 (30분, 크롤링 데이터 포함)
- ✅ 메인 세션 컨텍스트 보호
- ✅ 재시도 및 복구 가능

---

### 왜 서브 에이전트 독립 실행?

**장점**:
1. **병렬화**: Phase 3-2 에이전트 동시 실행 (2배 속도)
2. **재시도**: 개별 에이전트만 재실행 (전체 재시작 불필요)
3. **투명성**: 각 에이전트 로그 독립 추적
4. **확장성**: 새 에이전트 추가 용이

---

## 다음 단계

- **Phase별 데이터 흐름**: [workflow.md](./workflow.md)
- **에러 핸들링 전략**: [error-handling.md](./error-handling.md)
- **에이전트 상세 정의**: [agents/](./agents/)
