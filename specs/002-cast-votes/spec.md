# 002 — Cast Votes

## Description

A participant joins an existing voting session using the session code, provides their name, and distributes exactly $100 across the session's items. The system validates the input — ensuring the session exists, the voter name is provided, allocations match the session items exactly, each allocation is a non-negative integer, and the total equals $100. It also prevents the same participant name from voting twice in the same session. Valid votes are stored in the session's `votes` array and the saved vote is returned.

## API

### POST `/api/sessions/:code/votes`

Casts a vote in an existing session.

#### URL Parameters

| Parameter | Type     | Description                        |
|-----------|----------|------------------------------------|
| `code`    | `string` | The 6-character session code       |

#### Request Body

```json
{
  "voterName": "Alice",
  "allocations": {
    "Search": 40,
    "Dark Mode": 25,
    "Export CSV": 25,
    "Notifications": 10
  }
}
```

| Field         | Type                      | Required | Rules                                                                 |
|---------------|---------------------------|----------|-----------------------------------------------------------------------|
| `voterName`   | `string`                  | Yes      | Non-empty string, trimmed of leading/trailing whitespace              |
| `allocations` | `object` (`string → int`) | Yes      | Keys must match session items exactly; values are non-negative integers summing to 100 |

#### Success Response — `200 OK`

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

#### Error Responses

| Status | Condition                                        | Error message                                            |
|--------|--------------------------------------------------|----------------------------------------------------------|
| 404    | Session code not found                           | `"Session not found"`                                    |
| 400    | `voterName` missing or empty                     | `"Voter name is required"`                               |
| 400    | `allocations` missing or not a plain object      | `"Allocations must be an object"`                        |
| 400    | Allocation keys don't match session items exactly | `"Allocations must include exactly the session items"`   |
| 400    | Any allocation value is not a non-negative integer | `"Each allocation must be a non-negative integer"`      |
| 400    | Allocation values do not sum to 100              | `"Allocations must sum to exactly $100"`                 |
| 400    | Voter name already used in this session          | `"This name has already voted in this session"`          |

Validation is performed in the order listed above. The first failing rule produces the error response.

## Validation Rules

1. The session identified by `:code` must exist; if not, return `404`.
2. `voterName` must be a non-empty string after trimming.
3. `allocations` must be a non-null plain object (not an array, not a primitive).
4. The keys of `allocations` must match the session's `items` array exactly — same set, no extras, no missing keys.
5. Every value in `allocations` must be an integer ≥ 0.
6. The values in `allocations` must sum to exactly `100`.
7. No existing vote in the session may have the same `voterName` (compared case-insensitively after trimming). This prevents duplicate voting.

## Storage

Votes are appended to the session's `votes` array. Each vote is a plain object:

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

The `voterName` is stored in its trimmed form.

## Session Lookup

The session is retrieved from the in-memory `Map` by its code. A `getSession(code)` function is exported from `src/sessions.js` so that the votes module can look up sessions. The `:code` URL parameter is uppercased before lookup to ensure case-insensitive matching.

## File Layout

| File                      | Responsibility                                              |
|---------------------------|-------------------------------------------------------------|
| `src/sessions.js`         | Add `getSession(code)` — returns the session object or `undefined` |
| `src/votes.js`            | `castVote(code, voterName, allocations)` — validates input, checks for duplicate voter, appends vote, returns result |
| `src/server.js`           | Mount `POST /api/sessions/:code/votes` route                |
| `tests/votes.test.js`     | Tests for vote casting: success cases, all validation errors |

## Tests

| #  | Scenario                                              | Expected status | Expected result                                          |
|----|-------------------------------------------------------|-----------------|----------------------------------------------------------|
| 1  | Valid vote with correct allocations summing to $100    | 200             | Returns `success: true` with `voterName` and `allocations` |
| 2  | Valid vote allocating $0 to some items                 | 200             | Vote accepted (zero allocations are valid)               |
| 3  | Valid vote allocating all $100 to one item             | 200             | Vote accepted                                            |
| 4  | Session code does not exist                           | 404             | `"Session not found"`                                    |
| 5  | Missing `voterName`                                   | 400             | `"Voter name is required"`                               |
| 6  | Empty string `voterName`                              | 400             | `"Voter name is required"`                               |
| 7  | Missing `allocations`                                 | 400             | `"Allocations must be an object"`                        |
| 8  | `allocations` is not an object (e.g., an array)       | 400             | `"Allocations must be an object"`                        |
| 9  | `allocations` has extra keys not in session items      | 400             | `"Allocations must include exactly the session items"`   |
| 10 | `allocations` is missing a session item key            | 400             | `"Allocations must include exactly the session items"`   |
| 11 | An allocation value is negative                       | 400             | `"Each allocation must be a non-negative integer"`       |
| 12 | An allocation value is not an integer (e.g., 10.5)    | 400             | `"Each allocation must be a non-negative integer"`       |
| 13 | Allocations sum to less than $100                     | 400             | `"Allocations must sum to exactly $100"`                 |
| 14 | Allocations sum to more than $100                     | 400             | `"Allocations must sum to exactly $100"`                 |
| 15 | Duplicate voter name (exact match)                    | 400             | `"This name has already voted in this session"`          |
| 16 | Duplicate voter name (different casing)               | 400             | `"This name has already voted in this session"`          |
| 17 | Voter name is trimmed in the stored vote              | 200             | Stored `voterName` has no leading/trailing spaces        |
| 18 | Two different voters can vote in the same session      | 200             | Both votes are stored; session has 2 votes               |
