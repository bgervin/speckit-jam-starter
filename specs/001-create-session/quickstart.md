# Quickstart — 001 Create Session

**Feature**: Create Session | **Date**: 2025-07-21

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

Or with a custom port:

```bash
PORT=8080 npm start
```

## Create a Session

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Q3 Feature Priorities",
    "items": ["Search", "Dark Mode", "Export CSV", "Notifications"]
  }'
```

**Expected response** (200 OK):

```json
{
  "success": true,
  "data": {
    "code": "A7X3K9",
    "title": "Q3 Feature Priorities",
    "items": ["Search", "Dark Mode", "Export CSV", "Notifications"]
  }
}
```

Share the 6-character `code` with participants so they can join and vote.

## Run Tests

```bash
npm test
```

Runs all tests using the Node.js built-in test runner (`node --test`).
The session tests cover 12 scenarios: 3 success cases and 9 validation
error cases.

Expected output:

```
▶ POST /api/sessions
  ✔ 1 - valid title and 4 items returns 200 with code, title, items
  ✔ 2 - valid title and exactly 2 items (minimum)
  ✔ 3 - valid title and exactly 20 items (maximum)
  ✔ 4 - missing title returns 400
  ✔ 5 - empty string title returns 400
  ✔ 6 - missing items returns 400
  ✔ 7 - items is not an array returns 400
  ✔ 8 - only 1 item returns 400
  ✔ 9 - 21 items returns 400
  ✔ 10 - an item is an empty string returns 400
  ✔ 11 - session code is 6 uppercase alphanumeric chars
  ✔ 12 - title and items are trimmed
✔ POST /api/sessions
ℹ tests 12 | pass 12 | fail 0
```

## Key Files

| File | Purpose |
|------|---------|
| `src/sessions.js` | `createSession(title, items)` — validates input, generates code, stores session |
| `src/server.js` | Express app setup, mounts `POST /api/sessions` route |
| `tests/sessions.test.js` | 12 HTTP-level tests covering all spec scenarios |
| `specs/001-create-session/spec.md` | Feature specification |

## Architecture Notes

- **Validation**: All validation happens inside `createSession()` in the
  service module, not in the route handler. The function returns
  `{ data }` on success or `{ error, status }` on failure.
- **Storage**: Sessions live in a `Map` in process memory. No database.
  Data is lost on server restart.
- **Code generation**: Uses `node:crypto.randomBytes()` for secure
  randomness. Codes are 6 characters from `A–Z0–9` with a collision
  retry loop.
- **Envelope**: Every response uses `{ success, data }` or
  `{ success, error }` — mandated by the project constitution.
