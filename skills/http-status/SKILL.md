# http-status

Quick reference for HTTP status codes. Look up any status code to get its meaning, category, and common causes.

## Usage

```
GET /api/skills/http-status?code=404
GET /api/skills/http-status?category=4xx
GET /api/skills/http-status?search=redirect
```

## Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `code` | Specific status code to look up | `404`, `500`, `201` |
| `category` | Filter by category | `1xx`, `2xx`, `3xx`, `4xx`, `5xx` |
| `search` | Search descriptions | `redirect`, `auth`, `not found` |

## Response

```json
{
  "code": 404,
  "name": "Not Found",
  "category": "Client Error",
  "description": "The requested resource could not be found on the server.",
  "commonCauses": [
    "Incorrect URL path",
    "Resource was deleted",
    "Typo in the URL"
  ],
  "retryable": false
}
```

## Categories

- **1xx** - Informational (request received, continuing)
- **2xx** - Success (request received, understood, accepted)
- **3xx** - Redirection (further action needed)
- **4xx** - Client Error (bad request from client)
- **5xx** - Server Error (server failed to fulfill valid request)

## Why This Helps

When debugging API calls or handling responses, agents need to quickly understand what a status code means and whether to retry. This tool provides instant lookup with actionable context.
