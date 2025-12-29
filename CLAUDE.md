# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Draftify** is an internal productivity tool that automatically generates planning documentation (기획서) from mockups/MVP sites and project artifacts.

**Purpose**: Transform existing deliverables (PRD, SDD, mockups, code, screenshots) into structured planning documents (정책정의서 + 화면정의서) using AI-powered analysis and generation.

**Status**: Design phase - core implementation pending.

---

## Architecture

### System Design Pattern: Skill + Main Agent + Sub-Agents

```
/auto-draft (Skill - thin wrapper)
  ↓ (Task tool)
auto-draft-orchestrator (Main Agent - workflow control)
  ↓ (Task tool)
Sub-Agents (specialized workers)
  - input-analyzer
  - policy-generator
  - glossary-generator
  - screen-generator
  - process-generator
  - quality-validator
```

**Key Principles**:
1. **Skill Layer**: Minimal CLI interface, argument validation only
2. **Main Agent**: Independent context, orchestrates Phase 1-4 workflow
3. **Sub-Agents**: Single responsibility, context isolation, parallel execution where possible
4. **Data Flow**: Phase-based sequential pipeline with intermediate file outputs

### Workflow Phases

1. **Phase 1**: Input collection & automatic crawling
   - Chrome DevTools MCP for site crawling
   - Tier-based link discovery (DOM → heuristic → manual)
   - Screenshot capture

2. **Phase 2**: Analysis
   - input-analyzer consolidates all inputs into `analyzed-structure.json`

3. **Phase 3-1**: Prerequisite section generation (**parallel**)
   - policy-generator → `policy-definition.md`
   - glossary-generator → `glossary.md`

4. **Phase 3-2**: Dependent section generation (sequential: screen → process)
   - screen-generator → `screen-definition.md`
   - process-generator → `process-flow.md` (screen-definition.md 참조)

5. **Phase 3.5**: Quality validation
   - quality-validator checks against `docs/design/auto-draft-guideline.md`

6. **Phase 4**: Document generation
   - Separate `/ppt-generator` skill (not yet implemented)

---

## Key Design Documents

### Documentation Structure

**Design documents are now modularized** for better context efficiency. Start with the navigation guide:

**📍 [docs/design/design-index.md](./docs/design/design-index.md)** - Complete navigation map for all design docs

### Must Read First (Core Documents)

1. **[docs/design/architecture.md](./docs/design/architecture.md)** - System architecture
   - 4-layer architecture (User → Skill → Orchestration → Execution → Data)
   - Skill + Main Agent + Sub-Agents pattern
   - Component relationships and data flow

2. **[docs/design/workflow.md](./docs/design/workflow.md)** - Phase 1-4 workflow
   - Data flow through all phases
   - Sequential vs parallel execution points
   - Dependency graph

3. **[docs/design/error-handling.md](./docs/design/error-handling.md)** - Error strategy
   - Skill layer error handling
   - Main Agent orchestration logic
   - Retry strategies and timeout settings
   - Minimum success criteria

4. **[docs/design/auto-draft-guideline.md](./docs/design/auto-draft-guideline.md)** - Output specification
   - 10 standard sections for generated documents
   - Required fields, writing standards, ID schemes (POL-*, SCR-*)
   - All agents reference this for output formatting

5. **[docs/requirements/prd.md](./docs/requirements/prd.md)** - Product requirements
   - Input types, output formats, success criteria
   - Non-functional requirements (30min timeout, partial success handling)

### Implementation Guides

- **[docs/design/crawling-strategy.md](./docs/design/crawling-strategy.md)** - Phase 1 crawling (Tier 1-3, Record mode)
- **[docs/design/schemas.md](./docs/design/schemas.md)** - JSON data schemas (crawling-result, analyzed-structure)
- **[docs/design/implementation-checklist.md](./docs/design/implementation-checklist.md)** - Step-by-step implementation roadmap
- **[docs/design/edge-cases.md](./docs/design/edge-cases.md)** - Edge case handling (14 scenarios)

### Agent Prompts

