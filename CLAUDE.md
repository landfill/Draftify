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
  ↓ (Task tool)c
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

3. **Phase 3-1**: Prerequisite section generation (sequential)
   - policy-generator → `policy-definition.md`
   - glossary-generator → `glossary.md`

4. **Phase 3-2**: Dependent section generation (parallel)
   - screen-generator → `screen-definition.md`
   - process-generator → `process-flow.md`

5. **Phase 3.5**: Quality validation
   - quality-validator checks against `auto-draft-guideline.md`

6. **Phase 4**: Document generation
   - Separate `/ppt-generator` skill (not yet implemented)

---

## Key Design Documents

### Must Read First

1. **service-design.md** - Complete system architecture
   - Section 2: System Architecture (Skill + Agent layers)
   - Section 3: Agent Structure (hierarchy and responsibilities)
   - Section 7: Error Handling & Workflow Control (orchestration logic)
   - Appendix C: Implementation Checklist

2. **auto-draft-guideline.md** - Output specification
   - 10 standard sections for generated documents
   - Required fields, writing standards, ID schemes (POL-001, SCR-001)
   - All agents reference this for output formatting

3. **prd.md** - Product requirements
   - Input types, output formats, success criteria
   - Non-functional requirements (30min timeout, partial success handling)

### Implementation Priority

Per `service-design.md` Appendix C:
1. Chrome DevTools MCP setup
2. `/auto-draft` Skill (thin wrapper)
3. `auto-draft-orchestrator` Main Agent prompt
4. Sub-agent prompts (input-analyzer first, then generators)
5. Phase 1 crawling implementation
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
- Main Agent = independent 30min context, Phase 1-4 control, sub-agent lifecycle
- Rationale documented in conversation leading to final `service-design.md` revision

### Agent Dependencies

**Phase 3 Split Required**:
- Phase 3-1 generates policy IDs (POL-001...)
- Phase 3-2 references those IDs in screen/process definitions
- Cannot parallelize across 3-1 and 3-2

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
See `service-design.md` Appendix B for complete schema including:
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
│  └─ ... (per auto-draft-guideline.md)
├─ validation/
│  └─ validation-report.md
└─ final-draft.pptx (or .html fallback)
```

---

## Implementation Guidelines

### Agent Prompts

When creating sub-agent prompts:
1. Reference `auto-draft-guideline.md` Section X for output format
2. Reference `analyzed-structure.json` schema from `service-design.md` Appendix B
3. Include retry strategy from Section 7.3
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

### Timeout Budget (30min total)
- Phase 1 crawling: 25min max (50 pages × 30sec)
- input-analyzer: 10min
- policy/screen/process generators: 5min each
- glossary-generator: 3min
- quality-validator: 5min
- ppt-generator: 3min

---

## Testing & Validation

### POC Approach
1. Simple Todo MVP (localhost:3000)
2. Limited to 10 pages (`--max-pages 10`)
3. Validate Phase 1 only first (crawling-result.json + screenshots)
4. Then incrementally add Phase 2-4

### Quality Checks
- All section .md files against `auto-draft-guideline.md`
- Policy ID references (POL-*) consistent across files
- Screen ID references (SCR-*) consistent across files
- No broken image links in screen definitions

---

## Architectural Patterns Applied

From `.claude/agents/agent-architect.md`:

**Orchestrator-Worker**: Main Agent orchestrates, sub-agents are workers
**Prompt Chain**: Phase 1 → 2 → 3-1 → 3-2 → 3.5 → 4 (sequential data transformation)
**Parallelization**: Phase 3-2 (screen + process generators run concurrently)
**Evaluator Pattern**: quality-validator assesses output, but no auto-optimization loop (manual user iteration)

**Not Applied**: Routing (all inputs follow same Phase 1-4 path)

---

## Common Pitfalls

1. **Do not implement /auto-draft as Skill-only** - will exceed context limits
2. **Do not parallelize Phase 3-1 and 3-2** - breaks policy ID dependencies
3. **Do not assume SPA routing auto-detection works perfectly** - always support manual URL input
4. **Do not use Git MCP** - removed from design, use direct source code reading instead
5. **Do not create validation auto-retry loops** - validation FAIL continues to Phase 4 with warnings

---

## Next Steps for Implementation

See `service-design.md` Appendix C for full checklist. Priority order:

1. Verify Chrome DevTools MCP availability and capabilities
2. Create `.claude/skills/auto-draft/skill.md` (thin wrapper)
3. Create `.claude/agents/auto-draft-orchestrator/agent.md` (main logic)
4. Implement Phase 1 crawling first (validate separately)
5. Create sub-agent prompts following dependency order: input-analyzer → policy/glossary → screen/process → validator

---

## References

- **Design rationale**: Git commit history and conversation context
- **Output standards**: `auto-draft-guideline.md` (10 sections, ID schemes)
- **Technical specs**: `service-design.md` (architecture, agents, error handling, schemas)
- **Business context**: `prd.md` (problem definition, success criteria)
