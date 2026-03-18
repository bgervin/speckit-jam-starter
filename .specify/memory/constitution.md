<!--
  Sync Impact Report
  ───────────────────
  Version change: N/A → 1.0.0 (initial adoption)
  Modified principles: N/A (initial)
  Added sections: Core Principles (5), Technology Stack, Development Standards,
                  Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md        ✅ compatible (no changes needed)
    - .specify/templates/spec-template.md         ✅ compatible (no changes needed)
    - .specify/templates/tasks-template.md        ✅ compatible (no changes needed)
    - .specify/templates/constitution-template.md  ✅ source template (unchanged)
  Follow-up TODOs: none
-->

# The $100 Test Constitution

## Core Principles

### I. Simplicity First

Every decision MUST favour the simplest solution that satisfies the
requirement. In-memory data structures (JavaScript `Map`) are the default
persistence layer. No ORM, no database driver, and no external state store
may be introduced unless an explicit, documented justification is approved
through a constitution amendment.

- YAGNI is enforced: do not build features, abstractions, or extension
  points that are not required by a current spec.
- The only production dependency is Express. Adding a new runtime
  dependency MUST be discussed and justified before adoption.
- Prefer Node.js built-in modules (`node:crypto`, `node:test`,
  `node:assert`) over third-party equivalents.

### II. Consistent JSON API Envelope

All HTTP JSON responses MUST use the standard envelope shape:

```json
{ "success": true,  "data": { … } }
{ "success": false, "error": "Human-readable message" }
```

- Every success response includes `"success": true` and a `"data"` key.
- Every error response includes `"success": false` and an `"error"` key
  containing a human-readable string.
- HTTP status codes MUST be semantically correct (200 for success, 400 for
  validation errors, 404 for not-found).
- No additional top-level keys may be added to the envelope without a
  constitution amendment.

### III. Validate at the Boundary

All user input MUST be validated at the service-function boundary before
any state mutation occurs. Validation failures MUST return structured
error objects that the route handler maps to the JSON envelope.

- Validation logic lives in service modules (`src/sessions.js`,
  `src/votes.js`), not in route handlers.
- Service functions return either `{ data }` on success or
  `{ error, status }` on failure—never throw exceptions for expected
  validation failures.
- Session codes MUST be 6-character uppercase alphanumeric strings
  (`A-Z`, `0-9`), generated randomly, and unique among active sessions.

### IV. Test-Alongside Development

Every feature MUST ship with tests that exercise its happy-path and
error-path behaviours through the HTTP API using `supertest`.

- Tests use the Node.js built-in test runner (`node --test`).
- Test files live in `tests/` and are named `<module>.test.js`.
- Each test file MUST import the Express `app` and use `supertest` to
  make real HTTP requests—no mocking of request/response objects.
- Tests MUST be independent: each test (or `describe` block) MUST call
  the appropriate `clear*()` helper so prior state does not leak.
- All tests MUST pass before a feature is considered complete.

### V. ES Modules Only

The entire codebase uses ECMAScript modules. CommonJS (`require`,
`module.exports`) MUST NOT be introduced.

- `package.json` declares `"type": "module"`.
- All imports use `import`/`export` syntax.
- Node.js built-in modules MUST use the `node:` protocol prefix
  (e.g., `import crypto from 'node:crypto'`).

## Technology Stack

| Layer        | Choice                              |
|--------------|-------------------------------------|
| Runtime      | Node.js 20                          |
| Framework    | Express 4.x                         |
| Frontend     | Vanilla HTML / CSS / JS (static files in `public/`) |
| Test runner  | `node --test` (built-in)            |
| HTTP testing | `supertest` (dev dependency only)   |
| Persistence  | In-memory JavaScript `Map`          |
| Module system| ES modules (`"type": "module"`)     |

- The server entry point is `src/server.js`. It exports the Express `app`
  for test consumption and conditionally calls `app.listen()` when run
  directly.
- Static assets are served from the `public/` directory via
  `express.static`.
- The default port is `3000`, overridable via the `PORT` environment
  variable.

## Development Standards

### File Organisation

```
src/
  server.js          # Express app, route mounting, static middleware
  sessions.js        # Session creation, retrieval, storage
  votes.js           # Vote casting and validation
public/
  index.html         # Single-page frontend (and supporting assets)
tests/
  sessions.test.js   # HTTP-level tests for session endpoints
  votes.test.js      # HTTP-level tests for vote endpoints
specs/
  ###-feature-name/
    spec.md           # Feature specification
```

- Each domain concern (sessions, votes, results, etc.) gets its own
  module in `src/` and a corresponding test file in `tests/`.
- Route registration stays in `server.js`; business logic stays in
  domain modules.
- Feature specs live under `specs/` in numbered directories.

### Naming Conventions

- Files: `kebab-case.js`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Test files: `<module>.test.js`
- API routes: `/api/<resource>` (plural nouns, lowercase)

### Error Handling

- Service functions MUST return `{ error, status }` for expected failures
  (validation, not-found). They MUST NOT throw.
- Unexpected errors (bugs) may throw and will be caught by Express
  default error handling.
- Error messages MUST be user-facing, concise, and free of internal
  implementation details.

## Governance

This constitution is the authoritative source of architectural and
process decisions for The $100 Test project. All feature specs, plans,
and code changes MUST comply with the principles defined here.

- **Amendments**: Any change to a principle or addition of a new
  principle MUST be documented with a rationale, reflected in a version
  bump, and propagated to dependent templates.
- **Versioning**: The constitution follows semantic versioning—
  MAJOR for backward-incompatible principle removals or redefinitions,
  MINOR for new principles or materially expanded guidance, PATCH for
  clarifications and wording fixes.
- **Compliance**: Feature specs and implementation plans MUST include a
  Constitution Check section verifying alignment with these principles.
- **Complexity justification**: Any deviation from Simplicity First MUST
  be recorded in the plan's Complexity Tracking table with a rejected-
  alternative explanation.

**Version**: 1.0.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-18