All agent prompts are in **[docs/design/agents/](./docs/design/agents/)**:
- **orchestrator.md** - Main Agent (Phase 1-4 control)
- **input-analyzer.md** - Phase 2 analysis
- **policy-generator.md**, **glossary-generator.md** - Phase 3-1
- **screen-generator.md**, **process-generator.md** - Phase 3-2
- **quality-validator.md** - Phase 3.5

### Reference Documents

- **[docs/design/project-management.md](./docs/design/project-management.md)** - Output directory structure, project naming
- **[docs/design/tech-stack.md](./docs/design/tech-stack.md)** - Technology choices and rationale

### Legacy Archive

- **docs/archive/service-design.md** - Original monolithic design doc (for reference only)

### Implementation Priority

Per `docs/design/implementation-checklist.md`:
1. Chrome DevTools MCP setup
2. `/auto-draft` Skill (thin wrapper)
3. `auto-draft-orchestrator` Main Agent prompt
4. Sub-agent prompts (input-analyzer first, then generators)
5. Phase 1 crawling implementation (Tier 1 → 2B → Record mode)
6. `/ppt-generator` skill (separate)

---

## Critical Design Decisions

### Why Skill + Main Agent (Not Skill Only)

**Problem**: Direct Skill implementation causes:
- Context explosion (50-page crawl data in main conversation)
- Token limit issues
- Poor error recovery
- No reusability

**Solution**:
- Skill = ~100 lines, argument validation, calls Main Agent via Task tool
- Main Agent = independent 35min context, Phase 1-4 control, sub-agent lifecycle
- Rationale documented in modularized design docs (see `docs/design/design-index.md`)

### Agent Dependencies

**Phase 3 Sequential Execution Required**:
- Phase 3-1 generates policy IDs (POL-001...)
- Phase 3-2 (screen) generates screen IDs (SCR-001...)
- Phase 3-2 (process) references both policy IDs and screen IDs
- 전체 순차 실행: 3-1 → screen → process

### Error Handling Philosophy

- **input-analyzer failure**: Abort entire workflow (mandatory)
- **policy-generator failure**: Create empty section with title, continue
- **validation FAIL**: Continue to Phase 4, include warnings in output
- Minimum success criteria: 1 phase success = partial delivery acceptable

---

## Data Schemas

### Input Configuration
```typescript
{
  url: string,              // Required: MVP site URL
  prd?: string,             // Optional: PRD file path
  sdd?: string,             // Optional: SDD file path
  screenshots?: string,     // Optional: screenshot directory
  sourceDir?: string,       // Optional: local source code
  urls?: string,            // Optional: manual URL list
  maxDepth: number,         // Default: 5
  maxPages: number          // Default: 50
}
```

### analyzed-structure.json
See `docs/design/schemas.md` for complete schema including:
- `project`: metadata
- `glossary`: term definitions
- `policies`: rules with POL-* IDs
- `screens`: UI definitions with SCR-* IDs
- `flows`: process steps

### Output Directory Structure
```
outputs/<project-name>/
├─ screenshots/
├─ analysis/
│  ├─ crawling-result.json
│  └─ analyzed-structure.json
├─ sections/
│  ├─ 06-policy-definition.md
│  ├─ 08-screen-definition.md
│  └─ ... (per docs/design/auto-draft-guideline.md)
├─ validation/
│  └─ validation-report.md
└─ final-draft.pptx (or .html fallback)
```

---

## Implementation Guidelines

### 🚨 Critical: Design Document Location

**ALL implementation MUST reference `docs/design/` ONLY.**

- ✅ Use: `docs/design/*.md` and `docs/design/agents/*.md`
- ❌ NEVER use: `docs/archive/*` (outdated legacy documents)

If you accidentally open an archive document, STOP immediately and go to `docs/design/design-index.md`.

---

### Agent Prompts

