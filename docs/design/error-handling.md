# Draftify 에러 핸들링 및 워크플로우 제어

**버전**: 1.1
**최종 갱신**: 2025-12-28

> **Note**: 이 문서는 에러 핸들링의 완전한 명세입니다.

---

## 목차

1. [Skill 계층: /auto-draft](#71-skill-계층-auto-draft)
2. [오케스트레이션 계층: auto-draft-orchestrator](#72-오케스트레이션-계층-auto-draft-orchestrator-main-agent)
3. [재시도 전략](#73-재시도-전략)
4. [Phase별 에러 핸들링](#74-phase별-에러-핸들링)
5. [최소 성공 기준](#75-최소-성공-기준)
6. [타임아웃 설정](#76-타임아웃-설정)

---

## 7.1 Skill 계층: /auto-draft

`/auto-draft` Skill은 사용자 인터페이스 역할을 하며, Main Agent를 호출합니다.

### Skill 책임

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

Read your full prompt from docs/design/agents/orchestrator.md and execute the workflow.

**Input Configuration**:
${JSON.stringify(config, null, 2)}

**Your responsibilities**:
1. Execute Phase 1-4 sequentially
2. Call sub-agents as needed
3. Handle errors according to docs/design/error-handling.md
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

## 7.2 오케스트레이션 계층: auto-draft-orchestrator (Main Agent)

Main Agent는 독립 컨텍스트에서 실행되며, 전체 워크플로우를 제어합니다.

### 워크플로우 제어 (Main Agent 내부)

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

  // Phase 3-2: 후행 섹션 생성 (순차: screen → process)
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

### 서브 에이전트 실행 전략

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

**순차 실행 (Phase 3-2: screen → process)**:
```typescript
// screen-generator 먼저 실행
const screenResult = await Task({
  subagent_type: "general-purpose",
  prompt: "Generate screen definitions...",
  timeout: 300000, // 5분
});

// process-generator는 screen-definition.md 참조
const processResult = await Task({
  subagent_type: "general-purpose",
  prompt: "Generate process flows...",
  timeout: 300000, // 5분
});
```

> **Note**: process-generator는 screen-definition.md를 참조하므로 screen-generator 완료 후 실행

---

## 7.3 재시도 전략

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

## 7.4 Phase별 에러 핸들링

### Phase 1: 입력 수집

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

### Phase 2: 분석

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

### Phase 3-1: 선행 섹션 생성

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

### Phase 3-2: 후행 섹션 생성 (순차: screen → process)

**에러 처리**:
```markdown
- **screen-generator 실패**:
  - 3회 재시도
  - 실패 시: 빈 화면 섹션 생성, process-generator 계속 진행
  - process-generator는 analyzed-structure.json의 screens 배열 참조 (fallback 없음)

- **process-generator 실패**:
  - 2회 재시도
  - 실패 시: 빈 프로세스 섹션 생성

- **모두 실패**:
  - Phase 3-1 결과만으로 진행
  - 최소 구성: 정책 + 용어집만 포함된 기획서
```

### Phase 3.5: 검증

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

### Phase 4: 문서 생성

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

## 7.5 최소 성공 기준

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

## 7.6 타임아웃 설정

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

## 에러 핸들링 철학

Draftify의 에러 핸들링은 **부분 성공 허용 (Graceful Degradation)** 원칙을 따릅니다:

1. **필수 Phase (Phase 1-2)**: 실패 시 전체 중단
2. **선택 Phase (Phase 3-4)**: 부분 성공 허용
3. **재시도 전략**: 중요도에 따라 차등 적용
4. **사용자 피드백**: 실패 원인 및 복구 방법 제공
5. **최소 산출물 보장**: 최악의 경우에도 마크다운 섹션 제공

---

## 다음 단계

- **워크플로우 흐름**: [workflow.md](./workflow.md)
- **에이전트 프롬프트**: [agents/orchestrator.md](./agents/orchestrator.md)
- **엣지 케이스 대응**: [edge-cases.md](./edge-cases.md)
