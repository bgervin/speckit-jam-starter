# Research — 002 Cast Votes

**Feature**: Cast Votes | **Date**: 2026-03-18

## Overview

This document captures research findings and design decisions for the
Cast Votes feature. The feature builds directly on top of the session
infrastructure established in 001-create-session. All technology choices
align with the constitution and follow precedent set by the first feature.

---

## 1. Cross-Module Session Lookup

**Decision**: Import `getSession(code)` from `src/sessions.js` to look up
the target session by code.

**Rationale**:
- `getSession` was designed as a public export in feature 001 specifically
  to support cross-module access for voting and results.
- The votes module does not need direct access to the `sessions` Map — it
  operates on the session object returned by `getSession`.
- The `:code` URL parameter is uppercased before lookup to ensure
  case-insensitive session code matching, consistent with the session
  creation design.

**Alternatives considered**:
- Pass the session object from the route handler — rejected: moves
  lookup logic into the route handler, violating Principle III (validate
  at the boundary in the service module).
- Expose the `sessions` Map directly — rejected: breaks encapsulation;
  the votes module should not depend on the storage implementation.

---

## 2. Vote Storage Model

**Decision**: Append plain vote objects `{ voterName, allocations }` to
the session's existing `votes` array.

**Rationale**:
- The session entity (from 001) already initialises `votes: []` — no
  schema change needed.
- Plain objects are the simplest representation (Constitution Principle I).
- The `voterName` is stored in its trimmed form; `allocations` is stored
  as-is after validation.
- No separate vote collection or ID is needed — votes are always accessed
  through their parent session.

**Alternatives considered**:
- Separate `votes` Map with auto-incrementing IDs — rejected: adds
  unnecessary complexity; votes are never looked up individually.
- Vote class with methods — rejected: violates Simplicity First; plain
  objects are sufficient since votes have no behaviour.

---

## 3. Validation Strategy

**Decision**: Validate all input inside `castVote(code, voterName,
allocations)` in a defined order, returning `{ error, status }` on the
first failure.

**Rationale**:
- Constitution Principle III requires validation at the service-function
  boundary before any state mutation.
- Ordered validation (session existence → voter name → allocations type →
  keys match → values valid → sum check → duplicate check) matches the
  spec's explicit validation order and produces deterministic error
  messages.
- The function returns `{ error, status }` on failure and `{ data }` on
  success, consistent with `createSession` in 001.

**Alternatives considered**:
- Collect all errors and return them together — rejected: the spec says
  "the first failing rule produces the error response"; multi-error
  would contradict this.
- Validate in middleware — rejected: the constitution says validation
  logic lives in service modules, not in route handlers or middleware.

---

## 4. Duplicate Voter Prevention

**Decision**: Case-insensitive comparison of trimmed voter names against
existing votes in the session.

**Rationale**:
- The spec requires that "no existing vote in the session may have the
  same voterName (compared case-insensitively after trimming)."
- Implementation uses `Array.some()` with `.toLowerCase()` comparison —
  simple and efficient for the expected vote count per session.
- Trimming is applied to the incoming name before comparison and before
  storage.

**Alternatives considered**:
- Store a `Set` of normalised voter names for O(1) lookup — rejected:
  premature optimisation; `Array.some()` is O(n) but n is small (a
  handful of voters per session). Adding a parallel data structure
  increases complexity.
- Case-sensitive comparison only — rejected: the spec explicitly
  requires case-insensitive duplicate detection.

---

## 5. Allocation Validation

**Decision**: Validate allocations as a multi-step check: type check →
key match → value constraints → sum constraint.

**Rationale**:
- The allocations object must be a non-null, non-array plain object
  whose keys match the session's items exactly and whose values are
  non-negative integers summing to 100.
- Checking `Array.isArray(allocations)` separately from the `typeof`
  check is necessary because `typeof [] === 'object'` in JavaScript.
- Using `Number.isInteger(val) && val >= 0` cleanly rejects floats,
  NaN, Infinity, and negative values in one guard.
- `Object.values(allocations).reduce((a, b) => a + b, 0)` is the
  simplest sum computation.

**Alternatives considered**:
- JSON Schema validation library — rejected: adds a dependency;
  overkill for a fixed validation shape.
- `val % 1 === 0` for integer check — rejected: `Number.isInteger()`
  is more readable and handles edge cases (NaN, Infinity) correctly.

---

## 6. Testing Approach

**Decision**: 18 HTTP-level tests using `node --test` + `supertest`, with
`clearSessions()` in `beforeEach` and a helper `createTestSession()` to
set up prerequisite sessions.

**Rationale**:
- Constitution Principle IV requires tests through the HTTP API using
  `supertest` with the built-in test runner.
- Each test needs a session to vote in, so `createTestSession()` creates
  one via the HTTP API and returns the session code — this tests the full
  stack and avoids coupling to internal session creation logic.
- `clearSessions()` ensures test isolation (Principle IV: "each test
  MUST call the appropriate `clear*()` helper").
- 18 scenarios from the spec's test matrix: 3 success cases, 14
  validation error cases, and 1 multi-voter case.

**Alternatives considered**:
- Unit-test `castVote()` directly — rejected: the constitution requires
  HTTP-level tests via `supertest`. Direct unit tests could supplement
  but are not a substitute.
- Mock sessions — rejected: using real sessions via the HTTP API is
  simpler and tests the full integration path.