When creating sub-agent prompts:
1. Reference `docs/design/auto-draft-guideline.md` Section X for output format
2. Reference `analyzed-structure.json` schema from `docs/design/schemas.md`
3. Include retry strategy from `docs/design/error-handling.md` Section 7.3
4. Specify tools: Read, Write, Grep, Glob (no Bash unless MCP interaction)
5. Define clear success/failure criteria

### Crawling Strategy

**Tier 1 (reliable)**:
- `<a href>`, `sitemap.xml`, React/Next.js `<Link>` tags

**Tier 2 (heuristic)**:
- onClick handlers with string paths
- Source code route definitions (if `--source-dir` provided)

**Tier 3 (manual)**:
- `--urls urls.txt` for dynamic routes, auth-required pages

**Critical**: URL normalization (`/home` = `/home/` = `/home?`), BFS traversal, priority scoring when 50-page limit hit.

### Timeout Budget (35min total)
- Phase 1 crawling: 10min (20 pages 기준, 조기 종료 가능)
- Phase 2 input-analyzer: 5min
- Phase 3-1 generators (**parallel**): policy 3min ∥ glossary 2min = **3min**
- Phase 3-2 generators (sequential): screen 3min → process 2min = **5min**
- Phase 3.5 quality-validator: 2min
- Phase 4 ppt-generator: **10min**

> **Note**: Phase 1 조기 종료 조건: 최소 10페이지 확보 + 10분 경과

---

## Testing & Validation

### POC Approach
1. Simple Todo MVP (localhost:3000)
2. Limited to 10 pages (`--max-pages 10`)
3. Validate Phase 1 only first (crawling-result.json + screenshots)
4. Then incrementally add Phase 2-4

### Quality Checks
- All section .md files against `docs/design/auto-draft-guideline.md`
- Policy ID references (POL-*) consistent across files
- Screen ID references (SCR-*) consistent across files
- No broken image links in screen definitions

---

## Architectural Patterns Applied

From `.claude/agents/agent-architect.md`:

**Orchestrator-Worker**: Main Agent orchestrates, sub-agents are workers
**Prompt Chain**: Phase 1 → 2 → 3-1 → 3-2(screen) → 3-2(process) → 3.5 → 4 (sequential)
**Evaluator Pattern**: quality-validator assesses output, but no auto-optimization loop (manual user iteration)

**Not Applied**:
- Routing (all inputs follow same Phase 1-4 path)

**Partial Parallelization**:
- Phase 3-1: policy + glossary 병렬 실행 (상호 의존성 없음)
- Phase 3-2: screen → process 순차 실행 (의존성 있음)

---

## Common Pitfalls

1. **Do not implement /auto-draft as Skill-only** - will exceed context limits
2. **Phase 3-1 can run in parallel** (policy + glossary have no mutual dependencies)
3. **Do not parallelize Phase 3-2 (screen/process)** - process-generator requires screen-definition.md
4. **Do not assume SPA routing auto-detection works perfectly** - always support manual URL input
5. **Do not use Git MCP** - removed from design, use direct source code reading instead
6. **Do not create validation auto-retry loops** - validation FAIL continues to Phase 4 with warnings
7. **NEVER read docs/archive/ during implementation** - archive contains OUTDATED legacy documents for reference only. ALL current design specs are in docs/design/. Reading archive will lead to implementing obsolete designs.

---

## Next Steps for Implementation

See `docs/design/implementation-checklist.md` for full checklist. Priority order:

1. Verify Chrome DevTools MCP availability and capabilities
2. Create `.claude/skills/auto-draft/skill.md` (thin wrapper)
3. Create `.claude/agents/auto-draft-orchestrator/agent.md` (main logic)
4. Implement Phase 1 crawling first (validate separately)
5. Create sub-agent prompts following dependency order: input-analyzer → policy/glossary → screen/process → validator

---

## References

- **Design rationale**: Git commit history and conversation context
- **Output standards**: `docs/design/auto-draft-guideline.md` (10 sections, ID schemes)
- **Technical specs**: See `docs/design/design-index.md` for complete documentation map (architecture, workflow, error-handling, schemas, agents)
- **Business context**: `docs/requirements/prd.md` (problem definition, success criteria)
