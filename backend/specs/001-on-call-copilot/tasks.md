---
description: "Task list for On-Call Copilot implementation"
---

# Tasks: On-Call Copilot

**Input**: Design documents from `specs/001-on-call-copilot/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Integration and Eval tests are included as requested by the technical specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- Single project structure per plan.md

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure (app/agents, scripts/fixtures, scripts/golden_outputs, tests)
- [X] T002 Initialize Python project with dependencies in requirements.txt
- [X] T003 [P] Configure ruff for linting and formatting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define input and agent output JSON schemas in app/schemas.py
- [X] T005 [P] Implement Gemini client with schema enforcement and retries in app/gemini_client.py
- [X] T006 [P] Implement Braintrust initialization and tracing wrapper in app/braintrust_integration.py
- [X] T007 [P] Implement regex-based secret redaction pipeline in app/telemetry.py
- [X] T008 [P] Implement structured logging with correlation IDs in app/telemetry.py
- [X] T009 Implement LangGraph StateGraph, fan_out, and merge_node in app/graph.py
- [X] T010 Implement FastAPI entry point with validation and redaction in app/main.py

**Checkpoint**: Foundation ready - agent implementation can now begin in parallel

---

## Phase 3: User Story 1 - Incident Triage & Analysis (Priority: P1) 🎯 MVP

**Goal**: Automatically analyze incidents for root causes and remediation steps.

**Independent Test**: Submit incident to `/invoke` and verify `suspected_root_causes` and `immediate_actions` are populated.

### Tests for User Story 1
- [X] T011 [P] [US1] Integration test for Triage Agent node in tests/test_agents.py
- [X] T012 [P] [US1] Braintrust Eval test for Triage Agent against golden set in tests/test_evals.py

### Implementation for User Story 1
- [X] T013 [P] [US1] Implement Triage Agent node and instructions in app/agents/triage.py
- [X] T014 [US1] Register Triage Agent in LangGraph StateGraph in app/graph.py

**Checkpoint**: User Story 1 (Triage) functional and testable independently.

---

## Phase 4: User Story 2 - Stakeholder Communications (Priority: P2)

**Goal**: Generate Slack and stakeholder-appropriate updates.

**Independent Test**: Submit incident and verify `comms` section contains `slack_update` and `stakeholder_update`.

### Tests for User Story 2
- [X] T015 [P] [US2] Integration test for Summary and Comms agents in tests/test_agents.py

### Implementation for User Story 2
- [X] T016 [P] [US2] Implement Summary Agent node and instructions in app/agents/summary.py
- [X] T017 [P] [US2] Implement Comms Agent node and instructions in app/agents/comms.py
- [X] T018 [US2] Register Summary and Comms Agents in LangGraph StateGraph in app/graph.py

**Checkpoint**: User Stories 1 and 2 functional and testable independently.

---

## Phase 5: User Story 3 - Post-Incident Reporting (Priority: P3)

**Goal**: Generate draft Post-Incident Reports (PIR).

**Independent Test**: Submit incident and verify `post_incident_report` contains `timeline` and `prevention_actions`.

### Tests for User Story 3
- [X] T019 [P] [US3] Integration test for PIR Agent node in tests/test_agents.py

### Implementation for User Story 3
- [X] T020 [P] [US3] Implement PIR Agent node and instructions in app/agents/pir.py
- [X] T021 [US3] Register PIR Agent in LangGraph StateGraph in app/graph.py

**Checkpoint**: All user stories functional and testable independently.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T022 [P] Create CLI test tool for single incident invocation in scripts/invoke.py
- [X] T023 [P] Create scenario test script for batch scenario runs in scripts/run_scenarios.py
- [X] T024 [P] Create mock mode fixtures for offline testing in scripts/fixtures/
- [X] T025 [P] Populate golden set for evals in scripts/golden_outputs/
- [X] T026 Update README.md with final architecture and usage examples
- [X] T027 Run quickstart.md validation for local setup

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 & 2**: Prerequisites for everything else.
- **Phase 3 (MVP)**: Can be implemented first to deliver core value.
- **Phase 4 & 5**: Can proceed in parallel after Phase 2 is done.
- **Phase 6**: Final stabilization and documentation.

### User Story Dependencies
- All stories depend on the Foundation (Phase 2).
- Stories are otherwise independent and can be implemented/tested in any order (though priority P1 is recommended first).

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Setup + Foundational (Phases 1-2)
2. Complete User Story 1 (Phase 3)
3. **STOP and VALIDATE**: Test Triage functionality independently.

### Incremental Delivery
1. Foundation -> Core logic ready.
2. User Story 1 -> MVP: Triage analysis.
3. User Story 2 -> Feature: Stakeholder comms.
4. User Story 3 -> Feature: PIR drafting.
