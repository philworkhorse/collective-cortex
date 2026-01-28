/**
 * JSON Fixer - Repairs common JSON malformations
 * 
 * Handles:
 * - Trailing commas in arrays and objects
 * - Unquoted property keys
 * - Single quotes instead of double quotes
 * - Unescaped control characters
 * - Missing quotes around string values
 * - JavaScript-style comments (removes them)
 * - Truncated JSON (reports gracefully)
 */

function fixJson(input, pretty = true) {
  if (!input || typeof input !== 'string') {
    return { success: false, error: 'Input must be a non-empty string' };
  }

  let json = input.trim();
  
  // Track what we fixed
  const fixes = [];

  // Remove JavaScript-style comments
  const commentRegex = /\/\/.*$|\/\*[\s\S]*?\*\//gm;
  if (commentRegex.test(json)) {
    json = json.replace(commentRegex, '');
    fixes.push('Removed JavaScript comments');
  }

  // Replace single quotes with double quotes (but not inside double-quoted strings)
  // This is a simplified approach - handles most common cases
  const singleQuotePattern = /'([^'\\]*(\\.[^'\\]*)*)'/g;
  const hasSingleQuotes = singleQuotePattern.test(json);
  if (hasSingleQuotes) {
    json = json.replace(singleQuotePattern, '"$1"');
    fixes.push('Converted single quotes to double quotes');
  }

  // Fix unquoted keys: { key: "value" } -> { "key": "value" }
  const unquotedKeyPattern = /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*:)/g;
  if (unquotedKeyPattern.test(json)) {
    json = json.replace(unquotedKeyPattern, '$1"$2"$3');
    fixes.push('Added quotes to unquoted property keys');
  }

  // Remove trailing commas before } or ]
  const trailingCommaPattern = /,(\s*[}\]])/g;
  if (trailingCommaPattern.test(json)) {
    json = json.replace(trailingCommaPattern, '$1');
    fixes.push('Removed trailing commas');
  }

  // Fix common escape issues - unescaped newlines in strings
  // Replace actual newlines inside strings with \n
  json = fixUnescapedNewlines(json, fixes);

  // Try to parse
  try {
    const parsed = JSON.parse(json);
    const output = pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
    
    return {
      success: true,
      output,
      fixed: fixes.length > 0,
      fixes,
      original: input
    };
  } catch (e) {
    // If still invalid, try more aggressive fixes
    const aggressiveResult = aggressiveFix(json, fixes);
    if (aggressiveResult.success) {
      const output = pretty 
        ? JSON.stringify(aggressiveResult.parsed, null, 2) 
        : JSON.stringify(aggressiveResult.parsed);
      return {
        success: true,
        output,
        fixed: true,
        fixes: aggressiveResult.fixes,
        original: input
      };
    }

    return {
      success: false,
      error: e.message,
      position: extractErrorPosition(e.message),
      fixes,
      partiallyFixed: json,
      hint: generateHint(json, e.message)
    };
  }
}

function fixUnescapedNewlines(json, fixes) {
  // This is tricky - we need to find strings and escape newlines in them
  let result = '';
  let inString = false;
  let escaped = false;
  let modified = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && (char === '\n' || char === '\r')) {
      result += char === '\n' ? '\\n' : '\\r';
      modified = true;
      continue;
    }

    result += char;
  }

  if (modified) {
    fixes.push('Escaped unescaped newlines in strings');
  }

  return result;
}

function aggressiveFix(json, existingFixes) {
  const fixes = [...existingFixes];

  // Try to fix truncated JSON by closing brackets
  let fixed = json;
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/]/g) || []).length;

  if (openBraces > closeBraces || openBrackets > closeBrackets) {
    // Remove trailing incomplete content
    fixed = fixed.replace(/,?\s*"[^"]*$/, ''); // Remove incomplete string at end
    fixed = fixed.replace(/,?\s*[a-zA-Z0-9_]*$/, ''); // Remove incomplete value at end
    
    // Add missing closing brackets
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += ']';
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += '}';
    }
    fixes.push('Closed truncated JSON structure');
  }

  // Try to fix missing commas between elements
  fixed = fixed.replace(/}(\s*){/g, '},$1{');
  fixed = fixed.replace(/](\s*)\[/g, '],$1[');
  fixed = fixed.replace(/"(\s*)"/g, '",$1"');
  
  try {
    const parsed = JSON.parse(fixed);
    return { success: true, parsed, fixes };
  } catch (e) {
    return { success: false };
  }
}

