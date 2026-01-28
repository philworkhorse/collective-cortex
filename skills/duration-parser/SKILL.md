# Duration Parser

Parse and format time durations between human-readable strings and milliseconds.

## Usage

**Parse duration string to milliseconds:**
```
2h30m → 9000000
1d12h → 129600000
500ms → 500
45s → 45000
```

**Format milliseconds to human-readable:**
```
9000000 → 2h 30m
86400000 → 1d
3661000 → 1h 1m 1s
```

## Supported Units

| Unit | Aliases | Value |
|------|---------|-------|
| ms | millisecond, milliseconds | 1ms |
| s | sec, second, seconds | 1000ms |
| m | min, minute, minutes | 60s |
| h | hr, hour, hours | 60m |
| d | day, days | 24h |
| w | wk, week, weeks | 7d |

## Examples

- Cron scheduling: "Run every 30m" → 1800000ms
- Timeouts: "Timeout after 5s" → 5000ms  
- Reminders: "Remind me in 2h30m" → 9000000ms
- Uptime display: 86461000 → "1d 1m 1s"

## Options

- `parse(input)` - String to milliseconds
- `format(ms)` - Milliseconds to string
- `format(ms, { compact: true })` - Shortest representation ("2h" not "2h 0m 0s")
- `format(ms, { units: ['h', 'm'] })` - Only use specific units
