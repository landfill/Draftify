# Draftify design review report

Date: 2025-12-31
Scope: `docs/design/*.md`, `docs/design/agents/*.md`, `.claude/skills/*.md`

## Summary

The current design set has several cross-document inconsistencies that will
cause implementation drift (Phase 4 ownership, timeouts, schema vs output
paths, and ID rules). There are also broken intra-doc references and a few
option/config mismatches that will silently drop inputs.

## Findings (ordered by severity)

### Critical

1) Phase 4 ownership is contradictory across specs and skills.
- Evidence:
  - Orchestrator scope is Phase 1-3.5 only. `docs/design/agents/orchestrator.md:12`
  - Workflow says Phase 4 is executed by the `/auto-draft` skill. `docs/design/workflow.md:7`, `docs/design/workflow.md:236`
  - Agents README claims orchestrator handles Phase 1-4. `docs/design/agents/README.md:9`
  - `draftify-ppt` skill says it is invoked by the orchestrator. `.claude/skills/draftify-ppt/SKILL.md:3`, `.claude/skills/draftify-ppt/SKILL.md:10`, `.claude/skills/draftify-ppt/SKILL.md:90-92`
- Impact: Different teams will implement Phase 4 in different places, risking double invocation or missing PPT generation.
- Recommendation: Choose a single owner (recommended: `/auto-draft` skill) and update all references (README, `draftify-ppt` skill, and any orchestration text).

### Major

2) Timeout budget is inconsistent (25 vs 35 minutes) for the main agent.
- Evidence:
  - Config sets main agent to 35 minutes. `docs/design/config.md:40`
  - Orchestrator doc says total workflow 25 minutes. `docs/design/agents/orchestrator.md:415`
  - `/auto-draft` skill uses 25 minutes for orchestrator. `.claude/skills/auto-draft/SKILL.md:137`
- Impact: Implementation may time out early or violate the global budget.
- Recommendation: Align all timeouts and update the single source of truth in `config.md`, then fix references.

3) Error-handling section references are stale or invalid.
- Evidence:
  - Orchestrator references `error-handling.md Section 7.x`. `docs/design/agents/orchestrator.md:116`, `docs/design/agents/orchestrator.md:128`, `docs/design/agents/orchestrator.md:163`, `docs/design/agents/orchestrator.md:213`, `docs/design/agents/orchestrator.md:272`, `docs/design/agents/orchestrator.md:306`, `docs/design/agents/orchestrator.md:324`, `docs/design/agents/orchestrator.md:337`
  - Implementation checklist references `Section 7.1`. `docs/design/implementation-checklist.md:22`
  - The error-handling TOC only has sections 1-5. `docs/design/error-handling.md:9-15`
- Impact: Engineers cannot follow referenced sections; high risk of incorrect handling logic.
- Recommendation: Reconcile section numbering or replace references with direct anchors that exist.

4) Section generation is underspecified relative to the 10-section output spec.
- Evidence:
  - Guideline defines Sections 1-10. `docs/design/auto-draft-guideline.md:11-33`
  - Workflow claims "10 section markdown files" after Phase 3-2. `docs/design/workflow.md:81`
  - `/auto-draft` skill output structure lists only sections 05-08. `.claude/skills/auto-draft/SKILL.md:192-199`
  - `draftify-ppt` expects the 10-section format. `.claude/skills/draftify-ppt/SKILL.md:10`
- Impact: Ambiguity over who generates sections 01-04 and 09-10; PPT generator may lack inputs or create inconsistent defaults.
- Recommendation: Explicitly define which component generates sections 01-04 and 09-10 (likely `draftify-ppt`), and remove the "10 markdown files" claim or add generators.

5) Policy category code length conflicts between schema and guideline (2-5 vs 3-4).
- Evidence:
  - Guideline allows 2-5 chars. `docs/design/auto-draft-guideline.md:244`
  - Schema restricts to 3-4 chars. `docs/design/schemas.md:317`
- Impact: Validators and generators will disagree on valid IDs.
- Recommendation: Pick one range and update schema, validator, and generators to match.

6) Element ID type list differs between guideline and schema.
- Evidence:
  - Guideline types include NAV/CARD/LIST. `docs/design/auto-draft-guideline.md:314-322`
  - Schema types include LINK but not NAV/CARD/LIST. `docs/design/schemas.md:353-359`
- Impact: Schema validation can fail for legitimate guideline output.
- Recommendation: Merge the lists or define a superset in schema.

7) Record-mode crawling-result structure diverges from the schema.
- Evidence:
  - Record mode uses `metadata.total_screens` and `manual_capture`, and places `crawling_strategy` at root. `docs/design/record-mode-design.md:280-299`
  - Schema expects `metadata.total_pages` and `metadata.crawling_strategy`. `docs/design/schemas.md:28-33`
- Impact: input-analyzer may reject or misinterpret record-mode outputs.
- Recommendation: Conform record-mode output to the schema or update schema to include record-mode variants.

8) Path conventions for screenshots and crawling results are inconsistent.
- Evidence:
  - Record mode writes `outputs/screenshots/...` and `outputs/analysis/crawling-result.json`. `docs/design/record-mode-design.md:221`, `docs/design/record-mode-design.md:793`
  - Schema examples use `outputs/screenshots/...`. `docs/design/schemas.md:43`
  - Project structure expects `outputs/<projectName>/...`. `docs/design/project-management.md:13-20`
- Impact: File lookups will fail when code assumes project-scoped paths.
- Recommendation: Standardize all examples and code paths to `outputs/{projectName}/...` (or define a consistent relative-path convention).

9) `--readme` option is defined but not passed into the orchestrator config.
- Evidence:
  - Option listed. `.claude/skills/auto-draft/SKILL.md:33`
  - Config object omits `readme`. `.claude/skills/auto-draft/SKILL.md:101-111`
  - Orchestrator expects `readme.md`. `docs/design/agents/orchestrator.md:149`
- Impact: README input is silently dropped.
- Recommendation: Add `readme` to the config passed to the orchestrator and document its copy behavior.

### Minor

10) Record recovery file name is inconsistent.
- Evidence:
  - Edge cases mention `.record-recovery.json`. `docs/design/edge-cases.md:56`
  - Config and other docs use `~/.draftify/record-sessions/{url-hash}.recovery.json`. `docs/design/config.md:83`, `docs/design/edge-cases.md:84`
- Impact: Confusing operational guidance.
- Recommendation: Remove the legacy filename reference or alias it explicitly.

11) `input-analyzer` expects `outputs/{projectName}/source-dir/`, but Phase 1 copy steps do not mention copying `sourceDir`.
- Evidence:
  - Orchestrator passes `outputs/{projectName}/source-dir/` as input. `docs/design/agents/orchestrator.md:150`
  - Phase 1 steps mention copying PRD/SDD/README but not source directory. `docs/design/agents/orchestrator.md:123-126`
- Impact: Source analysis may run on a non-existent path.
- Recommendation: Decide whether to copy `sourceDir` into outputs or pass the original path consistently.

---

If you want, I can propose a concrete patch list to resolve the above conflicts.
