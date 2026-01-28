/**
 * JSON Path Query
 * Extract data from JSON using JSONPath expressions
 * 
 * Supports: $, ., [], [*], [n], [start:end], .., [?(@.key)], [?(@.key==val)]
 */

function jsonPath(obj, path) {
  if (!path || path === '$') return [obj];
  
  // Tokenize the path
  const tokens = tokenize(path);
  if (tokens[0] !== '$') {
    throw new Error('JSONPath must start with $');
  }
  
  let results = [obj];
  
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    const nextResults = [];
    
    for (const current of results) {
      if (current === null || current === undefined) continue;
      
      if (token === '..') {
        // Recursive descent - handled with next token
        const nextToken = tokens[i + 1];
        if (nextToken) {
          nextResults.push(...recursiveDescend(current, nextToken));
          i++; // Skip next token as we handled it
        }
      } else if (token.startsWith('[') && token.endsWith(']')) {
        // Bracket notation
        const inner = token.slice(1, -1);
        nextResults.push(...handleBracket(current, inner));
      } else {
        // Dot notation - property access
        if (typeof current === 'object' && current !== null && token in current) {
          nextResults.push(current[token]);
        }
      }
    }
    
    results = nextResults;
  }
  
  return results;
}

function tokenize(path) {
  const tokens = [];
  let i = 0;
  
  while (i < path.length) {
    if (path[i] === '$') {
      tokens.push('$');
      i++;
    } else if (path[i] === '.') {
      if (path[i + 1] === '.') {
        tokens.push('..');
        i += 2;
        // Read property name directly after ..
        let name = '';
        while (i < path.length && /[a-zA-Z0-9_]/.test(path[i])) {
          name += path[i];
          i++;
        }
        if (name) tokens.push(name);
      } else {
        i++; // Skip the dot
        // Read property name
        let name = '';
        while (i < path.length && /[a-zA-Z0-9_]/.test(path[i])) {
          name += path[i];
          i++;
        }
        if (name) tokens.push(name);
      }
    } else if (path[i] === '[') {
      // Read until matching ]
      let bracket = '[';
      let depth = 1;
      i++;
      while (i < path.length && depth > 0) {
        if (path[i] === '[') depth++;
        if (path[i] === ']') depth--;
        bracket += path[i];
        i++;
      }
      tokens.push(bracket);
    } else {
      i++;
    }
  }
  
  return tokens;
}

function handleBracket(obj, inner) {
  const results = [];
  
  // Wildcard [*]
  if (inner === '*') {
    if (Array.isArray(obj)) {
      results.push(...obj);
    } else if (typeof obj === 'object' && obj !== null) {
      results.push(...Object.values(obj));
    }
  }
  // Filter [?(@.condition)]
  else if (inner.startsWith('?(') && inner.endsWith(')')) {
    const filterExpr = inner.slice(2, -1);
    if (Array.isArray(obj)) {
      for (const item of obj) {
        if (evaluateFilter(item, filterExpr)) {
          results.push(item);
        }
      }
    }
  }
  // Slice [start:end]
  else if (inner.includes(':')) {
    const [start, end] = inner.split(':').map(s => s ? parseInt(s, 10) : undefined);
    if (Array.isArray(obj)) {
      results.push(...obj.slice(start, end));
    }
  }
  // Index [n] or property ['name']
  else {
    let key = inner;
    // Handle quoted strings
    if ((inner.startsWith("'") && inner.endsWith("'")) ||
        (inner.startsWith('"') && inner.endsWith('"'))) {
      key = inner.slice(1, -1);
    }
    // Handle numeric index
    const numKey = parseInt(key, 10);
    if (!isNaN(numKey) && Array.isArray(obj)) {
      if (numKey >= 0 && numKey < obj.length) {
        results.push(obj[numKey]);
      }
    } else if (typeof obj === 'object' && obj !== null && key in obj) {
      results.push(obj[key]);
    }
  }
  
  return results;
}

function evaluateFilter(item, expr) {
  if (typeof item !== 'object' || item === null) return false;
  
  // Parse @.property or @.property==value or @.property>value etc
  const match = expr.match(/@\.(\w+)\s*(==|!=|>|<|>=|<=)?\s*(.+)?/);
  if (!match) return false;
  
  const [, prop, op, rawVal] = match;
  const itemValue = item[prop];
  
  // Just checking existence: [?(@.active)]
  if (!op) {
    return itemValue !== undefined && itemValue !== null && itemValue !== false;
  }
  
  // Parse the comparison value
  let compareValue = rawVal?.trim();
  if (compareValue) {
    // Handle quoted strings
    if ((compareValue.startsWith("'") && compareValue.endsWith("'")) ||
        (compareValue.startsWith('"') && compareValue.endsWith('"'))) {
      compareValue = compareValue.slice(1, -1);
    }
    // Handle numbers
    else if (!isNaN(parseFloat(compareValue))) {
      compareValue = parseFloat(compareValue);
    }
    // Handle booleans
    else if (compareValue === 'true') compareValue = true;
    else if (compareValue === 'false') compareValue = false;
    else if (compareValue === 'null') compareValue = null;
  }
  
  switch (op) {
    case '==': return itemValue == compareValue;
    case '!=': return itemValue != compareValue;
    case '>': return itemValue > compareValue;
    case '<': return itemValue < compareValue;
    case '>=': return itemValue >= compareValue;
    case '<=': return itemValue <= compareValue;
    default: return false;
  }
}

function recursiveDescend(obj, targetKey) {
  const results = [];
  
  function descend(current) {
    if (typeof current !== 'object' || current === null) return;
    
    if (Array.isArray(current)) {
      for (const item of current) {
        descend(item);
      }
    } else {
      for (const [key, value] of Object.entries(current)) {
        if (key === targetKey) {
          results.push(value);
        }
        descend(value);
      }
    }
  }
  
  descend(obj);
  return results;
}

// Main handler for Collective Cortex
function run(input) {
  const { json, path } = input;
  
  if (json === undefined) {
    return { error: 'Missing required field: json' };
  }
  if (!path) {
    return { error: 'Missing required field: path' };
  }
  
  // Parse JSON if string
  let data = json;
  if (typeof json === 'string') {
    try {
      data = JSON.parse(json);
    } catch (e) {
      return { error: 'Invalid JSON', details: e.message };
    }
  }
  
  try {
    const result = jsonPath(data, path);
    
    // Unwrap single results for convenience
    const finalResult = result.length === 1 ? result[0] : result;
    
    return {
      result: finalResult,
      count: Array.isArray(finalResult) ? finalResult.length : 1,
      path: path
    };
  } catch (e) {
    return { error: 'Invalid JSONPath expression', details: e.message };
  }
}

module.exports = { run, jsonPath };
