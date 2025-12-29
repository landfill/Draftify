# Draftify 로깅 표준

**버전**: 1.3
**최종 갱신**: 2025-12-29

> **Note**: 이 문서는 모든 에이전트가 준수해야 하는 로깅 표준입니다.

---

## 로그 레벨

| 레벨 | 용도 | 예시 |
|------|------|------|
| **INFO** | 정상 동작, 진행 상태 | "Starting input analysis", "Saved crawling-result.json" |
| **WARN** | 비정상이나 계속 진행 가능 | "Screenshot not found", "Optional file missing" |
| **ERROR** | 실패, 재시도 또는 중단 필요 | "Failed to parse JSON", "Connection timeout" |
| **DEBUG** | 상세 디버깅 정보 (개발용) | "Extracted 15 URLs", "Policy category: AUTH" |

---

## 로그 형식

### 표준 형식

```
[YYYY-MM-DD HH:MM:SS] LEVEL: Message
```

### 예시

```
[2025-12-29 14:30:15] INFO: Starting input analysis for project: todo-app
[2025-12-29 14:30:16] INFO: Parsed 8 URLs from crawling-result.json
[2025-12-29 14:30:17] WARN: Optional file not found: prd.md
[2025-12-29 14:30:20] INFO: Extracted 8 screens, 3 policies, 2 APIs
[2025-12-29 14:30:21] INFO: Successfully created analyzed-structure.json
```

### 에러 로그 형식 (상세)

```
[YYYY-MM-DD HH:MM:SS] ERROR: {에러 메시지}
  - File: {파일 경로}
  - Line: {라인 번호} (해당 시)
  - Details: {추가 정보}
```

### 예시

```
[2025-12-29 14:30:18] ERROR: Failed to parse crawling-result.json
  - File: outputs/todo-app/analysis/crawling-result.json
  - Details: Unexpected token at position 1523
```

---

## 에이전트별 로그 파일

| 에이전트 | 로그 파일 경로 |
|---------|---------------|
| orchestrator | `outputs/{projectName}/logs/orchestrator.log` |
| input-analyzer | `outputs/{projectName}/logs/input-analyzer.log` |
| policy-generator | `outputs/{projectName}/logs/policy-generator.log` |
| glossary-generator | `outputs/{projectName}/logs/glossary-generator.log` |
| screen-generator | `outputs/{projectName}/logs/screen-generator.log` |
| process-generator | `outputs/{projectName}/logs/process-generator.log` |
| quality-validator | `outputs/{projectName}/logs/quality-validator.log` |
| record-mode | `outputs/{projectName}/logs/record-mode.log` |

---

## 로그 메시지 작성 가이드

### INFO 메시지 패턴

| 상황 | 메시지 패턴 |
|------|-----------|
| 시작 | `Starting {작업} for project: {projectName}` |
| 파싱 | `Parsed {n} {항목} from {파일명}` |
| 추출 | `Extracted {n} {항목}` |
| 저장 | `Saved {파일명}` |
| 완료 | `Successfully {완료 동작}` |

### WARN 메시지 패턴

| 상황 | 메시지 패턴 |
|------|-----------|
| 파일 없음 | `Optional file not found: {파일명}` |
| 스킵 | `Skipping {항목}: {이유}` |
| 재분류 | `{항목} reassigned to {카테고리}: {이유}` |
| 참조 없음 | `{ID} referenced but not found in {파일명}` |

### ERROR 메시지 패턴

| 상황 | 메시지 패턴 |
|------|-----------|
| 파싱 실패 | `Failed to parse {파일명}: {에러}` |
| 연결 실패 | `Connection failed: {대상}` |
| 타임아웃 | `Timeout exceeded: {작업} ({시간}ms)` |
| 검증 실패 | `Validation failed: {항목}` |

---

## 콘솔 출력 표준

사용자에게 표시되는 콘솔 메시지:

### 진행 상태

```
[Phase 1] Crawling https://todo-app.com...
[Phase 1] Found 8 pages, captured 8 screenshots ✓
[Phase 2] Calling input-analyzer...
[Phase 2] Generated analyzed-structure.json ✓
```

### 성공

```
✅ {작업} 완료
```

### 경고

```
⚠️ {경고 내용}
```

### 에러

```
❌ {에러 내용}
```

---

## 로깅 구현 예시

### Python

```python
import logging
from datetime import datetime

def setup_logger(agent_name: str, project_name: str):
    logger = logging.getLogger(agent_name)
    logger.setLevel(logging.DEBUG)

    # 파일 핸들러
    log_path = f"outputs/{project_name}/logs/{agent_name}.log"
    fh = logging.FileHandler(log_path)
    fh.setLevel(logging.DEBUG)

    # 콘솔 핸들러
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)

    # 포맷
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)

    logger.addHandler(fh)
    logger.addHandler(ch)

    return logger

# 사용 예시
logger = setup_logger('input-analyzer', 'todo-app')
logger.info("Starting input analysis for project: todo-app")
logger.warn("Optional file not found: prd.md")
logger.error("Failed to parse crawling-result.json: Unexpected token")
```

---

## 참조

- [config.md](./config.md) - 타임아웃 값 참조
- [error-handling.md](./error-handling.md) - 에러 처리 전략
- [agents/](./agents/) - 에이전트별 로깅 요구사항
