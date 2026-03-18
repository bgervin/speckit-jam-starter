# Quickstart — 002 Cast Votes

**Feature**: Cast Votes | **Date**: 2026-03-18

## Prerequisites

- Node.js ≥ 18
- npm (comes with Node.js)

## Setup

```bash
# Clone and install
cd speckit-jam-starter
npm install
```

## Run the Server

```bash
npm start
# → Server running on port 3000
```

## Cast a Vote

First, create a session to vote in:

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q3 Feature Priorities",
    "items": ["Search", "Dark Mode", "Export CSV", "Notifications"]
  }'
```

Note the `code` in the response (e.g., `"A7X3K9"`), then cast a vote:

```bash
curl -X POST http://localhost:3000/api/sessions/A7X3K9/votes \
  -H "Content-Type: application/json" \
  -d '{
    "voterName": "Alice",
    "allocations": {
      "Search": 40,
      "Dark Mode": 25,
      "Export CSV": 25,
      "Notifications": 10
    }
  }'
```

**Expected response** (200 OK):

```json
{
  "success": true,
  "data": {
    "voterName": "Alice",
    "allocations": {
      "Search": 40,
      "Dark Mode": 25,
      "Export CSV": 25,
      "Notifications": 10
    }
  }
}
```

Each participant distributes exactly $100 (as integers) across the items.
Zero allocations are valid — you can put $0 on items you don't prioritise.

## Run Tests

```bash
npm test
```

Runs all tests using the Node.js built-in test runner (`node --test`).
The vote tests cover 18 scenarios: 3 success cases, 14 validation error
cases, and 1 multi-voter case.

Expected output:

```
▶ POST /api/sessions/:code/votes
  ✔ 1 - valid vote with correct allocations summing to $100
  ✔ 2 - valid vote allocating $0 to some items
  ✔ 3 - valid vote allocating all $100 to one item
  ✔ 4 - session code does not exist
  ✔ 5 - missing voterName
  ✔ 6 - empty string voterName
  ✔ 7 - missing allocations
  ✔ 8 - allocations is not an object (array)
  ✔ 9 - allocations has extra keys not in session items
  ✔ 10 - allocations is missing a session item key
  ✔ 11 - an allocation value is negative
  ✔ 12 - an allocation value is not an integer
  ✔ 13 - allocations sum to less than $100
  ✔ 14 - allocations sum to more than $100
  ✔ 15 - duplicate voter name (exact match)
  ✔ 16 - duplicate voter name (different casing)
  ✔ 17 - voter name is trimmed in the stored vote
  ✔ 18 - two different voters can vote in the same session
✔ POST /api/sessions/:code/votes
ℹ tests 18 | pass 18 | fail 0
```

## Key Files

| File | Purpose |
|------|---------|
| `src/votes.js` | `castVote(code, voterName, allocations)` — validates input, checks duplicates, appends vote |
| `src/sessions.js` | `getSession(code)` — retrieves the session for the votes module to operate on |
| `src/server.js` | Express app setup, mounts `POST /api/sessions/:code/votes` route |
| `tests/votes.test.js` | 18 HTTP-level tests covering all spec scenarios |
| `specs/002-cast-votes/spec.md` | Feature specification |

## Architecture Notes

- **Validation**: All validation happens inside `castVote()` in the
  service module, not in the route handler. The function returns
  `{ data }` on success or `{ error, status }` on failure.
- **Cross-module access**: `castVote` imports `getSession` from
  `sessions.js` to look up the target session. It does not access
  the `sessions` Map directly.
- **Storage**: Votes are plain objects appended to the session's
  `votes` array in process memory. No separate collection, no IDs.
- **Duplicate prevention**: Voter names are compared case-insensitively
  after trimming. "Alice", "ALICE", and " alice " are all treated as
  the same voter.
- **Envelope**: Every response uses `{ success, data }` or
  `{ success, error }` — mandated by the project constitution.
