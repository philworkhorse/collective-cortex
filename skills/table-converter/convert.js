#!/usr/bin/env node
/**
 * table-converter - Convert markdown tables to platform-friendly formats
 * 
 * Solves the real problem: tables don't render on Discord, WhatsApp, etc.
 */

/**
 * Parse a markdown table into structured data
 * @param {string} tableText - Raw markdown table
 * @returns {Object} { headers: string[], rows: string[][], raw: string }
 */
function parseTable(tableText) {
  const lines = tableText.trim().split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return null; // Not a valid table
  }
  
  const parseRow = (line) => {
    return line
      .replace(/^\||\|$/g, '') // Remove leading/trailing pipes
      .split('|')
      .map(cell => cell.trim());
  };
  
  const headers = parseRow(lines[0]);
  
  // Check for separator row (---|---|---)
  const separatorIdx = lines.findIndex(line => /^[\s|:-]+$/.test(line));
  if (separatorIdx === -1) {
    return null; // No separator = not a markdown table
  }
  
  const rows = lines
    .slice(separatorIdx + 1)
    .filter(line => line.includes('|'))
    .map(parseRow);
  
  return { headers, rows, raw: tableText };
}

/**
 * Detect all markdown tables in a text
 * @param {string} text - Full markdown text
 * @returns {Object[]} Array of { start, end, table, parsed }
 */
function detectTables(text) {
  const tables = [];
  // Match tables: header line, separator line, then data lines
  // Handles tables with or without leading/trailing pipes
  const tableRegex = /^(\|?.+\|.+\|?)\n(\|?[\s:-]+\|[\s:-]+\|?)\n((?:\|?.+\|.+\|?\n?)+)/gm;
  
  let match;
  while ((match = tableRegex.exec(text)) !== null) {
    const tableText = match[0].trim();
    const parsed = parseTable(tableText);
    if (parsed && parsed.rows.length > 0) {
      tables.push({
        start: match.index,
        end: match.index + match[0].length,
        table: tableText,
        parsed
      });
    }
  }
  
  // Fallback: if no tables found but the whole text looks like a table
  if (tables.length === 0) {
    const parsed = parseTable(text);
    if (parsed && parsed.rows.length > 0) {
      tables.push({
        start: 0,
        end: text.length,
        table: text,
        parsed
      });
    }
  }
  
  return tables;
}

/**
 * Convert parsed table to bullet list format
 */
function toBullets(parsed) {
  const { headers, rows } = parsed;
  
  return rows.map(row => {
    // First column as bold header, rest as key: value pairs
    const [primary, ...rest] = row;
    const details = rest
      .map((val, i) => `${headers[i + 1]} ${val}`)
      .filter(d => d.trim() && !d.match(/^\w+\s*$/)) // Skip empty values
      .join(', ');
    
    if (details) {
      return `• **${primary}**: ${details}`;
    }
    return `• **${primary}**`;
  }).join('\n');
}

/**
 * Convert parsed table to numbered list format
 */
function toNumbered(parsed) {
  const { headers, rows } = parsed;
  
  return rows.map((row, idx) => {
    const [primary, ...rest] = row;
    const details = rest
      .map((val, i) => `${headers[i + 1]} ${val}`)
      .filter(d => d.trim() && !d.match(/^\w+\s*$/))
      .join(', ');
    
    if (details) {
      return `${idx + 1}. **${primary}**: ${details}`;
    }
    return `${idx + 1}. **${primary}**`;
  }).join('\n');
}

/**
 * Convert parsed table to aligned plain text
 */
function toPlain(parsed) {
  const { headers, rows } = parsed;
  const allRows = [headers, ...rows];
  
  // Calculate column widths
  const colWidths = headers.map((_, colIdx) => {
    return Math.max(...allRows.map(row => (row[colIdx] || '').length));
  });
  
  // Format rows
  return rows.map(row => {
    return row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | ');
  }).join('\n');
}

/**
 * Convert parsed table to compact inline format
 */
function toCompact(parsed) {
  const { headers, rows } = parsed;
  
  return rows.map(row => {
    const [primary, ...rest] = row;
    if (rest.length > 0 && rest.some(v => v.trim())) {
      return `${primary} (${rest.filter(v => v.trim()).join(', ')})`;
    }
    return primary;
  }).join(' | ');
}

/**
 * Convert a markdown table to specified format
 * @param {string} tableText - Raw markdown table
 * @param {string} format - 'bullets' | 'numbered' | 'plain' | 'compact'
 * @returns {string} Converted output
 */
function convertTable(tableText, format = 'bullets') {
  const parsed = parseTable(tableText);
  if (!parsed) {
    return tableText; // Return original if not a valid table
  }
  
  switch (format) {
    case 'bullets':
      return toBullets(parsed);
    case 'numbered':
      return toNumbered(parsed);
    case 'plain':
      return toPlain(parsed);
    case 'compact':
      return toCompact(parsed);
    default:
      return toBullets(parsed);
  }
}

/**
 * Replace all tables in a document with converted format
 * @param {string} text - Full markdown text
 * @param {string} format - Output format
 * @returns {string} Text with tables replaced
 */
function replaceAllTables(text, format = 'bullets') {
  const tables = detectTables(text);
  
  // Replace from end to start to preserve indices
  let result = text;
  for (let i = tables.length - 1; i >= 0; i--) {
    const { start, end, table } = tables[i];
    const converted = convertTable(table, format);
    result = result.slice(0, start) + converted + result.slice(end);
  }
  
  return result;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  let format = 'bullets';
  let inputFile = null;
  
  // Parse args
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format' || args[i] === '-f') {
      format = args[++i];
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
table-convert - Convert markdown tables to platform-friendly formats

Usage:
  echo "table" | table-convert [--format FORMAT]
  table-convert [--format FORMAT] <file>

Formats:
  bullets   (default) Bullet list with bold headers
  numbered  Numbered list
  plain     Aligned plain text
  compact   Inline comma-separated

Examples:
  cat data.md | table-convert --format bullets
  table-convert --format plain report.md
`);
      process.exit(0);
    } else if (!args[i].startsWith('-')) {
      inputFile = args[i];
    }
  }
  
  // Read input
  const fs = require('fs');
  let input;
  
  if (inputFile) {
    input = fs.readFileSync(inputFile, 'utf8');
  } else if (!process.stdin.isTTY) {
    input = fs.readFileSync(0, 'utf8'); // Read from stdin
  } else {
    console.error('Error: No input provided. Pipe a table or specify a file.');
    process.exit(1);
  }
  
  // Convert and output
  console.log(replaceAllTables(input, format));
}

module.exports = { parseTable, detectTables, convertTable, replaceAllTables };
