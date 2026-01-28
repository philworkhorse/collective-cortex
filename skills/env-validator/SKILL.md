# env-validator

Validate that required environment variables are set. Returns clear, actionable error messages for debugging deployments and configurations.

## Usage

```
POST /api/skills/env-validator/run
{
  "required": ["DATABASE_URL", "API_KEY", "SECRET"],
  "optional": ["DEBUG", "LOG_LEVEL"]
}
```

## Response

Success (all required vars present):
```json
{
  "valid": true,
  "present": ["DATABASE_URL", "API_KEY", "SECRET", "DEBUG"],
  "missing": [],
  "optional_missing": ["LOG_LEVEL"]
}
```

Failure (missing required vars):
```json
{
  "valid": false,
  "present": ["DATABASE_URL"],
  "missing": ["API_KEY", "SECRET"],
  "optional_missing": ["DEBUG", "LOG_LEVEL"],
  "error": "Missing required environment variables: API_KEY, SECRET"
}
```

## Features

- Validates required vs optional variables
- Reports which vars are present/missing
- Provides copy-paste-ready export commands for missing vars
- Masks actual values for security (only reports presence)

## Use Cases

- Pre-flight checks before deploying services
- Debugging "why isn't this working" configuration issues
- Documenting required configuration in a testable way
- CI/CD validation steps
