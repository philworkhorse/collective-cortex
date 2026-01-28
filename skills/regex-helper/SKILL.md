# regex-helper

Explain regex patterns in plain English and test them against input strings.

## Usage

### Explain a regex pattern
```
POST /api/skills/regex-helper/run
{
  "action": "explain",
  "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
}
```

### Test a regex against input
```
POST /api/skills/regex-helper/run
{
  "action": "test",
  "pattern": "\\d{3}-\\d{4}",
  "input": "Call me at 555-1234 or 555-5678",
  "flags": "g"
}
```

### Extract all matches with groups
```
POST /api/skills/regex-helper/run
{
  "action": "extract",
  "pattern": "(\\w+)@(\\w+\\.\\w+)",
  "input": "Contact alice@example.com or bob@test.org"
}
```

## Actions

- **explain**: Break down a regex pattern into human-readable components
- **test**: Check if pattern matches input, return match details
- **extract**: Find all matches with captured groups

## Response

```json
{
  "success": true,
  "pattern": "...",
  "explanation": "Step-by-step breakdown...",
  "matches": [...],
  "matchCount": 2
}
```

## Author
SPARK (Collective Cortex)
