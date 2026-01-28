/**
 * regex-helper - Explain and test regular expressions
 * Author: SPARK (Collective Cortex)
 */

// Token explanations for regex components
const tokenExplanations = {
  '^': 'Start of string',
  '$': 'End of string',
  '.': 'Any single character (except newline)',
  '*': 'Zero or more of the previous',
  '+': 'One or more of the previous',
  '?': 'Zero or one of the previous (optional)',
  '\\d': 'Any digit (0-9)',
  '\\D': 'Any non-digit',
  '\\w': 'Any word character (a-z, A-Z, 0-9, _)',
  '\\W': 'Any non-word character',
  '\\s': 'Any whitespace (space, tab, newline)',
  '\\S': 'Any non-whitespace',
  '\\b': 'Word boundary',
  '\\B': 'Non-word boundary',
  '\\n': 'Newline',
  '\\t': 'Tab',
  '\\\\': 'Literal backslash',
  '|': 'OR (alternation)',
};

function explainPattern(pattern) {
  const explanations = [];
  let i = 0;
  
  while (i < pattern.length) {
    const char = pattern[i];
    const next = pattern[i + 1];
    const twoChar = char + (next || '');
    
    // Check for escape sequences
    if (char === '\\' && next) {
      if (tokenExplanations[twoChar]) {
        explanations.push({ token: twoChar, meaning: tokenExplanations[twoChar] });
        i += 2;
        continue;
      }
      // Escaped literal
      explanations.push({ token: twoChar, meaning: `Literal '${next}'` });
      i += 2;
      continue;
    }
    
    // Character class [...]
    if (char === '[') {
      const closeIdx = pattern.indexOf(']', i);
      if (closeIdx !== -1) {
        const charClass = pattern.slice(i, closeIdx + 1);
        const negated = pattern[i + 1] === '^';
        const inner = negated ? charClass.slice(2, -1) : charClass.slice(1, -1);
        const meaning = negated 
          ? `Any character NOT in: ${inner}`
          : `Any character in: ${inner}`;
        explanations.push({ token: charClass, meaning });
        i = closeIdx + 1;
        continue;
      }
    }
    
    // Quantifiers {n}, {n,}, {n,m}
    if (char === '{') {
      const closeIdx = pattern.indexOf('}', i);
      if (closeIdx !== -1) {
        const quant = pattern.slice(i, closeIdx + 1);
        const inner = quant.slice(1, -1);
        let meaning;
        if (inner.includes(',')) {
          const [min, max] = inner.split(',');
          meaning = max ? `Between ${min} and ${max} times` : `${min} or more times`;
        } else {
          meaning = `Exactly ${inner} times`;
        }
        explanations.push({ token: quant, meaning });
        i = closeIdx + 1;
        continue;
      }
    }
    
    // Groups (...)
    if (char === '(') {
      if (pattern.slice(i, i + 3) === '(?:') {
        explanations.push({ token: '(?:', meaning: 'Non-capturing group start' });
        i += 3;
        continue;
      }
      if (pattern.slice(i, i + 4) === '(?=)' || pattern[i + 1] === '?' && pattern[i + 2] === '=') {
        explanations.push({ token: '(?=', meaning: 'Positive lookahead start' });
        i += 3;
        continue;
      }
      if (pattern[i + 1] === '?' && pattern[i + 2] === '!') {
        explanations.push({ token: '(?!', meaning: 'Negative lookahead start' });
        i += 3;
        continue;
      }
      explanations.push({ token: '(', meaning: 'Capturing group start' });
      i++;
      continue;
    }
    
    if (char === ')') {
      explanations.push({ token: ')', meaning: 'Group end' });
      i++;
      continue;
    }
    
    // Simple tokens
    if (tokenExplanations[char]) {
      explanations.push({ token: char, meaning: tokenExplanations[char] });
      i++;
      continue;
    }
    
    // Literal character
    explanations.push({ token: char, meaning: `Literal '${char}'` });
    i++;
  }
  
  return explanations;
}

function testPattern(pattern, input, flags = '') {
  try {
    const regex = new RegExp(pattern, flags);
    const matches = [];
    
    if (flags.includes('g')) {
      let match;
      while ((match = regex.exec(input)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1).length > 0 ? match.slice(1) : undefined
        });
      }
    } else {
      const match = input.match(regex);
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1).length > 0 ? match.slice(1) : undefined
        });
      }
    }
    
    return {
      success: true,
      isMatch: matches.length > 0,
      matches,
      matchCount: matches.length
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

function run(params) {
  const { action, pattern, input, flags = '' } = params;
  
  if (!pattern) {
    return { success: false, error: 'Pattern is required' };
  }
  
  switch (action) {
    case 'explain': {
      const breakdown = explainPattern(pattern);
      const summary = breakdown.map(b => `${b.token} → ${b.meaning}`).join('\n');
      return {
        success: true,
        pattern,
        breakdown,
        explanation: summary
      };
    }
    
    case 'test':
    case 'extract': {
      if (input === undefined) {
        return { success: false, error: 'Input string is required for test/extract' };
      }
      const result = testPattern(pattern, input, flags || (action === 'extract' ? 'g' : ''));
      return {
        ...result,
        pattern,
        input
      };
    }
    
    default:
      return { success: false, error: `Unknown action: ${action}. Use: explain, test, extract` };
  }
}

module.exports = { run };
