# Draftify 설정값 정의

**버전**: 1.3
**최종 갱신**: 2025-12-29

> **Note**: 이 문서는 Draftify 전체에서 사용되는 상수 및 기본값의 중앙 관리 문서입니다.
> 설정값 변경 시 이 문서만 수정하면 됩니다.

---

## 크롤링 설정

| 설정 | 기본값 | CLI 옵션 | 설명 |
|------|--------|----------|------|
| `MAX_DEPTH` | 5 | `--max-depth` | 크롤링 최대 깊이 |
| `MAX_PAGES` | 50 | `--max-pages` | 크롤링 최대 페이지 수 |
| `PAGE_TIMEOUT` | 30초 | - | 페이지당 로딩 타임아웃 |
| `MIN_PAGES_FOR_SUCCESS` | 3 | - | 자동 크롤링 성공 최소 페이지 수 |
| `EARLY_STOP_PAGES` | 10 | - | 조기 종료 최소 페이지 수 |

---

## 타임아웃 설정 (Phase별)

| Phase | 작업 | 타임아웃 | 설명 |
|-------|------|---------|------|
| **전체** | 워크플로우 | 35분 | Main Agent 전체 타임아웃 |
| **Phase 1** | 크롤링 (20페이지 기준) | 10분 | 20 × 30초 + 버퍼 |
| **Phase 2** | input-analyzer | 5분 | LLM 호출 + JSON 생성 |
| **Phase 3-1** | policy + glossary (병렬) | 3분 | 더 오래 걸리는 작업 기준 |
| **Phase 3-2** | screen → process (순차) | 5분 | 3분 + 2분 |
| **Phase 3.5** | quality-validator | 2분 | ID/참조 검증 |
| **Phase 4** | ppt-generator | 10분 | PPT 변환 + 이미지 처리 |

### 개별 에이전트 타임아웃

| 에이전트 | 타임아웃 |
|---------|---------|
| input-analyzer | 5분 (300,000ms) |
| policy-generator | 3분 (180,000ms) |
| glossary-generator | 2분 (120,000ms) |
| screen-generator | 3분 (180,000ms) |
| process-generator | 2분 (120,000ms) |
| quality-validator | 2분 (120,000ms) |

---

## 재시도 설정

| 에이전트 | 최대 재시도 | 백오프 간격 |
|---------|-----------|------------|
| input-analyzer | 3회 | 5초, 10초, 20초 |
| policy-generator | 3회 | 5초, 10초, 20초 |
| glossary-generator | 2회 | 5초, 10초 |
| screen-generator | 3회 | 5초, 10초, 20초 |
| process-generator | 2회 | 5초, 10초 |
| quality-validator | 0회 | - (재시도 없음) |

---

## ID 형식

| ID 유형 | 형식 | 정규식 패턴 | 예시 |
|--------|------|------------|------|
| 정책 ID | `POL-{CATEGORY}-{SEQ}` | `POL-[A-Z]{2,5}-\d{3}` | POL-AUTH-001 |
| 화면 ID | `SCR-{SEQ}` | `SCR-\d{3}` | SCR-001 |
| 요소 ID | `{TYPE}-{SEQ}` | `(BTN\|FORM\|INPUT\|LINK\|TABLE\|MODAL)-\d{3}` | BTN-001 |
| API ID | `API-{SEQ}` | `API-\d{3}` | API-001 |

### 정책 카테고리 코드

**기본 (7개)**:
- `AUTH`: 인증/권한
- `VAL`: 입력 검증
- `DATA`: 데이터 처리
- `ERR`: 에러 처리
- `SEC`: 보안
- `BIZ`: 비즈니스 로직
- `UI`: UI/UX 정책

**확장 (예시)**:
- `NOTIF`: 알림
- `PAY`: 결제
- `SHIP`: 배송
- `RPT`: 리포팅
- `INTEG`: 외부 연동

---

## 출력 디렉토리 구조

```
outputs/{projectName}/
├── screenshots/           # 스크린샷
├── analysis/              # 분석 결과
│   ├── crawling-result.json
│   └── analyzed-structure.json
├── sections/              # 생성된 섹션
│   ├── 05-glossary.md
│   ├── 06-policy-definition.md
│   ├── 07-process-flow.md
│   └── 08-screen-definition.md
├── validation/            # 검증 결과
│   └── validation-report.md
├── logs/                  # 로그
└── final-draft.pptx       # 최종 산출물
```

---

## 최소 성공 기준

| Phase | 최소 조건 |
|-------|----------|
| Phase 1 | URL 크롤링 또는 스크린샷 중 1개 이상 |
| Phase 2 | analyzed-structure.json 생성 성공 |
| Phase 3 | 최소 1개 섹션 생성 성공 |
| Phase 4 | 마크다운 섹션 파일들 존재 (PPT는 선택) |

---

## Record 모드 설정

| 설정 | 값 | 설명 |
|------|-----|------|
| 복구 파일 경로 | `~/.draftify/record-sessions/{url-hash}.recovery.json` | URL 해시 기반 |
| 최소 완성도 | 50% | 부분 성공 허용 기준 |
| 예상 시간 (5개 화면) | ~5분 | 사용자 탐색 시간 |
| 예상 시간 (10개 화면) | ~10분 | 사용자 탐색 시간 |

---

## Validation 점수 계산

```
기본 점수: 100점

감점 항목:
- ID 형식 오류: -10점/건 (최대 -30)
- 참조 무결성 오류: -5점/건 (최대 -20)
- 중복 ID: -15점/건 (최대 -30)
- 순차 번호 오류: -3점/건 (최대 -20)

PASS 조건:
- Score >= 80
- Critical errors = 0 (ID 형식, 중복 ID)
```

---

## 참조

이 문서의 설정값은 다음 문서들에서 참조됩니다:
- [error-handling.md](./error-handling.md) - 타임아웃, 재시도
- [crawling-strategy.md](./crawling-strategy.md) - 크롤링 설정
- [schemas.md](./schemas.md) - ID 형식
- [agents/quality-validator.md](./agents/quality-validator.md) - Validation 점수
- [agents/orchestrator.md](./agents/orchestrator.md) - Phase별 타임아웃
