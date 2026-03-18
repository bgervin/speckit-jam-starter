# 001 — Create Session

## Description

A facilitator creates a new voting session by providing a title and a list of items that participants will allocate their hypothetical $100 across. The system validates the input, generates a unique session code, stores the session in memory, and returns the code so the facilitator can share it with participants.

## API

### POST `/api/sessions`

Creates a new voting session.

#### Request Body

```json
{
  "title": "Q3 Feature Priorities",
  "items": ["Search", "Dark Mode", "Export CSV", "Notifications"]
}
```

| Field   | Type       | Required | Rules                                        |
|---------|------------|----------|----------------------------------------------|
| `title` | `string`   | Yes      | Non-empty string, trimmed of leading/trailing whitespace |
| `items` | `string[]` | Yes      | Array of 2–20 non-empty strings, each trimmed |

#### Success Response — `200 OK`

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

#### Error Responses — `400 Bad Request`

| Condition                       | Error message                                      |
|---------------------------------|----------------------------------------------------|
| `title` missing or empty        | `"Title is required"`                               |
| `items` missing or not an array | `"Items must be an array"`                          |
| Fewer than 2 items              | `"Items must contain between 2 and 20 entries"`     |
| More than 20 items              | `"Items must contain between 2 and 20 entries"`     |
| Any item is empty or not a string | `"Each item must be a non-empty string"`          |

## Validation Rules

1. `title` must be a non-empty string after trimming.
2. `items` must be an array.
3. `items` length must be ≥ 2 and ≤ 20.
4. Every element in `items` must be a string that is non-empty after trimming.
5. Both `title` and each item are stored in their trimmed form.

## Session Code Generation

- 6 characters, uppercase alphanumeric (`A-Z`, `0-9`).
- Generated randomly on the server.
- Must be unique among active sessions (regenerate on collision).

## Storage

Sessions are stored in memory using a JavaScript `Map` keyed by session code. Each session value is a plain object:

```js
{
  code: "A7X3K9",
  title: "Q3 Feature Priorities",
  items: ["Search", "Dark Mode", "Export CSV", "Notifications"],
  votes: []
}
```

- `votes` is initialized as an empty array, ready for the Cast Votes feature.

## File Layout

| File                      | Responsibility                                              |
|---------------------------|-------------------------------------------------------------|
| `src/sessions.js`         | `createSession(title, items)` — validates, generates code, stores session, returns session object |
| `src/server.js`           | Express app setup, JSON middleware, mounts `POST /api/sessions` route |
| `tests/sessions.test.js`  | Tests for session creation: success cases, validation errors |

## Tests

| # | Scenario                                  | Expected status | Expected result                              |
|---|-------------------------------------------|-----------------|----------------------------------------------|
| 1 | Valid title and 4 items                   | 200             | Returns `success: true` with `code`, `title`, `items` |
| 2 | Valid title and exactly 2 items (minimum) | 200             | Session created successfully                 |
| 3 | Valid title and exactly 20 items (maximum)| 200             | Session created successfully                 |
| 4 | Missing `title`                           | 400             | `"Title is required"`                         |
| 5 | Empty string `title`                      | 400             | `"Title is required"`                         |
| 6 | Missing `items`                           | 400             | `"Items must be an array"`                    |
| 7 | `items` is not an array                   | 400             | `"Items must be an array"`                    |
| 8 | Only 1 item                               | 400             | `"Items must contain between 2 and 20 entries"` |
| 9 | 21 items                                  | 400             | `"Items must contain between 2 and 20 entries"` |
| 10| An item is an empty string                | 400             | `"Each item must be a non-empty string"`      |
| 11| Session code is 6 uppercase alphanumeric chars | 200        | Code matches `/^[A-Z0-9]{6}$/`                |
| 12| Title and items are trimmed               | 200             | Stored values have no leading/trailing spaces |
