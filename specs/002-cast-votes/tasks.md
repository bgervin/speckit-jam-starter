# Tasks: 002 — Cast Votes

**Input**: Design documents from `/specs/002-cast-votes/`
**Prerequisites**: plan.md (required), spec.md (required), data-model.md, research.md, quickstart.md, contracts/cast-vote.md

**Tests**: Included — the spec explicitly defines 18 test scenarios.

**Organization**: Single user story (Cast Vote) with setup, foundational, implementation, and polish phases.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project prerequisites — no new initialization needed (project structure established in 001-create-session)

- [ ] T001 Verify Node.js ≥ 18, `"type": "module"` in `package.json`, and Express 4.x + supertest dependencies are installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Expose cross-module session lookup so the votes module can retrieve sessions by code

**⚠️ CRITICAL**: Vote casting cannot work until the session lookup function is available

- [ ] T002 Export `getSession(code)` function from `src/sessions.js` that returns the session object from the in-memory `Map` or `undefined` if not found

**Checkpoint**: Foundation ready — `getSession` is importable by the votes module

---

## Phase 3: User Story 1 — Cast Vote (Priority: P1) 🎯 MVP

**Goal**: A participant joins a session by code, provides their name, and distributes exactly $100 across the session's items. The system validates all input and prevents duplicate voters.

**Independent Test**: `curl -X POST http://localhost:3000/api/sessions/{code}/votes -H "Content-Type: application/json" -d '{"voterName":"Alice","allocations":{"Search":40,"Dark Mode":25,"Export CSV":25,"Notifications":10}}'` returns `200` with `{ success: true, data: { voterName, allocations } }`

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T003 [US1] Create test scaffolding with `createTestSession()` helper (creates session via HTTP), `validAllocations()` helper, and `clearSessions()` in `beforeEach` — plus success-path tests #1–#3 (valid vote, zero allocations, all-to-one-item) in `tests/votes.test.js`
- [ ] T004 [US1] Add validation error tests #4–#8 (session not found → 404; missing voterName → 400; empty voterName → 400; missing allocations → 400; allocations is array → 400) in `tests/votes.test.js`
- [ ] T005 [US1] Add validation error tests #9–#14 (extra allocation keys → 400; missing allocation key → 400; negative value → 400; non-integer value → 400; sum < 100 → 400; sum > 100 → 400) in `tests/votes.test.js`
- [ ] T006 [US1] Add duplicate voter and edge-case tests #15–#18 (duplicate exact name → 400; duplicate different casing → 400; trimmed voter name stored → 200; two different voters both succeed → 200) in `tests/votes.test.js`

### Implementation for User Story 1

- [ ] T007 [P] [US1] Implement `castVote(code, voterName, allocations)` in `src/votes.js` — import `getSession` from `./sessions.js`; validate in order: session existence (404), voter name required (400), allocations is plain object (400), keys match session items (400), values are non-negative integers (400), sum equals 100 (400), no duplicate voter name case-insensitive (400); append `{ voterName: trimmed, allocations }` to `session.votes`; return `{ data: vote }` on success or `{ error, status }` on failure
- [ ] T008 [P] [US1] Mount `POST /api/sessions/:code/votes` route in `src/server.js` — extract `voterName` and `allocations` from `req.body`, call `castVote(req.params.code, voterName, allocations)`, return `{ success: true, data }` on success or `{ success: false, error }` with appropriate status on failure

**Checkpoint**: User Story 1 is fully functional — all 18 tests pass, vote endpoint accepts and validates votes

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verify end-to-end correctness and documentation

- [ ] T009 Run full test suite (`npm test`) and verify all 30 tests pass (12 session tests + 18 vote tests)
- [ ] T010 [P] Validate `specs/002-cast-votes/quickstart.md` scenarios against running server (`npm start`)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify prerequisites only
- **Foundational (Phase 2)**: Depends on Setup — exports `getSession` for cross-module use
- **User Story 1 (Phase 3)**: Depends on Foundational — uses `getSession` in votes module
- **Polish (Phase 4)**: Depends on User Story 1 completion — runs full validation

### Within User Story 1

- Tests (T003–T006) MUST be written first and FAIL before implementation
- T003 → T004 → T005 → T006: Sequential (same file `tests/votes.test.js`)
- T007 and T008: Parallel (different files `src/votes.js` and `src/server.js`)
- T007 + T008 complete → all 18 tests should pass

### Parallel Opportunities

- T007 and T008 can run in parallel (different files, independent code)
- T009 and T010 can run in parallel (test suite vs. manual validation)

---

## Parallel Example: User Story 1

```bash
# After tests T003–T006 are written and failing:

# Launch implementation tasks in parallel:
Task T007: "Implement castVote(code, voterName, allocations) in src/votes.js"
Task T008: "Mount POST /api/sessions/:code/votes route in src/server.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Verify prerequisites
2. Complete Phase 2: Export `getSession` from sessions module
3. Complete Phase 3: Write tests → implement `castVote` → mount route
4. **STOP and VALIDATE**: Run `npm test` — all 30 tests (12 + 18) must pass
5. Manual smoke test with `curl` per quickstart.md

### Key Design Decisions (from research.md)

- **Cross-module lookup**: Import `getSession` — don't expose the `sessions` Map directly
- **Vote storage**: Plain objects in `session.votes[]` — no separate collection, no IDs
- **Validation order**: Fixed sequence matching the spec (session → name → type → keys → values → sum → duplicate)
- **Duplicate prevention**: Case-insensitive comparison via `.toLowerCase()` after `.trim()`
- **No new dependencies**: Pure Node.js + Express — zero additions to `package.json`

---

## Notes

- [P] tasks = different files, no dependencies
- [US1] label maps task to the Cast Vote user story
- The spec defines 18 test scenarios — all are included in tasks T003–T006
- Validation order in `castVote` must match the spec exactly (first failure short-circuits)
- `voterName` is trimmed before storage and before duplicate comparison
- Commit after each task or logical group
- Stop at checkpoint to validate story independently
