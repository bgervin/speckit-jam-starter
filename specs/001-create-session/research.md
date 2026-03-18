# Research — 001 Create Session

**Feature**: Create Session | **Date**: 2025-07-21

## Overview

This document captures research findings and design decisions for the
Create Session feature. Because the project is a small, in-memory Express
service with a well-defined constitution, most technology choices were
already settled. The research below confirms those choices and documents
the rationale.

---

## 1. Session Code Generation

**Decision**: Use `node:crypto.randomBytes()` to generate 6-character
uppercase alphanumeric codes, with a collision-retry loop.

**Rationale**:
- `node:crypto` is a Node.js built-in — no third-party dependency needed
  (Constitution Principle I: Simplicity First).
- `randomBytes()` provides cryptographically secure randomness, avoiding
  predictable session codes.
- The character space is 36 symbols (`A–Z`, `0–9`), yielding 36⁶ ≈ 2.18
  billion possible codes — collision probability is negligible at the
  expected scale (single-server, in-memory).
- The retry loop (`do…while sessions.has(code)`) guarantees uniqueness
  among active sessions as required by the spec.

**Alternatives considered**:
- `Math.random()` — rejected: not cryptographically secure, patterns may
  emerge under high volume.
- `uuid` package — rejected: adds a dependency; UUIDs are too long for
  human sharing (the spec requires 6 characters).
- `nanoid` package — rejected: adds a dependency; unnecessary when
  `node:crypto` satisfies the requirement directly.

---

## 2. In-Memory Storage

**Decision**: Use a JavaScript `Map` keyed by session code.

**Rationale**:
- The constitution mandates in-memory data structures as the default
  persistence layer (Principle I).
- `Map` provides O(1) lookup by code, which is the primary access pattern
  (create session → look up session by code for voting).
- No durability requirement exists in the spec — session data is transient.

**Alternatives considered**:
- Plain object (`{}`) — rejected: `Map` has cleaner semantics for dynamic
  keys, avoids prototype pollution concerns, and has a `.has()` method
  for the collision check.
- SQLite / file-based store — rejected: violates Simplicity First; no spec
  requirement for persistence across restarts.

---

## 3. Validation Strategy

**Decision**: Validate inside the service function (`createSession`) and
return `{ error, status }` on failure — never throw for expected
validation failures.

**Rationale**:
- Constitution Principle III requires validation at the service-function
  boundary before any state mutation.
- Returning error objects (rather than throwing) keeps the control flow
  explicit and avoids try/catch boilerplate in route handlers.
- The route handler in `server.js` maps `{ error, status }` to the
  standard JSON envelope `{ success: false, error }` with the appropriate
  HTTP status code.

**Alternatives considered**:
- Throw custom error classes — rejected: the constitution explicitly says
  "never throw exceptions for expected validation failures."
- Validate in route handler — rejected: the constitution says "Validation
  logic lives in service modules, not in route handlers."

---

## 4. Response Envelope

**Decision**: All responses use the standard envelope:
```json
{ "success": true,  "data": { … } }
{ "success": false, "error": "Human-readable message" }
```

**Rationale**:
- Constitution Principle II mandates this exact shape.
- HTTP 200 for successful creation, HTTP 400 for validation errors.

**Alternatives considered**:
- REST-style status-only (no envelope) — rejected: violates Principle II.
- Include `"code"` at top level — rejected: no additional top-level keys
  are allowed without a constitution amendment.

---

## 5. Testing Approach

**Decision**: 12 HTTP-level tests using `node --test` + `supertest`, with
`clearSessions()` in `beforeEach`.

**Rationale**:
- Constitution Principle IV requires tests through the HTTP API using
  `supertest` with the built-in test runner.
- `clearSessions()` ensures test isolation (Principle IV: "each test
  MUST call the appropriate `clear*()` helper").
- Tests cover all 12 scenarios from the spec's test matrix: 3 success
  cases (happy path, boundary min, boundary max) and 9 error cases
  (each validation rule).

**Alternatives considered**:
- Unit-test `createSession()` directly — rejected: the constitution
  requires HTTP-level tests via `supertest`. Direct unit tests could
  supplement but are not a substitute.
- Jest / Vitest — rejected: Principle I favours the built-in test runner;
  Principle IV explicitly names `node --test`.
