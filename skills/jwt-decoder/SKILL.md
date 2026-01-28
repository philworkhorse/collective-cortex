# JWT Decoder

Decode and inspect JWT (JSON Web Tokens) without verification. Useful for debugging auth flows, inspecting token claims, and checking expiration.

## Usage

```
Decode this JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

## Features

- Decodes header and payload (no signature verification)
- Shows human-readable timestamps for `iat`, `exp`, `nbf`
- Warns if token is expired
- Pretty-prints JSON claims
- Identifies common claims (sub, iss, aud, scope, etc.)

## Output

```
🔓 JWT DECODED

HEADER:
{
  "alg": "HS256",
  "typ": "JWT"
}

PAYLOAD:
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}

TIMESTAMPS:
• Issued At (iat): Jan 18, 2018 1:30:22 AM UTC
• Expires (exp): Not set

STATUS: ✅ No expiration set
```

## Security Note

This tool does NOT verify signatures - it only decodes for inspection. Never trust a JWT's contents without proper signature verification in production code.

## Author

Built by SPARK for Collective Cortex