function extractErrorPosition(errorMessage) {
  const posMatch = errorMessage.match(/position\s*(\d+)/i);
  if (posMatch) {
    return parseInt(posMatch[1], 10);
  }
  const colMatch = errorMessage.match(/column\s*(\d+)/i);
  if (colMatch) {
    return parseInt(colMatch[1], 10);
  }
  return null;
}

function generateHint(json, errorMessage) {
  const hints = [];
  
  if (errorMessage.includes('Unexpected token')) {
    hints.push('Check for missing commas between array/object elements');
    hints.push('Look for unquoted string values');
  }
  
  if (errorMessage.includes('Unexpected end')) {
    hints.push('JSON appears truncated - check if data was cut off');
    hints.push('Missing closing brackets } or ]');
  }

  if (json.includes('undefined') || json.includes('NaN')) {
    hints.push('JSON contains JavaScript-only values (undefined, NaN) - these must be null or removed');
  }

  if (json.includes('new Date') || json.includes('function')) {
    hints.push('JSON contains JavaScript code - only data is valid JSON');
  }

  return hints.length > 0 ? hints : ['Check JSON syntax near the error position'];
}

function validateJson(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Input must be a non-empty string' };
  }

  try {
    const parsed = JSON.parse(input.trim());
    return {
      valid: true,
      type: Array.isArray(parsed) ? 'array' : typeof parsed,
      elementCount: Array.isArray(parsed) ? parsed.length : 
                    (typeof parsed === 'object' && parsed !== null) ? Object.keys(parsed).length : 1
    };
  } catch (e) {
    return {
      valid: false,
      error: e.message,
      position: extractErrorPosition(e.message)
    };
  }
}

function diagnoseJson(input) {
  if (!input || typeof input !== 'string') {
    return { issues: ['Input is empty or not a string'] };
  }

  const json = input.trim();
  const issues = [];

  // Check for common issues
  if (/,\s*[}\]]/.test(json)) {
    issues.push({
      type: 'trailing_comma',
      description: 'Trailing comma before closing bracket',
      fixable: true
    });
  }

  if (/'/.test(json)) {
    issues.push({
      type: 'single_quotes',
      description: 'Single quotes used instead of double quotes',
      fixable: true
    });
  }

  if (/[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/.test(json)) {
    issues.push({
      type: 'unquoted_keys',
      description: 'Object keys are not quoted',
      fixable: true
    });
  }

  if (/\/\/|\/\*/.test(json)) {
    issues.push({
      type: 'comments',
      description: 'JavaScript-style comments present',
      fixable: true
    });
  }

  if (/undefined|NaN/.test(json)) {
    issues.push({
      type: 'js_values',
      description: 'Contains JavaScript-only values (undefined, NaN)',
      fixable: false,
      suggestion: 'Replace with null or valid JSON values'
    });
  }

  const openBraces = (json.match(/{/g) || []).length;
  const closeBraces = (json.match(/}/g) || []).length;
  const openBrackets = (json.match(/\[/g) || []).length;
  const closeBrackets = (json.match(/]/g) || []).length;

  if (openBraces !== closeBraces) {
    issues.push({
      type: 'unbalanced_braces',
      description: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`,
      fixable: openBraces > closeBraces
    });
  }

  if (openBrackets !== closeBrackets) {
    issues.push({
      type: 'unbalanced_brackets',
      description: `Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`,
      fixable: openBrackets > closeBrackets
    });
  }

  // Try to validate
  const validation = validateJson(json);
  
  return {
    issues,
    valid: validation.valid,
    parseError: validation.valid ? null : validation.error,
    canAutoFix: issues.every(i => i.fixable !== false)
  };
}

// Route handler
module.exports = function handler(req, endpoint) {
  const body = req.body || {};
  
  switch (endpoint) {
    case '/fix':
      return fixJson(body.input, body.pretty !== false);
    
    case '/validate':
      return validateJson(body.input);
    
    case '/diagnose':
      return diagnoseJson(body.input);
    
    default:
      return { error: 'Unknown endpoint' };
  }
};
