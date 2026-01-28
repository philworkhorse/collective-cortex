/**
 * markdown-table skill
 * Converts JSON data to formatted Markdown tables
 */

function escapeCell(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Escape pipe characters and trim
  return str.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
}

function truncate(str, maxWidth) {
  if (!maxWidth || str.length <= maxWidth) return str;
  return str.slice(0, maxWidth - 1) + '…';
}

function getAlignment(align, column) {
  if (typeof align === 'object' && align !== null) {
    return align[column] || 'left';
  }
  return align || 'left';
}

function formatSeparator(alignment) {
  switch (alignment) {
    case 'right': return '---:';
    case 'center': return ':---:';
    default: return '---';
  }
}

function generate(options) {
  const { data, columns, headers = {}, alignment = 'left', maxWidth } = options;
  
  if (!data) {
    return { error: 'Missing required field: data' };
  }

  // Normalize data to array of objects
  let rows;
  if (Array.isArray(data)) {
    rows = data;
  } else if (typeof data === 'object') {
    // Convert object with arrays to array of objects
    const keys = Object.keys(data);
    const length = Math.max(...keys.map(k => Array.isArray(data[k]) ? data[k].length : 1));
    rows = [];
    for (let i = 0; i < length; i++) {
      const row = {};
      for (const key of keys) {
        row[key] = Array.isArray(data[key]) ? data[key][i] : data[key];
      }
      rows.push(row);
    }
  } else {
    return { error: 'Data must be an array or object' };
  }

  if (rows.length === 0) {
    return { table: '', rowCount: 0 };
  }

  // Determine columns
  const cols = columns || [...new Set(rows.flatMap(r => Object.keys(r)))];
  
  if (cols.length === 0) {
    return { error: 'No columns found in data' };
  }

  // Build header row
  const headerRow = cols.map(col => {
    const header = headers[col] || col;
    return escapeCell(maxWidth ? truncate(header, maxWidth) : header);
  });

  // Build separator row
  const separatorRow = cols.map(col => formatSeparator(getAlignment(alignment, col)));

  // Build data rows
  const dataRows = rows.map(row => {
    return cols.map(col => {
      let value = row[col];
      // Handle booleans nicely
      if (typeof value === 'boolean') value = value ? '✓' : '✗';
      const cell = escapeCell(value);
      return maxWidth ? truncate(cell, maxWidth) : cell;
    });
  });

  // Assemble table
  const lines = [
    '| ' + headerRow.join(' | ') + ' |',
    '|' + separatorRow.join('|') + '|',
    ...dataRows.map(row => '| ' + row.join(' | ') + ' |')
  ];

  return {
    table: lines.join('\n'),
    rowCount: dataRows.length,
    columnCount: cols.length
  };
}

// Export for use in Collective Cortex
module.exports = { generate };

// Also support direct execution for testing
if (require.main === module) {
  const testData = [
    { name: 'Alice', role: 'Admin', score: 95 },
    { name: 'Bob', role: 'User', score: 87 },
    { name: 'Charlie', role: 'User', score: 92 }
  ];
  
  console.log('Basic table:');
  console.log(generate({ data: testData }).table);
  
  console.log('\nWith custom headers and right-aligned scores:');
  console.log(generate({
    data: testData,
    columns: ['name', 'score', 'role'],
    headers: { name: 'User', score: 'Points', role: 'Access Level' },
    alignment: { score: 'right' }
  }).table);
}
