# Draftify Agent Prompts

This directory contains prompts for all Draftify agents.

## Agent List

### Main Agent
- **[orchestrator.md](./orchestrator.md)**: auto-draft-orchestrator
  - Orchestrates Phase 1-4 workflow
  - Manages sub-agent lifecycle
  - Handles errors and retries

### Sub-Agents (Phase 2-3.5)
1. **[input-analyzer.md](./input-analyzer.md)**: Phase 2
   - Consolidates crawling results + documents → analyzed-structure.json

2. **[policy-generator.md](./policy-generator.md)**: Phase 3-1
   - Generates policy definitions (06-policy-definition.md)
   - Assigns policy IDs (POL-*)

3. **[glossary-generator.md](./glossary-generator.md)**: Phase 3-1
   - Generates glossary (05-glossary.md)
   - No ID assignment (alphabetical sort)

4. **[screen-generator.md](./screen-generator.md)**: Phase 3-2
   - Generates screen definitions (08-screen-definition.md)
   - Assigns screen IDs (SCR-*)
   - References policy IDs

5. **[process-generator.md](./process-generator.md)**: Phase 3-2
   - Generates process flows (07-process-flow.md)
   - References screen IDs and policy IDs

6. **[quality-validator.md](./quality-validator.md)**: Phase 3.5
   - Validates all generated sections
   - Produces PASS/FAIL report

## Usage

Each agent prompt file follows the standard structure:
1. Role (역할 정의)
2. Input Specification (입력 명세)
3. Output Specification (출력 명세)
4. Processing Logic (처리 로직)
5. Quality Criteria (품질 기준)
6. Error Handling (에러 핸들링)
7. Tools Usage (도구 사용)
8. Examples (예시)

## References

- **Workflow**: [workflow.md](../workflow.md)
- **Error Handling**: [error-handling.md](../error-handling.md)
- **Data Schemas**: [schemas.md](../schemas.md)
- **Output Standards**: [auto-draft-guideline.md](../auto-draft-guideline.md)
