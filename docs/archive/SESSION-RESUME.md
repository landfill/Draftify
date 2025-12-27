# 🚀 Draftify 설계 밸류업 작업 - Option B

**작성일**: 2025-12-27
**현재 상태**: 88/100 (B+) → **목표**: 98/100 (A+)
**예상 소요 시간**: 9시간
**작업 모드**: 구현 없이 설계 문서 완성

---

## 📊 현재 상태 Summary

### 설계 품질 점수

| 항목 | 현재 | 목표 | Gap |
|------|------|------|-----|
| 시나리오 커버리지 | 88 | 95 | +7 |
| 데이터 흐름 일관성 | 85 | 95 | +10 |
| Agent 의존성 관리 | 95 | 95 | 0 ✅ |
| 에러 핸들링 완성도 | 90 | 95 | +5 |
| 구현 가능성 | 88 | 95 | +7 |
| 문서 일관성 | 88 | 95 | +7 |
| 엣지 케이스 대응 | 85 | 95 | +10 |
| **평균** | **88** | **95** | **+7** |

### ✅ 이미 완료된 작업 (지난 세션)

**P0 이슈 (구현 차단 요소) - 3개 완료**:
- ✅ P0-1: input-analyzer mode 처리 로직 (service-design.md Lines 585-597)
- ✅ P0-2: 자동 크롤링 실패 워크플로우 (Lines 1362-1388)
- ✅ P0-3: Hash 링크 처리 방법 (Lines 1634-1646)

**P1 이슈 (구현 복잡도) - 3개 완료**:
- ✅ P1-4: quality-validator 정의 일치 (Lines 362-391)
- ✅ P1-5: 4개 generator ID 스키마 참조 (Lines 282-371)
- ✅ P1-6: 프로젝트명 URL 도메인 추론 (Lines 1574-1617)

**주요 수정 파일**:
- `service-design.md`: +2839 lines (워크플로우 통합, ID 스키마 연결)

---

## 🎯 Option B 작업 계획

**목표**: 98/100 달성 (95% 초과)
**전략**: Sub-Agent 프롬프트 완성 + 데이터 흐름 검증 + 엣지 케이스 문서화

### 작업 목록 (7개, 총 9시간)

| # | 작업명 | 임팩트 | 예상 시간 | 우선순위 |
|---|--------|--------|-----------|----------|
| 1 | policy-generator 프롬프트 | 구현 가능성 +2 | 1시간 | P0 |
| 2 | screen-generator 프롬프트 | 구현 가능성 +2 | 1시간 | P0 |
| 3 | process-generator 프롬프트 | 구현 가능성 +2 | 1시간 | P0 |
| 4 | glossary-generator 프롬프트 | 구현 가능성 +1 | 1시간 | P1 |
| 5 | quality-validator 프롬프트 | 구현 가능성 +1 | 1시간 | P1 |
| 6 | 데이터 흐름 검증 체크리스트 | 데이터 흐름 +10 | 1.5시간 | P0 |
| 7 | 엣지 케이스 14개 시나리오 | 엣지 케이스 +10 | 2시간 | P0 |

**예상 최종 점수**: 88 + 17 (프롬프트) + 10 (데이터 흐름) + 10 (엣지 케이스) = **98/100** ✅

---

## 📝 작업 1-5: Sub-Agent 프롬프트 작성

### 템플릿 구조 (8-Section)

**참고**: input-analyzer 프롬프트 (service-design.md Lines 530-830)와 동일한 구조 사용

```markdown
# {agent-name} Agent

## 1. Role (역할 정의)
- 단일 책임 명확화
- 다른 에이전트와의 관계

## 2. Input Specification (입력 명세)
### Required Files
- 필수 파일 목록 및 경로

### Optional Files
- 선택 파일 목록

### Input Location
- `outputs/{projectName}/...`

## 3. Output Specification (출력 명세)
### Output File
- **Path**: `outputs/{projectName}/sections/{filename}`
- **Format**: Markdown
- **Schema**: auto-draft-guideline.md Section X 참조

### Required Fields
- 필수 포함 항목

## 4. Processing Logic (처리 로직)
### Step-by-Step Workflow
1. Read input files
2. Parse and analyze
3. Generate output
4. Validate
5. Write to file

### Data Transformation Rules
- 입력 → 출력 변환 규칙

### Decision Criteria
- 애매한 상황 시 판단 기준

## 5. Quality Criteria (품질 기준)
### Success Conditions
- [ ] 체크리스트 형태

### Failure Conditions
- 실패로 간주되는 조건

### Validation Checklist
- [ ] 검증 항목

## 6. Error Handling (에러 핸들링)
### Retry Strategy
- Max Retries: 3
- Retry Conditions: ...
- Backoff: Exponential (5s, 10s, 20s)

### Partial Success Handling
- 부분 실패 시 대응

### Failure Modes
- Critical failures: ...
- Recoverable errors: ...

## 7. Tools Usage (도구 사용)
### Allowed Tools
- Read, Write, Grep, Glob

### Prohibited Tools
- Bash (특별한 이유)

### Tool Usage Examples
- 실제 사용 예시

## 8. Examples (예시)
### Example 1: Success Case
**Input**: ...
**Output**: ...
**Processing**: ...

### Example 2: Edge Case
**Scenario**: ...
**Expected Behavior**: ...

### Example 3: Error Recovery
**Error**: ...
**Recovery**: ...
```

