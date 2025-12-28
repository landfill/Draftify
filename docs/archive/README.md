# 🛑 STOP - DO NOT USE THESE DOCUMENTS FOR IMPLEMENTATION

## ⚠️ CRITICAL WARNING

**이 디렉토리의 모든 문서는 OUTDATED 레거시 아카이브입니다.**

---

## 당신이 구현 중이라면

### ❌ 절대 하지 말 것

- 이 폴더의 문서를 설계 참조로 사용
- 에이전트 프롬프트를 여기서 복사
- 아키텍처/워크플로우를 여기서 참조
- 데이터 스키마를 여기서 가져오기
- 구현 체크리스트를 여기서 확인

### ✅ 올바른 행동

**👉 `docs/design/` 디렉토리로 이동하세요**

```
cd ../../design/
```

**📍 시작점**: `docs/design/design-index.md`
- 모든 현재 유효한 설계문서 매핑
- 구현 시나리오별 가이드
- 문서 간 의존성 그래프

---

## 이 폴더의 용도

### service-design.md (189KB, 5910줄)

**상태**: 2025-12-27 모듈화되어 `docs/design/` 13개 파일로 분할됨

**유일한 용도:**
- 문서 변경 이력 추적
- 원본 의도 확인 (design/ 문서와 불일치 발견 시)
- 히스토리 컨텍스트 이해

**절대 용도 아님:**
- 구현 참조 ❌
- 최신 스펙 확인 ❌
- 에이전트 프롬프트 소스 ❌

---

## 모듈화 매핑

원본 service-design.md → 현재 유효 문서:

| 원본 섹션 | 현재 문서 (docs/design/) |
|-----------|-------------------------|
| Section 2: 시스템 아키텍처 | `architecture.md` |
| Section 3: 에이전트 구조 | `agents/*.md` (7개 파일) |
| Section 4: 데이터 흐름 | `workflow.md` |
| Section 5: 기술 스택 | `tech-stack.md` |
| Section 6: 사용자 인터페이스 | `ui-design.md` |
| Section 7: 에러 핸들링 | `error-handling.md` |
| Section 8: 프로젝트 관리 | `project-management.md` |
| 부록 A: Phase별 상세 흐름 | `crawling-strategy.md` |
| 부록 B: 데이터 스키마 | `schemas.md` |
| 부록 C: 구현 체크리스트 | `implementation-checklist.md` |
| 부록 E: 엣지 케이스 | `edge-cases.md` |
| (신규) Record 모드 | `record-mode-design.md` |

---

## 기타 아카이브 파일

이 폴더의 다른 .md 파일들:
- `SESSION-RESUME.md` - 과거 작업 세션 기록
- `chrome-devtools-mcp-verification.md` - MCP 검증 기록
- `design-improvements-summary.md` - 설계 개선 이력
- `phase1-improvement-proposal.md` - Phase 1 개선안
- `tier2-*.md` - Tier 2 크롤링 검증 보고서

**모두 히스토리 참고용입니다. 구현에 사용하지 마세요.**

---

## 🚨 다시 한 번 강조

### IF YOU ARE IMPLEMENTING:
### GO TO `docs/design/` NOW
### DO NOT USE ANYTHING IN THIS ARCHIVE FOLDER

---

**질문이 있다면**: `docs/design/design-index.md` 읽기
**구현 시작한다면**: `docs/design/implementation-checklist.md` 읽기
**전체 시스템 이해**: `docs/design/architecture.md` → `docs/design/workflow.md`

**이 폴더는 잊으세요.**
