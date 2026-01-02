# Draftify 설계 리뷰 보고서

**일자**: 2026-01-02
**범위**: `docs/design/*.md`, `docs/design/agents/*.md`, `.claude/skills/*.md`
**리뷰어**: Claude Opus 4.5
**이전 리뷰**: `docs/archive/design-review-2025-12-31.md`

---

## 요약

2025-12-31 리뷰에서 지적된 11개 이슈에 대한 패치 제안(`design-review-2025-12-31.patch-proposal.md`)이 대부분 적절히 적용되었습니다. 다만 일부 문서에서 잔여 불일치가 발견되었으며, 새로운 경미한 이슈도 확인되었습니다.

**전체 평가**: 패치 적용 완료율 **91%** (11개 중 10개 완전 적용, 1개 부분 적용)

---

## 1. 패치 적용 검증 결과

### 1.1 완전히 적용된 항목 (10개) ✅

| # | 항목 | 적용 확인 위치 |
|---|------|---------------|
| 1 | Phase 4 ownership 통일 | `draftify-ppt/SKILL.md:3,10`, `agents/README.md:9` |
| 2 | Error-handling section 참조 수정 | `orchestrator.md:133,168,226` → "Section 4 (Phase별 에러 핸들링)" |
| 3 | 10-section 생성 주체 명시 | `draftify-ppt/SKILL.md:13`, `agents/README.md:14-19` (front/back-matter-generator 추가) |
| 4 | Policy 카테고리 코드 길이 통일 | `schemas.md:317` → "2-5자" |
| 5 | Element ID 타입 목록 통합 | `schemas.md:353-363` → NAV, CARD, LIST 추가 |
| 6 | Record 모드 스키마 정규화 | `record-mode-design.md:285-291` → metadata 아래 crawling_strategy 배치 |
| 7 | 출력 경로 표준화 | `record-mode-design.md:807`, `schemas.md:43` → `outputs/{projectName}/...` |
| 8 | README 경로 config 추가 | `auto-draft/SKILL.md:118`, `orchestrator.md:50` |
| 9 | 복구 파일명 통일 | `edge-cases.md:56,84` → `~/.draftify/record-sessions/{url-hash}.recovery.json` |
| 10 | sourceDir 처리 방식 명시 | `orchestrator.md:130` → "원본 경로 전달 (복사 없음)" |

### 1.2 부분 적용된 항목 (1개) ⚠️

#### 타임아웃 예산 통일 (25분 vs 35분)

**의도된 변경**: 전체 워크플로우 타임아웃을 25분으로 통일

**적용 상태**:
- ✅ `config.md:40` → 25분
- ✅ `orchestrator.md:14` → "25-minute context"
- ✅ `auto-draft/SKILL.md:73,151` → 25분 (1500000ms)
- ❌ `architecture.md:136-137` → **35분 (2100000ms) 잔여**
- ❌ `architecture.md:143` → **"35분 타임아웃" 잔여**

**영향**: 구현 시 architecture.md를 참조하면 잘못된 타임아웃 값 적용 가능

**권장 조치**:
```markdown
# architecture.md line 136-137 수정
- timeout: 2100000  // 35분
+ timeout: 1500000  // 25분

# architecture.md line 143 수정
- 35분 타임아웃
+ 25분 타임아웃
```

---

## 2. 신규 발견 사항

### 2.1 Major (수정 권장)

#### M1. architecture.md 내부 불일치

**문제**: 동일 문서 내에서 타임아웃 값이 상충됨

| 위치 | 값 |
|------|-----|
| `architecture.md:136-137` | 35분 (2100000ms) |
| `architecture.md:143` | "35분 타임아웃" |
| `architecture.md:238` | "독립 컨텍스트 (25분)" |

**권장 조치**: 모두 25분으로 통일 (config.md가 Single Source of Truth)

---

#### M2. architecture.md Phase 3-0 누락

**문제**: Phase 3-0 (front-matter-generator, back-matter-generator)이 다른 문서에는 추가되었으나 architecture.md에는 반영되지 않음

**영향받는 섹션**:
- `architecture.md:173-178` 의 Phase별 에이전트 테이블
- 전체 아키텍처 다이어그램 (line 46-89)

**권장 조치**:
1. Phase 표에 Phase 3-0 행 추가:
   ```markdown
   | **Phase 3-0** | front-matter-generator, back-matter-generator | **병렬** (2개) | Phase 2 완료 필수 |
   ```
2. 다이어그램에 Phase 3-0 추가 (Phase 3-1과 동시 실행으로 표시)

---

### 2.2 Minor (선택적 수정)