---

### 작업 1: policy-generator 프롬프트

**위치**: `service-design.md` Section 3.6 다음에 추가 (Line 831 이후)

**작성 내용**:

```markdown
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

**작성 시간**: 1시간

---

### 작업 2-5: 나머지 4개 프롬프트

**동일한 템플릿 사용**하여 작성:

**작업 2**: `screen-generator` 프롬프트 (1시간)
- 입력: analyzed-structure.json, policy-definition.md, screenshots
- 출력: sections/08-screen-definition.md
- 특이사항: 스크린샷 임베딩, 정책 ID 참조

**작업 3**: `process-generator` 프롬프트 (1시간)
- 입력: analyzed-structure.json, policy-definition.md, screen-definition.md
- 출력: sections/07-process-flow.md
- 특이사항: 화면 ID + 정책 ID 참조, 플로우 다이어그램 텍스트 표현

**작업 4**: `glossary-generator` 프롬프트 (1시간)
- 입력: analyzed-structure.json
- 출력: sections/05-glossary.md
- 특이사항: ID 체계 미적용, 알파벳순 정렬

**작업 5**: `quality-validator` 프롬프트 (1시간)
- 입력: 모든 sections/*.md, auto-draft-guideline.md
- 출력: validation/validation-report.md
- 특이사항: 4가지 ID 검증 (형식, 참조 무결성, 중복, 순차성)

**저장 위치**: `service-design.md` Section 3.7-3.11 (각 프롬프트를 별도 subsection으로)

---

## 📝 작업 6: 데이터 흐름 검증 체크리스트

**위치**: `service-design.md` 부록 D (새로 생성, Line ~3500)

**작성 내용**:

```markdown
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
```

**작성 시간**: 1.5시간

---

## 📝 작업 7: 엣지 케이스 14개 시나리오

**위치**: `service-design.md` 부록 E (새로 생성, Line ~3700)

**작성 내용**:

```markdown
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
```

**작성 시간**: 2시간

---

## ✅ 완료 기준

각 작업 완료 후 체크:

### 프롬프트 작성 (작업 1-5)
- [ ] 8개 section 모두 작성됨
- [ ] input-analyzer 프롬프트와 동일한 구조
- [ ] auto-draft-guideline.md Section 참조 포함
- [ ] ID 스키마 명시 (해당 시)
- [ ] 최소 3개 예시 (Success, Edge, Error)
- [ ] service-design.md에 저장됨 (Section 3.7-3.11)

### 데이터 흐름 체크리스트 (작업 6)
- [ ] Phase 1→2, 2→3-1, 3-1→3-2, 3-2→3.5, 3.5→4 모두 작성
- [ ] 각 Phase별 필수 검증 항목 명시
- [ ] 실패 시 영향 명시
- [ ] service-design.md 부록 D에 저장

### 엣지 케이스 (작업 7)
- [ ] 14개 시나리오 모두 작성
- [ ] 각 시나리오: 발생 조건, 영향, 대응, 우선순위 포함
- [ ] 5개 카테고리로 분류
- [ ] 우선순위 Summary 테이블 포함
- [ ] service-design.md 부록 E에 저장

---

## 🎯 최종 검증

**모든 작업 완료 후**:

1. **service-design.md 파일 크기 확인**:
   ```bash
   wc -l service-design.md
   # 예상: ~4500 lines (현재 ~3200 + 추가 ~1300)
   ```

2. **문서 구조 확인**:
   ```bash
   grep "^###" service-design.md | wc -l
   # Section 3.7-3.11 (5개), 부록 D, E 확인
   ```

3. **설계 품질 재평가**:
   - 시나리오 커버리지: 88 → **95** ✅
   - 데이터 흐름 일관성: 85 → **95** ✅
   - 구현 가능성: 88 → **95** ✅
   - 엣지 케이스 대응: 85 → **95** ✅
   - **평균**: 88 → **98/100** ✅✅

4. **Git commit**:
   ```bash
   git add service-design.md
   git commit -m "feat: 설계 완성도 98% 달성

   - 5개 Sub-Agent 프롬프트 완성 (policy, screen, process, glossary, quality-validator)
   - 데이터 흐름 검증 체크리스트 추가 (부록 D)
   - 엣지 케이스 14개 시나리오 문서화 (부록 E)
   - 구현 가능성 95% 달성

   🤖 Generated with Claude Code"
   ```

---

## 📚 참고 자료

**템플릿 참조**:
- input-analyzer 프롬프트: service-design.md Lines 530-830
- auto-draft-guideline.md: 출력 표준 (10개 섹션)
- quality-validator 정의: service-design.md Lines 362-391

**설계 문서**:
- prd.md: 비즈니스 요구사항
- auto-draft-guideline.md: ID 체계 (Section 11)
- chrome-devtools-mcp-verification.md: MCP 검증 완료

---

## 🚦 시작 방법

**즉시 시작**:
1. 작업 1 (policy-generator 프롬프트)부터 시작
2. 템플릿 구조 복사 → 내용 채우기
3. 완료 기준 확인
4. 다음 작업으로 이동

**예상 완료**: 1-2일 (9시간 집중 작업)

---

**End of SESSION-RESUME.md**
