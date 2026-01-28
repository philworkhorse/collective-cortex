/**
 * csv-json: Convert between CSV and JSON formats
 * Handles quoting, escaping, custom delimiters, and nested objects
 */

function parseCSV(csv, options = {}) {
  const { headers = true, delimiter = ',', skipEmpty = true } = options;
  
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const nextChar = csv[i + 1];
    
    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++;
        } else {
          // End of quoted field
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField.trim());
        if (!skipEmpty || currentRow.some(f => f !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
        if (char === '\r') i++; // Skip \n in \r\n
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }
  
  // Handle last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (!skipEmpty || currentRow.some(f => f !== '')) {
      rows.push(currentRow);
    }
  }
  
  if (rows.length === 0) return [];
  
  if (headers) {
    const headerRow = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headerRow.forEach((header, i) => {
        obj[header] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
  }
  
  return rows;
}

function flattenObject(obj, prefix = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else {
      result[newKey] = value;
    }
  }
  
  return result;
}

function escapeCSVField(value, delimiter) {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  const needsQuotes = str.includes(delimiter) || 
                      str.includes('"') || 
                      str.includes('\n') || 
                      str.includes('\r');
  
  if (needsQuotes) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function jsonToCSV(data, options = {}) {
  const { includeHeaders = true, delimiter = ',', columns = null } = options;
  
  if (!Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  // Flatten all objects
  const flatData = data.map(obj => flattenObject(obj));
  
  // Determine columns
  let cols = columns;
  if (!cols) {
    const allKeys = new Set();
    flatData.forEach(obj => Object.keys(obj).forEach(k => allKeys.add(k)));
    cols = Array.from(allKeys);
  }
  
  const rows = [];
  
  if (includeHeaders) {
    rows.push(cols.map(c => escapeCSVField(c, delimiter)).join(delimiter));
  }
  
  for (const obj of flatData) {
    const row = cols.map(col => escapeCSVField(obj[col], delimiter));
    rows.push(row.join(delimiter));
  }
  
  return rows.join('\n');
}

function execute(input) {
  const { action, csv, json, options = {} } = input;
  
  if (action === 'csv_to_json') {
    if (!csv || typeof csv !== 'string') {
      return { error: 'csv field required and must be a string' };
    }
    
    try {
      const result = parseCSV(csv, options);
      return { 
        result,
        rowCount: result.length
      };
    } catch (e) {
      return { error: `Failed to parse CSV: ${e.message}` };
    }
  }
  
  if (action === 'json_to_csv') {
    if (!json) {
      return { error: 'json field required' };
    }
    
    let data = json;
    if (typeof json === 'string') {
      try {
        data = JSON.parse(json);
      } catch (e) {
        return { error: `Invalid JSON: ${e.message}` };
      }
    }
    
    if (!Array.isArray(data)) {
      return { error: 'JSON must be an array of objects' };
    }
    
    try {
      const result = jsonToCSV(data, options);
      return { 
        result,
        rowCount: data.length
      };
    } catch (e) {
      return { error: `Failed to generate CSV: ${e.message}` };
    }
  }
  
  return { 
    error: 'Unknown action. Use "csv_to_json" or "json_to_csv"',
    availableActions: ['csv_to_json', 'json_to_csv']
  };
}

module.exports = { execute, parseCSV, jsonToCSV };
