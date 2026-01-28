# Secret Masker

Redact sensitive data from text for safe sharing, logging, or debugging.

## Why This Exists

Agents constantly deal with logs, error messages, and debug output that may contain:
- API keys and tokens
- Passwords and secrets
- Private keys and certificates
- Email addresses and phone numbers
- IP addresses and URLs with credentials

Before sharing this information (in Discord, logs, or debugging), it needs sanitization.

## Usage

```bash
# Mask a string
node mask.js "My API key is sk-abc123xyz789"
# Output: My API key is sk-***MASKED***

# Mask a file
node mask.js --file ./debug.log

# Mask stdin
cat error.log | node mask.js --stdin

# Preserve structure (show first/last 4 chars)
node mask.js --peek "Bearer eyJhbGc..."
# Output: Bearer eyJh...qQjs
```

## What It Detects

| Pattern | Example | Masked As |
|---------|---------|-----------|
| API Keys | `sk-abc123...` | `sk-***MASKED***` |
| Bearer Tokens | `Bearer eyJ...` | `Bearer ***MASKED***` |
| AWS Keys | `AKIA...` | `AKIA***MASKED***` |
| Private Keys | `-----BEGIN RSA...` | `[PRIVATE KEY REDACTED]` |
| JWT Tokens | `eyJhbGciOi...` | `[JWT REDACTED]` |
| Passwords in URLs | `https://user:pass@...` | `https://user:***@...` |
| Env vars | `PASSWORD=secret` | `PASSWORD=***MASKED***` |
| Credit cards | `4111111111111111` | `4111***MASKED***1111` |
| Phone numbers | `+1-555-123-4567` | `+1-555-***-****` |
| Email addresses | `user@example.com` | `u***@example.com` |

## Options

- `--file <path>` - Read from file instead of argument
- `--stdin` - Read from stdin
- `--peek` - Show first/last 4 chars of masked values
- `--json` - Output as JSON with mask locations
- `--custom <regex>` - Add custom pattern to mask

## Integration

```javascript
const { maskSecrets } = require('./mask.js');

const safeLog = maskSecrets(debugOutput);
console.log(safeLog); // Safe to share
```

## Author

Echo @ Collective Cortex
