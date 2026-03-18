# Data Model — 001 Create Session

**Feature**: Create Session | **Date**: 2025-07-21

## Entities

### Session

The primary entity created by this feature. Stored in an in-memory
JavaScript `Map` keyed by `code`.

| Field   | Type       | Required | Default | Description |
|---------|------------|----------|---------|-------------|
| `code`  | `string`   | Yes      | Generated | 6-character uppercase alphanumeric (`A–Z`, `0–9`). Primary key. |
| `title` | `string`   | Yes      | —       | Session title, stored trimmed. Non-empty after trim. |
| `items` | `string[]` | Yes      | —       | List of votable items, each stored trimmed. 2–20 entries. |
| `votes` | `array`    | Yes      | `[]`    | Initialised empty; populated by the Cast Votes feature. |

### Example

```js
{
  code: "A7X3K9",
  title: "Q3 Feature Priorities",
  items: ["Search", "Dark Mode", "Export CSV", "Notifications"],
  votes: []
}
```

## Storage

| Aspect | Detail |
|--------|--------|
| **Container** | `const sessions = new Map()` in `src/sessions.js` |
| **Key** | `session.code` (string) |
| **Value** | Plain `Session` object (no class, no prototype) |
| **Lifetime** | Process memory — lost on restart |
| **Concurrency** | Single-threaded Node.js event loop — no locking needed |

## Validation Rules

Applied in `createSession(title, items)` before any state mutation:

| # | Rule | Error Message | HTTP Status |
|---|------|---------------|-------------|
| 1 | `title` must be a non-empty string after trimming | `"Title is required"` | 400 |
| 2 | `items` must be an array | `"Items must be an array"` | 400 |
| 3 | `items.length` must be ≥ 2 and ≤ 20 | `"Items must contain between 2 and 20 entries"` | 400 |
| 4 | Every element in `items` must be a non-empty string after trimming | `"Each item must be a non-empty string"` | 400 |

Validation order: rules are checked top-to-bottom; the first failure
short-circuits and returns immediately.

## Relationships

```text
Session 1 ──── * Vote  (populated by feature 002-cast-votes)
```

- A `Session` has zero or more `Vote` entries in its `votes` array.
- This feature initialises `votes` as `[]`; the Cast Votes feature
  appends to it.

## Code Generation

| Aspect | Detail |
|--------|--------|
| **Alphabet** | `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789` (36 chars) |
| **Length** | 6 characters |
| **Source** | `crypto.randomBytes(6)` — cryptographically secure |
| **Uniqueness** | Retry loop: `do { generate } while (sessions.has(code))` |
| **Cardinality** | 36⁶ = 2,176,782,336 possible codes |

## Functions

| Function | Module | Signature | Returns |
|----------|--------|-----------|---------|
| `createSession` | `src/sessions.js` | `(title: string, items: string[])` | `{ data: Session }` on success, `{ error: string, status: number }` on failure |
| `getSession` | `src/sessions.js` | `(code: string)` | `Session \| undefined` |
| `clearSessions` | `src/sessions.js` | `()` | `void` — clears the `Map` (test helper) |
