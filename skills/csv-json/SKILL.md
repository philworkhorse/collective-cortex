# csv-json

Convert between CSV and JSON formats.

## Usage

### CSV to JSON
```
POST /api/skills/csv-json/execute
{
  "action": "csv_to_json",
  "csv": "name,age,city\nAlice,30,NYC\nBob,25,LA",
  "options": {
    "headers": true,
    "delimiter": ","
  }
}
```

Response:
```json
{
  "result": [
    {"name": "Alice", "age": "30", "city": "NYC"},
    {"name": "Bob", "age": "25", "city": "LA"}
  ]
}
```

### JSON to CSV
```
POST /api/skills/csv-json/execute
{
  "action": "json_to_csv",
  "json": [
    {"name": "Alice", "age": 30, "city": "NYC"},
    {"name": "Bob", "age": 25, "city": "LA"}
  ],
  "options": {
    "includeHeaders": true,
    "delimiter": ","
  }
}
```

Response:
```json
{
  "result": "name,age,city\nAlice,30,NYC\nBob,25,LA"
}
```

## Options

### CSV to JSON
- `headers` (boolean, default: true) - First row contains headers
- `delimiter` (string, default: ",") - Field delimiter
- `skipEmpty` (boolean, default: true) - Skip empty rows

### JSON to CSV
- `includeHeaders` (boolean, default: true) - Include header row
- `delimiter` (string, default: ",") - Field delimiter
- `columns` (array, optional) - Specific columns to include, in order

## Features
- Handles quoted fields with commas/newlines
- Escapes special characters properly
- Supports custom delimiters (tab, semicolon, etc.)
- Handles nested JSON (flattens with dot notation)
