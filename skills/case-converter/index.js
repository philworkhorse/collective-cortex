/**
 * Case Converter - Transform text between naming conventions
 */

// Split text into words, handling multiple conventions
function splitIntoWords(text, fromCase) {
  if (!text || typeof text !== 'string') return [];
  
  // If fromCase is specified, use specific splitter
  if (fromCase) {
    switch (fromCase) {
      case 'camel':
      case 'pascal':
        return text.split(/(?=[A-Z])/).map(w => w.toLowerCase()).filter(Boolean);
      case 'snake':
      case 'constant':
        return text.split('_').map(w => w.toLowerCase()).filter(Boolean);
      case 'kebab':
        return text.split('-').map(w => w.toLowerCase()).filter(Boolean);
      case 'dot':
        return text.split('.').map(w => w.toLowerCase()).filter(Boolean);
      case 'path':
        return text.split('/').map(w => w.toLowerCase()).filter(Boolean);
      case 'title':
      case 'sentence':
        return text.split(/\s+/).map(w => w.toLowerCase()).filter(Boolean);
    }
  }
  
  // Auto-detect: try multiple patterns
  let words = [];
  
  // Check for separators first
  if (text.includes('_')) {
    words = text.split('_');
  } else if (text.includes('-')) {
    words = text.split('-');
  } else if (text.includes('.')) {
    words = text.split('.');
  } else if (text.includes('/')) {
    words = text.split('/');
  } else if (text.includes(' ')) {
    words = text.split(/\s+/);
  } else {
    // camelCase or PascalCase - split on capital letters
    words = text.split(/(?=[A-Z])/);
    if (words.length === 1) {
      // Single word, just return it
      words = [text];
    }
  }
  
  return words.map(w => w.toLowerCase()).filter(Boolean);
}

// Capitalize first letter
function capitalize(word) {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Convert words to target case
function convertToCase(words, toCase) {
  if (!words || words.length === 0) return '';
  
  switch (toCase) {
    case 'camel':
      return words[0].toLowerCase() + words.slice(1).map(capitalize).join('');
    
    case 'pascal':
      return words.map(capitalize).join('');
    
    case 'snake':
      return words.map(w => w.toLowerCase()).join('_');
    
    case 'kebab':
      return words.map(w => w.toLowerCase()).join('-');
    
    case 'constant':
      return words.map(w => w.toUpperCase()).join('_');
    
    case 'title':
      return words.map(capitalize).join(' ');
    
    case 'sentence':
      return capitalize(words[0]) + ' ' + words.slice(1).map(w => w.toLowerCase()).join(' ');
    
    case 'dot':
      return words.map(w => w.toLowerCase()).join('.');
    
    case 'path':
      return words.map(w => w.toLowerCase()).join('/');
    
    default:
      throw new Error(`Unknown case: ${toCase}. Supported: camel, pascal, snake, kebab, constant, title, sentence, dot, path`);
  }
}

// Detect the current case of text
function detectCase(text) {
  if (!text) return 'unknown';
  
  if (text.includes('_') && text === text.toUpperCase()) return 'constant';
  if (text.includes('_')) return 'snake';
  if (text.includes('-')) return 'kebab';
  if (text.includes('.')) return 'dot';
  if (text.includes('/')) return 'path';
  if (text.includes(' ')) {
    if (text === text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) {
      return 'title';
    }
    return 'sentence';
  }
  if (text[0] === text[0].toUpperCase() && /[a-z]/.test(text)) return 'pascal';
  if (/[A-Z]/.test(text)) return 'camel';
  
  return 'unknown';
}

// Main execution function
function execute(params) {
  const { text, to, from } = params;
  
  if (!text) {
    return {
      success: false,
      error: 'Missing required parameter: text'
    };
  }
  
  if (!to) {
    return {
      success: false,
      error: 'Missing required parameter: to (target case)'
    };
  }
  
  const validCases = ['camel', 'pascal', 'snake', 'kebab', 'constant', 'title', 'sentence', 'dot', 'path'];
  
  if (!validCases.includes(to)) {
    return {
      success: false,
      error: `Invalid target case: ${to}. Valid options: ${validCases.join(', ')}`
    };
  }
  
  if (from && !validCases.includes(from)) {
    return {
      success: false,
      error: `Invalid source case: ${from}. Valid options: ${validCases.join(', ')}`
    };
  }
  
  try {
    const detectedCase = detectCase(text);
    const words = splitIntoWords(text, from);
    const result = convertToCase(words, to);
    
    return {
      success: true,
      result,
      input: text,
      from: from || detectedCase,
      to,
      words
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Batch convert multiple texts
function executeBatch(params) {
  const { texts, to, from } = params;
  
  if (!Array.isArray(texts)) {
    return {
      success: false,
      error: 'texts must be an array'
    };
  }
  
  const results = texts.map(text => execute({ text, to, from }));
  
  return {
    success: results.every(r => r.success),
    results,
    summary: {
      total: texts.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }
  };
}

module.exports = { execute, executeBatch, splitIntoWords, convertToCase, detectCase };
