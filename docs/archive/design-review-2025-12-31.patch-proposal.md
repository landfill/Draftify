# Draftify design review patch proposal

Date: 2026-01-01  
Scope: Follow-up for `docs/archive/design-review-2025-12-31.md`

Each issue title includes a checklist box for tracking completion.

## [x] Phase 4 ownership alignment

**Goal**: Single source of truth for who invokes Phase 4.

**Proposed changes**:
- Update `.claude/skills/draftify-ppt/SKILL.md`:
  - Replace “invoked by auto-draft-orchestrator” with “invoked by /auto-draft skill”.
  - Remove “Usage by Orchestrator” section or rename to “Usage by /auto-draft”.
- Update `docs/design/agents/README.md`:
  - Change “Orchestrates Phase 1-4 workflow” to “Phase 1-3.5 only”.
- Verify `docs/design/workflow.md` and `docs/design/agents/orchestrator.md` already state Phase 4 is skill-owned; keep consistent.

**Files**:
- `.claude/skills/draftify-ppt/SKILL.md`
- `docs/design/agents/README.md`

---

## [x] Timeout budget normalization (25 vs 35 minutes)

**Goal**: Use `docs/design/config.md` as the single source of truth.

**Proposed changes**:
- If 35 minutes is the intended main-agent budget, update:
  - `docs/design/agents/orchestrator.md` “Total Orchestrator Workflow” and phase totals.
  - `.claude/skills/auto-draft/SKILL.md` Task timeout (1500000 → 2100000).
- If 25 minutes is intended, then update `docs/design/config.md` accordingly.

**Files**:
- `docs/design/config.md`
- `docs/design/agents/orchestrator.md`
- `.claude/skills/auto-draft/SKILL.md`

---

## [x] Fix stale section references in error-handling

**Goal**: Remove references to non-existent Section 7.x.

**Proposed changes**:
- Replace “Section 7.x” references with actual anchors (e.g., “Phase별 에러 핸들링”).
- Update `docs/design/implementation-checklist.md` to point to correct sections.

**Files**:
- `docs/design/agents/orchestrator.md`
- `docs/design/implementation-checklist.md`
- `docs/design/error-handling.md` (optional: add explicit anchors)

---

## [x] Clarify 10-section output ownership

**Goal**: Make it explicit who creates sections 01-04 and 09-10.

**Proposed changes**:
- If `draftify-ppt` synthesizes missing sections, state that clearly in:
  - `.claude/skills/draftify-ppt/SKILL.md`
  - `docs/design/workflow.md` (remove “10 markdown files” claim)
- If markdown generation is required, add generators or document where those files are created.

**Files**:
- `docs/design/workflow.md`
- `.claude/skills/draftify-ppt/SKILL.md`
- `.claude/skills/auto-draft/SKILL.md` (output structure)

---

## [x] Align policy category code length (2-5 vs 3-4)

**Goal**: Consistent validation rules.

**Proposed changes**:
- Choose one rule (recommended: 2-5 as per guideline).
- Update schema validation regex and any references in:
  - `docs/design/schemas.md`
  - `docs/design/agents/quality-validator.md`
  - `docs/design/agents/policy-generator.md`

**Files**:
- `docs/design/auto-draft-guideline.md` (if you choose 3-4 instead)
- `docs/design/schemas.md`
- `docs/design/agents/quality-validator.md`
- `docs/design/agents/policy-generator.md`

---

## [x] Unify Element ID type list

**Goal**: Schema accepts all guideline types.

**Proposed changes**:
- Add NAV/CARD/LIST to schema types or define a superset list.
- Ensure `quality-validator` uses the same list if it validates element IDs.

**Files**:
- `docs/design/schemas.md`
- `docs/design/auto-draft-guideline.md` (only if you want to remove types)

---

## [x] Conform record-mode crawling-result to schema

**Goal**: Record-mode output matches `schemas.md`.

**Proposed changes**:
- Move `crawling_strategy` under `metadata`.
- Replace `metadata.total_screens` with `metadata.total_pages`.
- Ensure `metadata` includes `base_url`, `max_depth`, `max_pages` as applicable.

**Files**:
- `docs/design/record-mode-design.md`
- `docs/design/schemas.md` (if you want to support a record-mode variant explicitly)

---

## [x] Standardize output paths to project scope

**Goal**: Use `outputs/{projectName}/...` everywhere.

**Proposed changes**:
- Update record-mode examples and pseudo-code to write:
  - `outputs/{projectName}/screenshots/...`
  - `outputs/{projectName}/analysis/crawling-result.json`
- Update schema examples to show relative paths under project root.

**Files**:
- `docs/design/record-mode-design.md`
- `docs/design/schemas.md`
- `docs/design/project-management.md` (optional cross-reference)

---

## [x] Pass README path into orchestrator config

**Goal**: Do not drop `--readme`.

**Proposed changes**:
- Add `readme: readme || null` to the `/auto-draft` config object.
- Ensure Phase 1 copies README into outputs (or passes the original path consistently).

**Files**:
- `.claude/skills/auto-draft/SKILL.md`
- `docs/design/agents/orchestrator.md`

---

## [x] Resolve record recovery filename mismatch

**Goal**: Single recovery filename convention.

**Proposed changes**:
- Remove `.record-recovery.json` mention, or alias it explicitly to the canonical path.

**Files**:
- `docs/design/edge-cases.md`
- `docs/design/config.md`

---

## [x] Clarify sourceDir handling

**Goal**: Make sourceDir path consistent.

**Proposed changes**:
- Decide whether to copy `sourceDir` into `outputs/{projectName}/source-dir/` or use the original path.
- Update Phase 1 steps and input-analyzer instructions accordingly.

**Files**:
- `docs/design/agents/orchestrator.md`
- `docs/design/agents/input-analyzer.md`

