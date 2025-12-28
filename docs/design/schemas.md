# Draftify 데이터 스키마

**버전**: 1.0
**최종 갱신**: 2025-12-27
**원본 출처**: service-design.md 부록 B

---

## 목차

1. [crawling-result.json 스키마](#crawling-resultjson-스키마)
2. [analyzed-structure.json 스키마](#analyzed-structurejson-스키마)
3. [ID 명명 규칙](#id-명명-규칙)

---

## crawling-result.json 스키마

**목적**: Phase 1 크롤링 결과를 Phase 2 (input-analyzer)에 전달하는 중간 데이터

**지원 모드**: 자동 크롤링 (Tier 1-3) + Record 모드

### 통합 스키마

```json
{
  "metadata": {
    "mode": "auto" | "record",
    "timestamp": "ISO 8601 format (예: 2025-12-27T10:30:00Z)",
    "crawling_strategy": "tier1" | "tier2a" | "tier2b" | "tier2c" | "tier3" | "record_mode",
    "total_pages": 15,
    "max_depth": 5,
    "max_pages": 50,
    "base_url": "https://example.com",
    "source_dir_provided": true | false,
    "expected_screens": ["home", "quiz", "result"]
  },
  "pages": [
    {
      "url": "https://example.com/about",
      "screen_name": "about" | null,
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
      "depth": 1,
      "discoveredBy": "tier1" | "tier2a" | "tier2b" | "tier2c" | "tier3" | "user_interaction",
      "timestamp": "ISO 8601 format"
    }
  ],
  "links": [
    {
      "url": "https://example.com/contact",
      "text": "문의하기",
      "source_page": "https://example.com/about",
      "priority": 0.85,
      "visited": false
    }
  ],
  "errors": [
    {
      "url": "https://example.com/admin",
      "error": "401 Unauthorized",
      "timestamp": "ISO 8601 format"
    }
  ]
}
```

### 필드 설명

**metadata**:
- `mode`: 크롤링 모드 (auto = 자동 크롤링, record = 수동 캡처)
- `crawling_strategy`: 실제 사용된 Tier 전략
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

### 예시 1: 자동 크롤링 모드

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

### 예시 2: Record 모드

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

## analyzed-structure.json 스키마

**목적**: Phase 2 (input-analyzer) 출력 → Phase 3 (모든 generator) 입력

### 전체 스키마

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

---

## ID 명명 규칙

### 1. Policy IDs

**형식**: `POL-{CATEGORY_CODE}-{SEQUENTIAL}`

**카테고리 코드** (3-4자):
| 코드 | 의미 |
|------|------|
| `AUTH` | 인증/권한 |
| `VAL` | 입력 검증 |
| `DATA` | 데이터 처리 |
| `ERR` | 에러 처리 |
| `SEC` | 보안 |
| `BIZ` | 비즈니스 로직 |
| `UI` | UI/UX 정책 |

**연번**: 카테고리별 001부터 시작

**예시**:
- `POL-AUTH-001`: 첫 번째 인증 정책
- `POL-AUTH-002`: 두 번째 인증 정책
- `POL-VAL-001`: 첫 번째 검증 정책

---

### 2. Screen IDs

**형식**: `SCR-{SEQUENTIAL}`

**연번**: 001부터 시작 (3자리 zero-padding)

**예시**:
- `SCR-001`: 첫 번째 화면
- `SCR-002`: 두 번째 화면

---

### 3. Element IDs

**형식**: `{TYPE}-{SEQUENTIAL}`

**TYPE**:
- `BTN`: 버튼
- `FORM`: 폼
- `INPUT`: 입력 필드
- `LINK`: 링크
- `TABLE`: 테이블
- `MODAL`: 모달

**예시**:
- `BTN-001`: 첫 번째 버튼
- `FORM-001`: 첫 번째 폼

---

### 4. API IDs

**형식**: `API-{SEQUENTIAL}`

**연번**: 001부터 시작

**예시**:
- `API-001`: 첫 번째 API
- `API-002`: 두 번째 API

---

## elements.action 구조

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

---

## flows.steps.condition 구조

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

---

## apis 섹션 (선택)

**목적**: 로컬 소스 코드 분석 시 API 엔드포인트 정보 저장

**id**: `API-{SEQUENTIAL}` 형식

**사용 시나리오**:
- `--source-dir` 옵션 제공 시 input-analyzer가 소스 코드에서 API 추출
- screen-generator가 화면-API 연결 관계 표시
- policy-generator가 API 관련 정책 생성

---

## 검증 규칙

### ID 형식 검증

```python
import re

# Policy ID
assert re.match(r'^POL-(AUTH|VAL|DATA|ERR|SEC|BIZ|UI)-\d{3}$', 'POL-AUTH-001')

# Screen ID
assert re.match(r'^SCR-\d{3}$', 'SCR-001')

# Element ID
assert re.match(r'^(BTN|FORM|INPUT|LINK|TABLE|MODAL)-\d{3}$', 'BTN-001')

# API ID
assert re.match(r'^API-\d{3}$', 'API-001')
```

### 참조 무결성 검증

```python
# 화면정의서에서 정책 참조 확인
screen_policies = ["POL-AUTH-001", "POL-VAL-003"]
defined_policies = ["POL-AUTH-001", "POL-AUTH-002", "POL-VAL-001"]

for pol_id in screen_policies:
    assert pol_id in defined_policies, f"{pol_id} not found"
```

---

## 다음 단계

- **Phase 1 상세**: [crawling-strategy.md](./crawling-strategy.md)
- **Phase 2 상세**: [agents/input-analyzer.md](./agents/input-analyzer.md)
- **검증 로직**: [agents/quality-validator.md](./agents/quality-validator.md)
