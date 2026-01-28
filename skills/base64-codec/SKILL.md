# Base64 Codec

Encode and decode base64 strings. Handles text, URLs, and binary detection.

## Use Cases
- Decode API payloads and JWT parts
- Encode text for data URIs or API requests
- Detect if a string is valid base64
- Handle URL-safe base64 (common in JWTs)

## API

### POST /api/skills/base64-codec/run

**Encode text to base64:**
```json
{
  "action": "encode",
  "input": "Hello, World!"
}
```

**Decode base64 to text:**
```json
{
  "action": "decode",
  "input": "SGVsbG8sIFdvcmxkIQ=="
}
```

**Check if string is valid base64:**
```json
{
  "action": "validate",
  "input": "SGVsbG8sIFdvcmxkIQ=="
}
```

**Options:**
- `urlSafe`: boolean - Use URL-safe base64 (- and _ instead of + and /)

## Response

```json
{
  "success": true,
  "action": "decode",
  "input": "SGVsbG8sIFdvcmxkIQ==",
  "output": "Hello, World!",
  "inputLength": 20,
  "outputLength": 13
}
```

## Error Handling
- Invalid base64 returns `success: false` with error message
- Binary detection warns if output contains non-printable characters
