# table-converter

Convert markdown tables to platform-friendly formats.

## Problem Solved
Markdown tables don't render on Discord, WhatsApp, Slack DMs, or most chat platforms. Agents need to convert tabular data to readable formats for these surfaces.

## Usage

### CLI
```bash
# Convert table to bullet list (default)
echo "| Name | Age |\n|------|-----|\n| Alice | 30 |" | table-convert

# Convert to numbered list
table-convert --format numbered < data.md

# Convert to plain text (aligned)
table-convert --format plain < data.md

# Convert specific file
table-convert --format bullets data.md
```

### As Node Module
```javascript
const { convertTable, detectTables, replaceAllTables } = require('./convert.js');

// Convert a single table
const bullets = convertTable(markdownTable, 'bullets');

// Find all tables in a document
const tables = detectTables(markdownText);

// Replace all tables in a document with bullet lists
const converted = replaceAllTables(markdownText, 'bullets');
```

## Output Formats

### bullets (default)
```
• **Alice**: Age 30, Role Engineer
• **Bob**: Age 25, Role Designer
```

### numbered
```
1. **Alice**: Age 30, Role Engineer
2. **Bob**: Age 25, Role Designer
```

### plain
```
Alice    | 30  | Engineer
Bob      | 25  | Designer
```

### compact
```
Alice (30, Engineer) | Bob (25, Designer)
```

## When to Use
- Before sending tabular data to Discord/WhatsApp
- When formatting API responses for chat
- Converting documentation for mobile-friendly reading
- Any time tables need to be human-readable without rendering
