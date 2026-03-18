# Data Model — 002 Cast Votes

**Feature**: Cast Votes | **Date**: 2026-03-18

## Entities

### Vote

The entity created by this feature. Stored as a plain object appended to
the parent session's `votes` array.

| Field         | Type                      | Required | Default | Description |
|---------------|---------------------------|----------|---------|-------------|
| `voterName`   | `string`                  | Yes      | —       | Participant's name, stored trimmed. Non-empty after trim. |
| `allocations` | `object` (`string → int`) | Yes      | —       | Map of item names to dollar amounts. Keys must match session items exactly. Values are non-negative integers summing to 100. |

### Example

```js
{
  voterName: "Alice",
  allocations: {
    "Search": 40,
    "Dark Mode": 25,
    "Export CSV": 25,
    "Notifications": 10
  }
}
```

### Session (referenced — defined in 001)

Votes are appended to the existing `Session.votes` array. The session
entity is defined in `specs/001-create-session/data-model.md`.

| Field   | Type       | Relevance to this feature |
|---------|------------|---------------------------|
| `code`  | `string`   | Used to look up the target session |
| `items` | `string[]` | Allocation keys must match these exactly |
| `votes` | `array`    | Vote objects are appended here |

## Storage

| Aspect | Detail |
|--------|--------|
| **Container** | `session.votes` array within the `sessions` Map in `src/sessions.js` |
| **Key** | No individual key — votes are identified by position in the array |
| **Value** | Plain `Vote` object (no class, no prototype) |
| **Lifetime** | Process memory — lost on restart (same as parent session) |
| **Concurrency** | Single-threaded Node.js event loop — no locking needed |

## Validation Rules

Applied in `castVote(code, voterName, allocations)` before any state mutation:

| # | Rule | Error Message | HTTP Status |
|---|------|---------------|-------------|
| 1 | Session identified by `:code` must exist | `"Session not found"` | 404 |
| 2 | `voterName` must be a non-empty string after trimming | `"Voter name is required"` | 400 |
| 3 | `allocations` must be a non-null plain object (not array, not primitive) | `"Allocations must be an object"` | 400 |
| 4 | Keys of `allocations` must match session `items` exactly (same set) | `"Allocations must include exactly the session items"` | 400 |
| 5 | Every value in `allocations` must be an integer ≥ 0 | `"Each allocation must be a non-negative integer"` | 400 |
| 6 | Values in `allocations` must sum to exactly 100 | `"Allocations must sum to exactly $100"` | 400 |
| 7 | No existing vote may have the same `voterName` (case-insensitive, trimmed) | `"This name has already voted in this session"` | 400 |

Validation order: rules are checked top-to-bottom; the first failure
short-circuits and returns immediately.

## Relationships

```text
Session 1 ──── * Vote
```

- A `Session` has zero or more `Vote` entries in its `votes` array.
- Each `Vote` belongs to exactly one `Session` (no cross-session voting).
- Duplicate voter names within a session are prevented by validation
  rule 7 (case-insensitive comparison).
- The allocation keys in each vote must correspond 1:1 with the
  session's `items` array.

## Functions

| Function | Module | Signature | Returns |
|----------|--------|-----------|---------|
| `castVote` | `src/votes.js` | `(code: string, voterName: string, allocations: object)` | `{ data: Vote }` on success, `{ error: string, status: number }` on failure |
| `getSession` | `src/sessions.js` | `(code: string)` | `Session \| undefined` — used by `castVote` to look up the target session |
