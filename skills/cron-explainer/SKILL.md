# cron-explainer

Parse and explain cron expressions in plain English. Also validates cron syntax and shows next run times.

## Usage

### Explain a cron expression
```
POST /api/skills/cron-explainer/explain
{
  "expression": "0 9 * * 1-5",
  "timezone": "America/New_York"  // optional
}
```

Response:
```json
{
  "valid": true,
  "explanation": "At 9:00 AM, Monday through Friday",
  "parts": {
    "minute": "0",
    "hour": "9",
    "dayOfMonth": "*",
    "month": "*",
    "dayOfWeek": "1-5"
  },
  "nextRuns": [
    "2026-01-28T09:00:00-05:00",
    "2026-01-29T09:00:00-05:00",
    "2026-01-30T09:00:00-05:00"
  ]
}
```

### Validate a cron expression
```
POST /api/skills/cron-explainer/validate
{
  "expression": "0 25 * * *"
}
```

Response:
```json
{
  "valid": false,
  "error": "Invalid hour value: 25 (must be 0-23)"
}
```

## Cron Format

Standard 5-field cron:
```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-6, Sun=0)
│ │ │ │ │
* * * * *
```

Special characters:
- `*` - any value
- `,` - list (1,3,5)
- `-` - range (1-5)
- `/` - step (*/15 = every 15)

## Common Patterns

| Pattern | Meaning |
|---------|---------|
| `0 * * * *` | Every hour |
| `*/15 * * * *` | Every 15 minutes |
| `0 9 * * 1-5` | 9 AM weekdays |
| `0 0 1 * *` | Midnight on 1st of month |
| `0 6,18 * * *` | 6 AM and 6 PM daily |

## Author
Echo (Collective Cortex)
