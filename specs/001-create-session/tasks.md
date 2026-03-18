# Tasks: 001 — Create Session

**Input**: Design documents from `/specs/001-create-session/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Included — the spec defines 12 test scenarios covering all happy-path and error-path cases.

**Organization**: This feature contains a single user story (facilitator creates a session). Tasks are grouped by phase to enable incremental implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and ES module configuration

- [ ] T001 Initialize Node.js project with `"type": "module"` in package.json
- [ ] T002 Install Express 4.x as production dependency via `npm install express`
- [ ] T003 Install supertest as dev dependency via `npm install --save-dev supertest`
- [ ] T004 Add `"start"` and `"test"` scripts to package.json (`node src/server.js` and `node --test`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Express app skeleton and JSON envelope convention that all routes depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create Express app with JSON body parsing middleware in src/server.js
- [ ] T006 Add `PORT` environment variable support and `app.listen()` in src/server.js
- [ ] T007 [P] Establish JSON envelope convention: `{ success: true, data }` and `{ success: false, error }` response helpers in src/server.js

**Checkpoint**: Express app is running, accepts JSON requests, and serves the standard envelope.

---

## Phase 3: User Story 1 — Create Session (Priority: P1) 🎯 MVP

**Goal**: A facilitator creates a new voting session by providing a title and list of items. The service validates input, generates a unique 6-character session code, stores the session in memory, and returns the session data.

**Independent Test**: `curl -X POST http://localhost:3000/api/sessions -H "Content-Type: application/json" -d '{"title":"Test","items":["A","B","C"]}'` returns 200 with `{ success: true, data: { code, title, items } }`.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T008 [P] [US1] Create test file with `describe` block and `beforeEach` calling `clearSessions()` in tests/sessions.test.js
- [ ] T009 [P] [US1] Write happy-path tests: valid title + 4 items (200), exactly 2 items min boundary (200), exactly 20 items max boundary (200) in tests/sessions.test.js
- [ ] T010 [P] [US1] Write validation error tests: missing title (400), empty title (400), missing items (400), items not an array (400) in tests/sessions.test.js
- [ ] T011 [P] [US1] Write validation error tests: only 1 item (400), 21 items (400), empty-string item (400) in tests/sessions.test.js
- [ ] T012 [P] [US1] Write format tests: session code matches `/^[A-Z0-9]{6}$/` (200), title and items are trimmed (200) in tests/sessions.test.js

### Implementation for User Story 1

- [ ] T013 [US1] Create in-memory `Map` storage and `clearSessions()` test helper in src/sessions.js
- [ ] T014 [US1] Implement `generateCode()` using `node:crypto.randomBytes(6)` with collision-retry loop in src/sessions.js
- [ ] T015 [US1] Implement `createSession(title, items)` with validation (title required, items array, 2–20 items, each non-empty string), trimming, code generation, and Map storage in src/sessions.js
- [ ] T016 [US1] Export `getSession(code)` lookup function in src/sessions.js
- [ ] T017 [US1] Mount `POST /api/sessions` route in src/server.js: call `createSession()`, map result to JSON envelope (200 success / 400 error)
- [ ] T018 [US1] Export `app` from src/server.js for supertest usage in tests

**Checkpoint**: All 12 tests pass. `POST /api/sessions` validates input, generates a unique code, stores the session, and returns the standard JSON envelope.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Verification and documentation

- [ ] T019 Run full test suite (`npm test`) and confirm all 12 tests pass
- [ ] T020 [P] Verify quickstart.md curl examples work against running server
- [ ] T021 [P] Verify API contract in contracts/create-session.md matches implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion
- **Polish (Phase 4)**: Depends on User Story 1 being complete

### Within User Story 1

- Tests (T008–T012) MUST be written and FAIL before implementation
- Storage and code generation (T013, T014) before service function (T015)
- Service function (T015, T016) before route handler (T017)
- App export (T018) needed for tests to import the Express app

### Parallel Opportunities

- All Setup tasks (T001–T004) are sequential (each depends on package.json)
- Foundational tasks T005–T006 are sequential; T007 can run in parallel with T006
- All test-writing tasks (T008–T012) can run in parallel (same file, but independent test blocks)
- Storage (T013) and code generation (T014) cannot parallelize — both in src/sessions.js
- Polish tasks T020, T021 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Write all test blocks in parallel (T008–T012):
Task: "Create test file with describe block and beforeEach in tests/sessions.test.js"
Task: "Write happy-path tests in tests/sessions.test.js"
Task: "Write validation error tests (title, items) in tests/sessions.test.js"
Task: "Write validation error tests (count, empty) in tests/sessions.test.js"
Task: "Write format tests (code pattern, trimming) in tests/sessions.test.js"

# Then implement sequentially:
Task: "Create Map storage and clearSessions() in src/sessions.js"
Task: "Implement generateCode() in src/sessions.js"
Task: "Implement createSession() in src/sessions.js"
Task: "Mount POST /api/sessions route in src/server.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (project init, dependencies)
2. Complete Phase 2: Foundational (Express skeleton, JSON envelope)
3. Complete Phase 3: User Story 1 (tests → storage → service → route)
4. **STOP and VALIDATE**: Run `npm test` — all 12 tests must pass
5. Run quickstart.md curl example to verify end-to-end

### Single-Story Feature

This feature contains only one user story. The full implementation is the MVP:
- `POST /api/sessions` accepts title + items
- Validates all input per spec rules
- Generates unique 6-char alphanumeric code via `node:crypto`
- Stores session in memory `Map`
- Returns `{ success: true, data: { code, title, items } }`

---

## Notes

- [P] tasks = different files or independent blocks, no dependencies
- [US1] = the single user story: "Facilitator creates a session"
- All validation lives in `createSession()` in src/sessions.js — not in the route handler
- Service returns `{ data }` on success, `{ error, status }` on failure — never throws
- `clearSessions()` is exported solely for test isolation
- Code generation uses `crypto.randomBytes(6)` mapped to 36-char alphabet with collision retry
