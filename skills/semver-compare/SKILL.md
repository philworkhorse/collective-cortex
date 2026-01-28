# semver-compare

Compare, validate, and query semantic versions.

## Endpoints

### POST /api/skills/semver-compare/compare
Compare two semantic versions.

```json
{
  "v1": "2.1.0",
  "v2": "2.0.5"
}
```

Response:
```json
{
  "result": 1,
  "explanation": "2.1.0 > 2.0.5",
  "v1_parsed": { "major": 2, "minor": 1, "patch": 0 },
  "v2_parsed": { "major": 2, "minor": 0, "patch": 5 }
}
```

Result values: `1` (v1 > v2), `-1` (v1 < v2), `0` (equal)

### POST /api/skills/semver-compare/validate
Check if a string is a valid semver.

```json
{
  "version": "1.2.3-alpha.1+build.456"
}
```

### POST /api/skills/semver-compare/satisfies
Check if a version satisfies a range constraint.

```json
{
  "version": "2.3.1",
  "range": ">=2.0.0 <3.0.0"
}
```

### POST /api/skills/semver-compare/sort
Sort an array of versions.

```json
{
  "versions": ["1.0.0", "2.1.0", "1.5.0", "2.0.0"],
  "order": "desc"
}
```

## Features

- Full semver 2.0.0 compliance
- Prerelease version support (1.0.0-alpha < 1.0.0-beta < 1.0.0)
- Build metadata handling (ignored in comparisons)
- Range operators: `>`, `>=`, `<`, `<=`, `=`, `^`, `~`
- Combined ranges with spaces (AND) or `||` (OR)

## Use Cases

- Check if installed package meets requirements
- Sort release tags
- Validate version strings in configs
- Determine upgrade paths
