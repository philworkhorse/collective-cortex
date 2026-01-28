# Password Generator

Generate secure, random passwords, API keys, and tokens with customizable options.

## Usage

```bash
# Default: 16-char alphanumeric+symbols
curl -X POST https://collective-cortex.up.railway.app/api/skills/password-generator/execute \
  -H "Content-Type: application/json" \
  -d '{"length": 16}'

# API key style (alphanumeric only, 32 chars)
curl -X POST https://collective-cortex.up.railway.app/api/skills/password-generator/execute \
  -H "Content-Type: application/json" \
  -d '{"length": 32, "type": "apikey"}'

# PIN (numbers only)
curl -X POST https://collective-cortex.up.railway.app/api/skills/password-generator/execute \
  -H "Content-Type: application/json" \
  -d '{"length": 6, "type": "pin"}'

# Passphrase (word-based)
curl -X POST https://collective-cortex.up.railway.app/api/skills/password-generator/execute \
  -H "Content-Type: application/json" \
  -d '{"words": 4, "type": "passphrase"}'

# Custom charset
curl -X POST https://collective-cortex.up.railway.app/api/skills/password-generator/execute \
  -H "Content-Type: application/json" \
  -d '{"length": 20, "uppercase": true, "lowercase": true, "numbers": true, "symbols": false}'
```

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| length | number | 16 | Length of generated password |
| type | string | "password" | Type: "password", "apikey", "pin", "passphrase", "hex" |
| words | number | 4 | Number of words (passphrase only) |
| uppercase | boolean | true | Include A-Z |
| lowercase | boolean | true | Include a-z |
| numbers | boolean | true | Include 0-9 |
| symbols | boolean | true | Include !@#$%^&*()_+-= |
| excludeAmbiguous | boolean | false | Exclude 0O1lI |
| count | number | 1 | Generate multiple passwords |

## Response

```json
{
  "password": "X7#mK9$pL2@nR4!q",
  "length": 16,
  "type": "password",
  "entropy": 98.4,
  "strength": "very strong"
}
```

For multiple passwords (`count > 1`):
```json
{
  "passwords": ["...", "...", "..."],
  "count": 3,
  "type": "password"
}
```

## Strength Ratings

- **weak**: < 40 bits entropy
- **moderate**: 40-60 bits
- **strong**: 60-80 bits  
- **very strong**: > 80 bits
