# The $100 Test — Constitution

## Identity

**The $100 Test** is a web app for teams to run dollar-100 prioritization exercises — a well-known product management technique where participants allocate a hypothetical $100 across competing options to surface true priorities. A facilitator creates a session with a list of items, shares the session code, and participants each distribute exactly $100 across those items. The items that attract the most funding reveal the team's real priorities.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Server | Express.js 4.x |
| Frontend | Vanilla HTML / CSS / JS (static files served by Express) |
| Tests | Node.js built-in test runner (`node --test`) |
| Persistence | In-memory (plain JS objects; no database) |
| Module system | ES modules (`"type": "module"` in package.json) |

No additional frameworks, ORMs, template engines, or build tools. Keep dependencies minimal — Express is the only runtime dependency.

## Project Structure

```
├── constitution.md                 # This file — app identity & standards
├── specs/                          # Feature specifications (SpecKit)
│   └── NNN-feature-name/
│       └── spec.md
├── src/
│   ├── server.js                   # Express app setup, middleware, route mounting
│   ├── sessions.js                 # Session creation, retrieval, management
│   └── votes.js                    # Vote submission and validation
├── public/                         # Static frontend assets served at /
│   └── index.html                  # Single-page web interface
├── tests/
│   └── *.test.js                   # One test file per source module
└── package.json
```

## Naming Conventions

| What | Convention | Examples |
|---|---|---|
| Files & directories | kebab-case | `cast-votes`, `server.js`, `sessions.test.js` |
| JS variables & functions | camelCase | `voterName`, `createSession()` |
| Spec directories | `NNN-feature-name/` | `001-create-session/`, `002-cast-votes/` |
| API routes | lowercase, plural nouns | `/api/sessions`, `/api/sessions/:code/votes` |
| CSS classes | kebab-case | `.vote-card`, `.error` |

## API Conventions

### Response Shape

Every JSON response follows this envelope:

```jsonc
// Success
{ "success": true, "data": { /* payload */ } }

// Error
{ "success": false, "error": "Human-readable error message" }
```

- `success` is always present and is a boolean.
- On success, `data` contains the response payload. Omit `error`.
- On error, `error` contains a descriptive string. Omit `data`.

### HTTP Status Codes

| Status | When |
|---|---|
| 200 | Successful GET or POST |
| 400 | Validation failure (missing fields, allocations ≠ $100, bad format) |
| 404 | Session code not found |
| 500 | Unexpected server error |

### Content Type

- Requests with a body: `Content-Type: application/json`
- All responses: `Content-Type: application/json`

## Session Codes

Session codes are **6-character uppercase alphanumeric** strings (characters `A-Z` and `0-9`). They are generated server-side when a session is created and serve as the primary session identifier. Example: `A7X3K9`.

## Domain Rules

1. **Allocations must sum to exactly $100.** Each participant distributes precisely 100 dollars — no more, no less.
2. **Individual allocations are whole non-negative integers** (0–100).
3. **A session requires a title and at least two items** to vote on.
4. **Each allocation key must match an item in the session.** Extra or missing keys are rejected.
5. **Voter name is required** when casting a vote.

## Coding Style

- ES module syntax: `import` / `export`, no `require()`.
- Use `const` by default; use `let` only when reassignment is needed. Never `var`.
- Prefer `async` / `await` over raw promise chains.
- Keep functions short and focused. Export pure logic from modules; keep route handlers thin.
- No classes unless strictly necessary — prefer plain functions and objects.
- Use early returns for validation and error cases.

## Error Handling

- Validate inputs at the route-handler level before calling business logic.
- Return a `400` with a clear `error` message for validation failures.
- Wrap unexpected failures in a try/catch and return `500`.
- Never leak stack traces to the client.

## Testing

- **Runner:** `node --test` (Node.js built-in).
- **Location:** `tests/*.test.js` — one test file per source module.
- **Style:** Use `describe` / `it` from `node:test` and `assert` from `node:assert`.
- **Scope:** Test API behavior by calling route handlers or making HTTP requests to the Express app. Focus on inputs, outputs, status codes, and error messages.
- **Command:** `npm test` runs all tests.

## Frontend

- Single `public/index.html` file with inline `<style>` and `<script>`.
- Vanilla JS — no frameworks, no build step.
- `fetch()` with `async` / `await` for all API calls.
- Respond to API errors by checking `data.success` and displaying `data.error`.

## Persistence

All data lives in-memory using plain JavaScript data structures (objects, Maps, arrays). Data is lost on server restart. This is intentional — the app is designed for short-lived, synchronous prioritization sessions.
