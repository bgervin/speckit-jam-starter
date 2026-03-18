# API Contract — Cast Vote

**Endpoint**: `POST /api/sessions/:code/votes`
**Feature**: 002 — Cast Votes

---

## Request

**Method**: `POST`
**Path**: `/api/sessions/:code/votes`
**Content-Type**: `application/json`

### URL Parameters

| Parameter | Type     | Description |
|-----------|----------|-------------|
| `code`    | `string` | The 6-character session code (case-insensitive — uppercased before lookup) |

### Request Body

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

| Field         | Type                      | Required | Constraints |
|---------------|---------------------------|----------|-------------|
| `voterName`   | `string`                  | Yes      | Non-empty after trimming. Must not duplicate an existing voter name in the session (case-insensitive). |
| `allocations` | `object` (`string → int`) | Yes      | Keys must match session items exactly (same set, no extras, no missing). Values must be non-negative integers summing to exactly 100. |

---

## Responses

### 200 OK — Vote Cast

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

| Field                | Type     | Description |
|----------------------|----------|-------------|
| `success`            | `boolean` | Always `true` |
| `data.voterName`     | `string` | Voter's name (trimmed) |
| `data.allocations`   | `object` | Map of item names to allocated dollar amounts |

### 404 Not Found — Session Does Not Exist

```json
{
  "success": false,
  "error": "Session not found"
}
```

### 400 Bad Request — Validation Error

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

| Condition | Error Message |
|-----------|---------------|
| `voterName` missing or empty after trim | `"Voter name is required"` |
| `allocations` missing, null, or not a plain object | `"Allocations must be an object"` |
| Allocation keys don't match session items exactly | `"Allocations must include exactly the session items"` |
| Any allocation value is not a non-negative integer | `"Each allocation must be a non-negative integer"` |
| Allocation values don't sum to exactly 100 | `"Allocations must sum to exactly $100"` |
| Voter name already used in this session | `"This name has already voted in this session"` |

Validation is performed in the order listed above. The first failing rule
produces the error response.

---

## Envelope Convention

All responses follow the constitution's standard JSON envelope:

- **Success**: `{ "success": true, "data": { … } }`
- **Error**: `{ "success": false, "error": "…" }`

No additional top-level keys are permitted.

---

## Examples

### Successful vote

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

### Validation error — allocations don't sum to $100

```bash
curl -X POST http://localhost:3000/api/sessions/A7X3K9/votes \
  -H "Content-Type: application/json" \
  -d '{
    "voterName": "Bob",
    "allocations": {
      "Search": 10,
      "Dark Mode": 10,
      "Export CSV": 10,
      "Notifications": 10
    }
  }'
```

```json
{
  "success": false,
  "error": "Allocations must sum to exactly $100"
}
```

### Validation error — duplicate voter

```bash
curl -X POST http://localhost:3000/api/sessions/A7X3K9/votes \
  -H "Content-Type: application/json" \
  -d '{
    "voterName": "Alice",
    "allocations": {
      "Search": 50,
      "Dark Mode": 20,
      "Export CSV": 20,
      "Notifications": 10
    }
  }'
```

```json
{
  "success": false,
  "error": "This name has already voted in this session"
}
```

### Session not found

```bash
curl -X POST http://localhost:3000/api/sessions/ZZZZZZ/votes \
  -H "Content-Type: application/json" \
  -d '{"voterName": "Alice", "allocations": {}}'
```

```json
{
  "success": false,
  "error": "Session not found"
}
```
