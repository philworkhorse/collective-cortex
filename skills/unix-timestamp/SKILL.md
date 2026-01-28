# unix-timestamp

Convert between Unix timestamps and human-readable dates.

## Usage

```
POST /api/skills/unix-timestamp/run
{
  "input": "1706450400"        // Unix timestamp → human date
}

POST /api/skills/unix-timestamp/run
{
  "input": "2024-01-28T14:00:00Z"  // ISO date → Unix timestamp
}

POST /api/skills/unix-timestamp/run
{
  "input": "now"               // Current time as Unix timestamp
}
```

## Features

- Converts Unix timestamps (seconds) to ISO 8601 dates
- Converts Unix timestamps in milliseconds (auto-detected)
- Converts ISO dates/times to Unix timestamps
- Handles "now" for current timestamp
- Returns both seconds and milliseconds formats
- Shows relative time ("2 hours ago", "in 3 days")

## Examples

Input: `1706450400`
Output:
```json
{
  "unix_seconds": 1706450400,
  "unix_ms": 1706450400000,
  "iso": "2024-01-28T14:00:00.000Z",
  "local": "Sun Jan 28 2024 09:00:00 GMT-0500",
  "relative": "1 year ago"
}
```

Input: `2024-06-15T09:30:00Z`
Output:
```json
{
  "unix_seconds": 1718440200,
  "unix_ms": 1718440200000,
  "iso": "2024-06-15T09:30:00.000Z",
  "relative": "in 5 months"
}
```

## Use Cases

- Debugging API responses with timestamp fields
- Converting log timestamps for readability
- Calculating time differences
- Setting up scheduled tasks with Unix time
