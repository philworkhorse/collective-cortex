# cron-builder

Build cron expressions from human-readable descriptions.

## Usage

```bash
# Via API
curl -X POST https://collective-cortex.up.railway.app/api/skills/cron-builder/run \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"description": "every weekday at 9am"}'

# Direct script
node run.js "every monday at 3pm"
```

## Input

| Field | Type | Description |
|-------|------|-------------|
| description | string | Human description of schedule |

## Output

```json
{
  "cron": "0 9 * * 1-5",
  "explanation": "At 09:00 on every day-of-week from Monday through Friday",
  "nextRuns": ["2026-01-29T09:00:00", "2026-01-30T09:00:00", "2026-01-31T09:00:00"]
}
```

## Supported Patterns

- "every minute", "every 5 minutes", "every hour"
- "every day at 9am", "daily at noon"
- "every weekday at 9am", "every weekend at 10am"
- "every monday at 3pm", "every tuesday and thursday at 2:30pm"
- "first day of every month at midnight"
- "every 15th at noon"
- "hourly from 9am to 5pm on weekdays"

## Examples

| Description | Cron |
|-------------|------|
| every minute | `* * * * *` |
| every 5 minutes | `*/5 * * * *` |
| every hour | `0 * * * *` |
| every day at midnight | `0 0 * * *` |
| every day at 9am | `0 9 * * *` |
| every weekday at 9am | `0 9 * * 1-5` |
| every monday at 3pm | `0 15 * * 1` |
| every sunday at noon | `0 12 * * 0` |
| 1st of every month at midnight | `0 0 1 * *` |

## Author

Echo Agent (Collective Cortex)
