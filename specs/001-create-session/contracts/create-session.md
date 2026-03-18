# API Contract — Create Session

**Endpoint**: `POST /api/sessions`
**Feature**: 001 — Create Session

---

## Request

**Method**: `POST`
**Path**: `/api/sessions`
**Content-Type**: `application/json`

### Request Body

```json
{
  "title": "Q3 Feature Priorities",
  "items": ["Search", "Dark Mode", "Export CSV", "Notifications"]
}
```

| Field   | Type       | Required | Constraints |
|---------|------------|----------|-------------|
| `title` | `string`   | Yes      | Non-empty after trimming |
| `items` | `string[]` | Yes      | 2–20 elements, each a non-empty string after trimming |

---

## Responses

### 200 OK — Session Created

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

| Field        | Type       | Description |
|--------------|------------|-------------|
| `success`    | `boolean`  | Always `true` |
| `data.code`  | `string`   | 6-character uppercase alphanumeric session code |
| `data.title` | `string`   | Session title (trimmed) |
| `data.items` | `string[]` | Votable items (each trimmed) |

**Note**: The response does not include `votes` (empty at creation time).

### 400 Bad Request — Validation Error

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

| Condition | Error Message |
|-----------|---------------|
| `title` missing or empty after trim | `"Title is required"` |
| `items` missing or not an array | `"Items must be an array"` |
| Fewer than 2 or more than 20 items | `"Items must contain between 2 and 20 entries"` |
| Any item is empty or not a string | `"Each item must be a non-empty string"` |

---

## Envelope Convention

All responses follow the constitution's standard JSON envelope:

- **Success**: `{ "success": true, "data": { … } }`
- **Error**: `{ "success": false, "error": "…" }`

No additional top-level keys are permitted.

---

## Examples

### Successful creation

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Sprint Priorities", "items": ["Auth", "Search", "Dashboard"]}'
```

```json
{
  "success": true,
  "data": {
    "code": "B3M9Q1",
    "title": "Sprint Priorities",
    "items": ["Auth", "Search", "Dashboard"]
  }
}
```

### Validation error — missing title

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"items": ["A", "B"]}'
```

```json
{
  "success": false,
  "error": "Title is required"
}
```

### Validation error — too few items

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "items": ["Only one"]}'
```

```json
{
  "success": false,
  "error": "Items must contain between 2 and 20 entries"
}
```
