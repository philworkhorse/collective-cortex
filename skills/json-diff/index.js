/**
 * json-diff - Compare two JSON objects and show what changed
 * Built by Echo for Collective Cortex
 */

function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function deepEqual(a, b, ignoreOrder = false) {
  const typeA = getType(a);
  const typeB = getType(b);
  
  if (typeA !== typeB) return false;
  
  if (typeA === 'array') {
    if (a.length !== b.length) return false;
    if (ignoreOrder) {
      // For ignore order, check if every item in a exists in b
      const bCopy = [...b];
      for (const item of a) {
        const idx = bCopy.findIndex(bItem => deepEqual(item, bItem, true));
        if (idx === -1) return false;
        bCopy.splice(idx, 1);
      }
      return true;
    }
    return a.every((item, i) => deepEqual(item, b[i], ignoreOrder));
  }
  
  if (typeA === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => key in b && deepEqual(a[key], b[key], ignoreOrder));
  }
  
  return a === b;
}

function formatPath(parts) {
  return '$' + parts.map(p => {
    if (typeof p === 'number') return `[${p}]`;
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(p)) return `.${p}`;
    return `["${p.replace(/"/g, '\\"')}"]`;
  }).join('');
}

function diff(before, after, options = {}) {
  const { ignoreOrder = false, maxDepth = 50 } = options;
  const differences = [];
  
  function compare(a, b, path = [], depth = 0) {
    if (depth > maxDepth) {
      differences.push({
        type: 'truncated',
        path: formatPath(path),
        message: 'Max depth exceeded'
      });
      return;
    }
    
    const typeA = getType(a);
    const typeB = getType(b);
    
    // Type changed
    if (typeA !== typeB) {
      differences.push({
        type: 'modified',
        path: formatPath(path),
        before: a,
        after: b,
        typeChange: { from: typeA, to: typeB }
      });
      return;
    }
    
    // Both arrays
    if (typeA === 'array') {
      if (ignoreOrder) {
        // Set-like comparison
        const matched = new Set();
        const added = [];
        const removed = [];
        
        for (let i = 0; i < a.length; i++) {
          const matchIdx = b.findIndex((bItem, j) => !matched.has(j) && deepEqual(a[i], bItem, true));
          if (matchIdx === -1) {
            removed.push({ index: i, value: a[i] });
          } else {
            matched.add(matchIdx);
          }
        }
        
        for (let j = 0; j < b.length; j++) {
          if (!matched.has(j)) {
            added.push({ index: j, value: b[j] });
          }
        }
        
        for (const item of removed) {
          differences.push({
            type: 'removed',
            path: formatPath([...path, item.index]),
            before: item.value
          });
        }
        
        for (const item of added) {
          differences.push({
            type: 'added',
            path: formatPath([...path, item.index]),
            after: item.value
          });
        }
      } else {
        // Index-based comparison
        const maxLen = Math.max(a.length, b.length);
        for (let i = 0; i < maxLen; i++) {
          if (i >= a.length) {
            differences.push({
              type: 'added',
              path: formatPath([...path, i]),
              after: b[i]
            });
          } else if (i >= b.length) {
            differences.push({
              type: 'removed',
              path: formatPath([...path, i]),
              before: a[i]
            });
          } else if (!deepEqual(a[i], b[i], ignoreOrder)) {
            compare(a[i], b[i], [...path, i], depth + 1);
          }
        }
      }
      return;
    }
    
    // Both objects
    if (typeA === 'object') {
      const keysA = new Set(Object.keys(a));
      const keysB = new Set(Object.keys(b));
      
      // Removed keys
      for (const key of keysA) {
        if (!keysB.has(key)) {
          differences.push({
            type: 'removed',
            path: formatPath([...path, key]),
            before: a[key]
          });
        }
      }
      
      // Added keys
      for (const key of keysB) {
        if (!keysA.has(key)) {
          differences.push({
            type: 'added',
            path: formatPath([...path, key]),
            after: b[key]
          });
        }
      }
      
      // Modified keys
      for (const key of keysA) {
        if (keysB.has(key) && !deepEqual(a[key], b[key], ignoreOrder)) {
          compare(a[key], b[key], [...path, key], depth + 1);
        }
      }
      return;
    }
    
    // Primitives
    if (a !== b) {
      differences.push({
        type: 'modified',
        path: formatPath(path),
        before: a,
        after: b
      });
    }
  }
  
  compare(before, after);
  return differences;
}

function formatOutput(differences, format) {
  if (format === 'paths') {
    return differences.map(d => ({
      type: d.type,
      path: d.path
    }));
  }
  
  if (format === 'compact') {
    return differences.map(d => {
      const base = `${d.type}: ${d.path}`;
      if (d.type === 'added') return `${base} = ${JSON.stringify(d.after)}`;
      if (d.type === 'removed') return `${base} (was ${JSON.stringify(d.before)})`;
      if (d.type === 'modified') return `${base}: ${JSON.stringify(d.before)} → ${JSON.stringify(d.after)}`;
      return base;
    });
  }
  
  return differences; // detailed format
}

function handler(body) {
  try {
    let { before, after, options = {} } = body;
    
    // Parse strings as JSON if needed
    if (typeof before === 'string') {
      try {
        before = JSON.parse(before);
      } catch (e) {
        return { error: `Invalid JSON in 'before': ${e.message}` };
      }
    }
    
    if (typeof after === 'string') {
      try {
        after = JSON.parse(after);
      } catch (e) {
        return { error: `Invalid JSON in 'after': ${e.message}` };
      }
    }
    
    if (before === undefined || after === undefined) {
      return { error: "Both 'before' and 'after' parameters are required" };
    }
    
    const format = options.format || 'detailed';
    const differences = diff(before, after, options);
    
    const summary = {
      added: differences.filter(d => d.type === 'added').length,
      removed: differences.filter(d => d.type === 'removed').length,
      modified: differences.filter(d => d.type === 'modified').length
    };
    
    return {
      changed: differences.length > 0,
      summary,
      differences: formatOutput(differences, format)
    };
  } catch (e) {
    return { error: `Diff failed: ${e.message}` };
  }
}

module.exports = { handler, diff, deepEqual };
