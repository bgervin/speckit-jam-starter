# Implementation Plan: 002 — Cast Votes

**Branch**: `master` | **Date**: 2026-03-18 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-cast-votes/spec.md`

**Note**: This plan documents a feature that is already implemented and tested.

## Summary

A participant joins an existing voting session using the session code, provides
their name, and distributes exactly $100 across the session's items. The service
validates all input at the boundary — checking session existence, voter name
presence, allocation structure and values, sum constraint, and duplicate voter
prevention — before appending the vote to the session's `votes` array. The
implementation follows the established pattern from 001-create-session: validation
logic lives in `src/votes.js`, the route handler in `server.js` maps results to
the standard JSON envelope, and 18 HTTP-level tests in `tests/votes.test.js`
cover every happy-path and error-path scenario.

## Technical Context

**Language/Version**: Node.js ≥ 18 (ES modules, `"type": "module"`)
**Primary Dependencies**: Express 4.x (only production dependency)
**Storage**: In-memory — votes appended to `session.votes` array in the existing `Map`
**Testing**: `node --test` (built-in runner) + `supertest` (dev dependency)
**Target Platform**: Linux / macOS / Windows server (any Node.js 18+ host)
**Project Type**: Web service (REST API with static frontend)
**Performance Goals**: N/A — in-memory operations, sub-millisecond per request
**Constraints**: No external state store, no database driver, no ORM
**Scale/Scope**: Single-server, single-process; votes live in process memory as part of the session object

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Status | Evidence |
|---|-----------|--------|----------|
| I | Simplicity First | ✅ PASS | No new dependencies. Votes are plain objects appended to the existing session's `votes` array in the in-memory `Map`. No abstractions, no ORM, no extension points beyond what the spec requires. |
| II | Consistent JSON API Envelope | ✅ PASS | All responses use `{ success: true, data: {…} }` on success and `{ success: false, error: "…" }` on failure. HTTP 200 for success, 400 for validation errors, 404 for session not found. |
| III | Validate at the Boundary | ✅ PASS | All validation lives in `castVote()` in `src/votes.js`. Service returns `{ error, status }` on failure — never throws for expected validation failures. Route handler in `server.js` maps the result to the JSON envelope. |
| IV | Test-Alongside Development | ✅ PASS | 18 tests in `tests/votes.test.js` cover all happy-path and error-path scenarios via HTTP using `supertest`. `clearSessions()` called in `beforeEach` to prevent state leakage. |
| V | ES Modules Only | ✅ PASS | All files use `import`/`export`. `src/votes.js` imports `getSession` from `./sessions.js` using ES module syntax. |

**Gate result**: ✅ All principles satisfied — no violations, no complexity tracking required.

## Project Structure

### Documentation (this feature)

```text
specs/002-cast-votes/
├── plan.md              # This file
├── research.md          # Phase 0 output — research findings
├── data-model.md        # Phase 1 output — entity model
├── quickstart.md        # Phase 1 output — developer quickstart
├── contracts/           # Phase 1 output — API contract
│   └── cast-vote.md
└── tasks.md             # Phase 2 output (generated separately by /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── server.js            # Express app, route mounting, static middleware
├── sessions.js          # Session creation, retrieval, storage, code generation
└── votes.js             # Vote casting and validation

public/
└── index.html           # Single-page frontend (static assets)

tests/
├── sessions.test.js     # HTTP-level tests for session endpoints (12 tests)
└── votes.test.js        # HTTP-level tests for vote endpoints (18 tests)
```

**Structure Decision**: Flat single-project layout matching the constitution's
File Organisation standard. The `votes.js` module follows the same pattern as
`sessions.js` — a dedicated domain module in `src/` with a corresponding test
file in `tests/`. Route registration stays in `server.js`; business logic stays
in the domain module.

## Complexity Tracking

> No constitution violations — table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *(none)* | — | — |
