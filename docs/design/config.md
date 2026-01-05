# Draftify 설정값 정의

**버전**: 1.4
**최종 갱신**: 2025-12-29

> **Note**: 이 문서는 Draftify 전체에서 사용되는 **상수 및 기본값**의 중앙 관리 문서입니다.
> 설정값 변경 시 이 문서만 수정하면 됩니다.

---

## 목차

1. [크롤링 설정](#1-크롤링-설정)
2. [타임아웃 설정](#2-타임아웃-설정)
3. [재시도 설정](#3-재시도-설정)
4. [Record 모드 설정](#4-record-모드-설정)
5. [최소 성공 기준](#5-최소-성공-기준)

---

## 1. 크롤링 설정

| 설정 | 기본값 | CLI 옵션 | 설명 |
|------|--------|----------|------|
| `MAX_DEPTH` | 5 | `--max-depth` | 크롤링 최대 깊이 |
| `MAX_PAGES` | 50 | `--max-pages` | 크롤링 최대 페이지 수 |
| `PAGE_TIMEOUT` | 30초 | - | 페이지당 로딩 타임아웃 |
| `MIN_PAGES_FOR_SUCCESS` | 3 | - | 자동 크롤링 성공 최소 페이지 수 |
| `EARLY_STOP_PAGES` | 10 | - | 조기 종료 최소 페이지 수 |
| `EARLY_STOP_TIME` | 10분 | - | 조기 종료 시간 조건 |

---

## 2. 타임아웃 설정

### 전체 워크플로우

| 항목 | 값 |
|------|-----|
| **전체 워크플로우 예상 시간** | **38분** (Main Agent + Phase 4) |
| Main Agent 전체 타임아웃 | **28분** (Phase 1-3.5) |

### Phase별 타임아웃

| Phase | 타임아웃 | 비고 |
|-------|---------|------|
| Phase 1 (크롤링) | 10분 | 20페이지 × 30초 + 버퍼 |
| Phase 2 (분석) | 5분 | input-analyzer |
| Phase 3-0 (기본 섹션) | 2분 | 병렬 실행 (Phase 3-1과 병렬) |
| Phase 3-1 (정책/용어) | 3분 | 병렬 실행, 더 긴 작업 기준 |
| Phase 3-2 (화면/프로세스) | 5분 | 순차 실행 (3분 + 2분) |
| Phase 3.5 (검증) | 2분 | quality-validator |
| Phase 4 (PPT) | 10분 | draftify-ppt |

### 개별 에이전트 타임아웃

| 에이전트 | 타임아웃 | 밀리초 |
|---------|---------|--------|
| front-matter-generator | 2분 | 120,000 |
| back-matter-generator | 2분 | 120,000 |
| input-analyzer | 5분 | 300,000 |
| policy-generator | 3분 | 180,000 |
| glossary-generator | 2분 | 120,000 |
| screen-generator | 3분 | 180,000 |
| process-generator | 2분 | 120,000 |
| quality-validator | 2분 | 120,000 |

---

## 3. 재시도 설정

| 에이전트 | 최대 재시도 | 백오프 간격 |
|---------|-----------|------------|
| front-matter-generator | 2회 | 5초, 10초 |
| back-matter-generator | 2회 | 5초, 10초 |
| input-analyzer | 3회 | 5초, 10초, 20초 |
| policy-generator | 3회 | 5초, 10초, 20초 |
| glossary-generator | 2회 | 5초, 10초 |
| screen-generator | 3회 | 5초, 10초, 20초 |
| process-generator | 2회 | 5초, 10초 |
| quality-validator | 0회 | - (재시도 없음) |

---

## 4. Record 모드 설정

| 설정 | 값 | 설명 |
|------|-----|------|
| 복구 파일 경로 | `~/.draftify/record-sessions/{url-hash}.recovery.json` | URL 해시 기반 |
| 최소 완성도 | 50% | 부분 성공 허용 기준 |
| 예상 시간 (5개 화면) | ~5분 | 사용자 탐색 시간 |
| 예상 시간 (10개 화면) | ~10분 | 사용자 탐색 시간 |

---

## 5. 최소 성공 기준

| Phase | 최소 조건 |
|-------|----------|
| Phase 1 | URL 크롤링 또는 스크린샷 중 1개 이상 |
| Phase 2 | analyzed-structure.json 생성 성공 |
| Phase 3 | 최소 1개 섹션 생성 성공 |
| Phase 4 | 마크다운 섹션 파일들 존재 (PPT는 선택) |

---

## 참조 관계

이 문서는 **단일 진실 소스 (Single Source of Truth)**입니다.

### 이 문서를 참조하는 문서

| 문서 | 참조 항목 |
|------|----------|
| [error-handling.md](./error-handling.md) | 재시도 설정, 최소 성공 기준 |
| [crawling-strategy.md](./crawling-strategy.md) | 크롤링 설정 |
| [agents/orchestrator.md](./agents/orchestrator.md) | 타임아웃 설정 |
| [agents/*.md](./agents/) | 개별 에이전트 타임아웃, 재시도 |

### 다른 문서에서 정의하는 항목

| 항목 | 정의 문서 |
|------|----------|
| 출력 디렉토리 구조 | [project-management.md](./project-management.md) |
| ID 형식 (POL-*, SCR-*) | [schemas.md](./schemas.md) |
| Validation 점수 계산 | [agents/quality-validator.md](./agents/quality-validator.md) |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.4 | 2025-12-29 | 문서 정리: 출력 구조/ID 형식/Validation 점수는 해당 문서 참조로 변경 |
| 1.3 | 2025-12-29 | Phase 3-1 병렬 실행 반영 |
| 1.0 | 2025-12-27 | 초기 작성 |