#### m1. 문서 버전/날짜 불일치

**현황**:
- 대부분 문서: "버전 1.3, 최종 갱신 2025-12-29"
- `front-matter-generator.md`: "Version 1.0, Last Updated: 2026-01-01"
- `back-matter-generator.md`: 동일

**권장 조치**: 신규 추가된 에이전트 문서의 버전을 기존 체계(1.3)에 맞추거나, 날짜만 통일

---

#### m2. error-handling.md Phase 3-0 섹션 한글 깨짐

**위치**: `error-handling.md:171-191`

**현상**: Phase 3-0 섹션 제목과 일부 본문이 깨진 문자로 표시됨
```
### Phase 3-0: ?? ?? ??
#### front-matter-generator ??
```

**권장 조치**: 해당 섹션 한글 재작성

---

## 3. 문서 간 일관성 검증

### 3.1 ID 규칙 일관성 ✅

| 문서 | Policy 카테고리 | Element 타입 |
|------|----------------|--------------|
| `auto-draft-guideline.md` | 2-5자 (AUTH, VAL, ...) | BTN, FORM, NAV, CARD, LIST... |
| `schemas.md` | 2-5자 (`[A-Z]{2,5}`) | BTN, FORM, NAV, CARD, LIST... |
| `quality-validator.md` | 2-5자 참조 | - |

**결론**: 모두 일관됨

---

### 3.2 타임아웃 설정 일관성 ⚠️

| 문서 | Main Agent 타임아웃 |
|------|---------------------|
| `config.md` (SSOT) | **25분** |
| `orchestrator.md` | 25분 ✅ |
| `auto-draft/SKILL.md` | 25분 (1500000ms) ✅ |
| `architecture.md` | 35분 (2100000ms) ❌ |

**결론**: architecture.md 수정 필요

---

### 3.3 Phase 실행 순서 일관성 ✅

| 문서 | 실행 순서 |
|------|----------|
| `workflow.md` | Phase 1 → 2 → 3-0 ∥ 3-1 → 3-2(screen → process) → 3.5 → 4 |
| `orchestrator.md` | 동일 |
| `agents/README.md` | 동일 |

**결론**: 일관됨

---

### 3.4 Phase 4 호출 주체 일관성 ✅

| 문서 | Phase 4 실행 주체 |
|------|-------------------|
| `workflow.md:100-106` | /auto-draft 스킬 |
| `orchestrator.md:37` | /auto-draft 스킬 (orchestrator 아님) |
| `draftify-ppt/SKILL.md:3,10` | /auto-draft 스킬이 호출 |
| `agents/README.md:9` | orchestrator는 Phase 1-3.5만 담당 |

**결론**: 모두 일관됨

---

## 4. 설계 품질 평가

### 4.1 강점

1. **명확한 책임 분리**: Skill → Orchestrator → Sub-agents 계층 구조가 잘 정의됨
2. **의존성 관리**: Phase 3-2의 순차 실행 (screen → process) 근거가 명확
3. **에러 핸들링**: 부분 성공 허용 철학이 일관되게 적용됨
4. **ID 스키마**: 확장 가능한 카테고리 코드 체계 (2-5자)

### 4.2 개선 필요 영역

1. **architecture.md 동기화**: 다른 문서 변경 시 함께 업데이트 필요
2. **버전 관리**: 문서 버전/날짜 통일 프로세스 필요
3. **한글 인코딩**: 일부 파일에서 문자 깨짐 발생

---

## 5. 권장 조치 요약

### 즉시 수정 권장 (Major) - ✅ 완료

1. **architecture.md 타임아웃 수정** ✅
   - Line 136-137: `2100000` → `1500000`, "35분" → "25분"
   - Line 143: "35분 타임아웃" → "25분 타임아웃"

2. **architecture.md Phase 3-0 추가** ✅
   - 에이전트 테이블에 Phase 3-0 행 추가
   - 다이어그램 업데이트 (front-matter-gen, back-matter-gen 추가)

### 선택적 수정 (Minor) - ✅ 완료

3. **error-handling.md Phase 3-0 한글 재작성** ✅
4. **front-matter-generator.md, back-matter-generator.md 버전 체계 통일** (향후 과제)

---

## 6. 결론

2025-12-31 리뷰의 패치 제안이 전반적으로 잘 적용되었습니다. `architecture.md`의 타임아웃 불일치만 수정하면 설계 문서 간 일관성이 확보됩니다.

**다음 리뷰 권장 시점**: 구현 착수 전 또는 Phase 1 크롤링 구현 완료 후

---

*이 리뷰는 Claude Opus 4.5에 의해 자동 생성되었습니다.*
