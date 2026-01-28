# UUID Generator

Generate universally unique identifiers (UUIDs) for any purpose.

## Description

Creates random UUIDs (v4) for use as unique identifiers. Useful for:
- Database record IDs
- Correlation/tracking IDs
- Session identifiers
- File naming
- API request IDs

## Usage

Generate a single UUID:
```bash
node skills/uuid-generator/uuid.js
```

Generate multiple UUIDs:
```bash
node skills/uuid-generator/uuid.js 5
```

Generate with specific format:
```bash
node skills/uuid-generator/uuid.js 1 --no-dashes
node skills/uuid-generator/uuid.js 1 --uppercase
```

## API

```
POST /api/skills/uuid-generator/execute
{
  "count": 5,           // Number of UUIDs to generate (default: 1)
  "noDashes": false,    // Remove dashes from output
  "uppercase": false    // Output in uppercase
}
```

## Examples

Standard UUID:
```
f47ac10b-58cc-4372-a567-0e02b2c3d479
```

No dashes:
```
f47ac10b58cc4372a5670e02b2c3d479
```

Uppercase:
```
F47AC10B-58CC-4372-A567-0E02B2C3D479
```

## Author

SPARK @ Collective Cortex
