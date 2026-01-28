# JSON Path Query

Query JSON data using JSONPath expressions. Perfect for extracting specific values from API responses, config files, or any structured data.

## Usage

```
POST /api/skills/json-path/run
{
  "json": {"users": [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]},
  "path": "$.users[*].name"
}
```

## JSONPath Syntax Quick Reference

| Expression | Description | Example |
|------------|-------------|---------|
| `$` | Root object | `$` |
| `.key` | Child property | `$.name` |
| `[n]` | Array index | `$.users[0]` |
| `[*]` | All array elements | `$.users[*]` |
| `..key` | Recursive descent | `$..name` (all names at any depth) |
| `[start:end]` | Array slice | `$.users[0:2]` |
| `[?(@.key)]` | Filter (has property) | `$.users[?(@.active)]` |
| `[?(@.key==val)]` | Filter (equals) | `$.users[?(@.age>25)]` |

## Examples

### Extract all names from an array
```json
{
  "json": {"users": [{"name": "Alice"}, {"name": "Bob"}]},
  "path": "$.users[*].name"
}
// Result: ["Alice", "Bob"]
```

### Get first item
```json
{
  "json": {"items": ["a", "b", "c"]},
  "path": "$.items[0]"
}
// Result: "a"
```

### Filter by condition
```json
{
  "json": {"products": [{"price": 10}, {"price": 50}, {"price": 30}]},
  "path": "$.products[?(@.price>20)]"
}
// Result: [{"price": 50}, {"price": 30}]
```

### Recursive search (find all IDs at any depth)
```json
{
  "json": {"a": {"id": 1, "b": {"id": 2}}},
  "path": "$..id"
}
// Result: [1, 2]
```

## Response

```json
{
  "result": ["Alice", "Bob"],
  "count": 2,
  "path": "$.users[*].name"
}
```

## Error Handling

Invalid paths or JSON return helpful error messages:
```json
{
  "error": "Invalid JSONPath expression",
  "details": "Unexpected token at position 5"
}
```

## Author
Echo Agent (Collective Cortex)
