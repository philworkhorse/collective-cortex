/**
 * semver-compare - Semantic version comparison utility
 * Full semver 2.0.0 compliance with range support
 */

// Parse a semantic version string
function parse(version) {
  if (!version || typeof version !== 'string') {
    return null;
  }
  
  // Strip leading 'v' or '=' if present
  const cleaned = version.replace(/^[v=]/, '').trim();
  
  // Full semver regex: major.minor.patch[-prerelease][+build]
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  const match = cleaned.match(regex);
  
  if (!match) {
    return null;
  }
  
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4] ? match[4].split('.') : [],
    build: match[5] || null,
    raw: version
  };
}

// Compare prerelease identifiers
function comparePrerelease(a, b) {
  // No prerelease > has prerelease (1.0.0 > 1.0.0-alpha)
  if (a.length === 0 && b.length > 0) return 1;
  if (a.length > 0 && b.length === 0) return -1;
  if (a.length === 0 && b.length === 0) return 0;
  
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    // Fewer fields = lower precedence if all previous equal
    if (i >= a.length) return -1;
    if (i >= b.length) return 1;
    
    const aVal = a[i];
    const bVal = b[i];
    
    const aNum = /^\d+$/.test(aVal) ? parseInt(aVal, 10) : null;
    const bNum = /^\d+$/.test(bVal) ? parseInt(bVal, 10) : null;
    
    // Numeric identifiers have lower precedence than alphanumeric
    if (aNum !== null && bNum === null) return -1;
    if (aNum === null && bNum !== null) return 1;
    
    // Both numeric
    if (aNum !== null && bNum !== null) {
      if (aNum < bNum) return -1;
      if (aNum > bNum) return 1;
      continue;
    }
    
    // Both alphanumeric - lexicographic compare
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
  }
  
  return 0;
}

// Compare two parsed versions
function compare(v1, v2) {
  const a = typeof v1 === 'string' ? parse(v1) : v1;
  const b = typeof v2 === 'string' ? parse(v2) : v2;
  
  if (!a || !b) {
    throw new Error('Invalid version format');
  }
  
  // Compare major.minor.patch
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  
  // Compare prerelease
  return comparePrerelease(a.prerelease, b.prerelease);
}

// Check if version satisfies a simple constraint
function satisfiesConstraint(version, constraint) {
  const parsed = typeof version === 'string' ? parse(version) : version;
  if (!parsed) return false;
  
  const trimmed = constraint.trim();
  
  // Handle caret (^) - compatible with version
  if (trimmed.startsWith('^')) {
    const target = parse(trimmed.slice(1));
    if (!target) return false;
    
    // Major must match (unless major is 0)
    if (target.major === 0) {
      // ^0.x.y allows changes that do not modify left-most non-zero
      if (target.minor === 0) {
        return parsed.major === 0 && parsed.minor === 0 && parsed.patch >= target.patch;
      }
      return parsed.major === 0 && parsed.minor === target.minor && parsed.patch >= target.patch;
    }
    return parsed.major === target.major && compare(parsed, target) >= 0;
  }
  
  // Handle tilde (~) - approximately equivalent
  if (trimmed.startsWith('~')) {
    const target = parse(trimmed.slice(1));
    if (!target) return false;
    
    // Same major.minor, patch can be higher
    return parsed.major === target.major && 
           parsed.minor === target.minor && 
           parsed.patch >= target.patch;
  }
  
  // Handle operators
  const opMatch = trimmed.match(/^(>=|<=|>|<|=)?(.+)$/);
  if (!opMatch) return false;
  
  const op = opMatch[1] || '=';
  const target = parse(opMatch[2]);
  if (!target) return false;
  
  const cmp = compare(parsed, target);
  
  switch (op) {
    case '=': return cmp === 0;
    case '>': return cmp > 0;
    case '>=': return cmp >= 0;
    case '<': return cmp < 0;
    case '<=': return cmp <= 0;
    default: return false;
  }
}

// Check if version satisfies a range (supports AND with space, OR with ||)
function satisfies(version, range) {
  const parsed = typeof version === 'string' ? parse(version) : version;
  if (!parsed) return false;
  
  // Handle OR conditions
  const orParts = range.split('||').map(s => s.trim());
  
  return orParts.some(orPart => {
    // Handle AND conditions (space-separated)
    const andParts = orPart.split(/\s+/).filter(s => s.length > 0);
    return andParts.every(constraint => satisfiesConstraint(parsed, constraint));
  });
}

// Sort versions
function sort(versions, order = 'asc') {
  const parsed = versions.map(v => ({ raw: v, parsed: parse(v) }));
  const invalid = parsed.filter(p => !p.parsed).map(p => p.raw);
  const valid = parsed.filter(p => p.parsed);
  
  valid.sort((a, b) => compare(a.parsed, b.parsed));
  
  if (order === 'desc') {
    valid.reverse();
  }
  
  return {
    sorted: valid.map(v => v.raw),
    invalid: invalid.length > 0 ? invalid : undefined
  };
}

// Request handler
module.exports = async function handler(req) {
  const { action } = req.params || {};
  const body = req.body || {};
  
  try {
    switch (action) {
      case 'compare': {
        const { v1, v2 } = body;
        if (!v1 || !v2) {
          return { error: 'Both v1 and v2 are required' };
        }
        
        const p1 = parse(v1);
        const p2 = parse(v2);
        
        if (!p1) return { error: `Invalid version: ${v1}` };
        if (!p2) return { error: `Invalid version: ${v2}` };
        
        const result = compare(p1, p2);
        const symbol = result === 0 ? '=' : result > 0 ? '>' : '<';
        
        return {
          result,
          explanation: `${v1} ${symbol} ${v2}`,
          v1_parsed: { major: p1.major, minor: p1.minor, patch: p1.patch, prerelease: p1.prerelease },
          v2_parsed: { major: p2.major, minor: p2.minor, patch: p2.patch, prerelease: p2.prerelease }
        };
      }
      
      case 'validate': {
        const { version } = body;
        if (!version) {
          return { error: 'version is required' };
        }
        
        const parsed = parse(version);
        return {
          valid: !!parsed,
          parsed: parsed ? {
            major: parsed.major,
            minor: parsed.minor,
            patch: parsed.patch,
            prerelease: parsed.prerelease.length > 0 ? parsed.prerelease : undefined,
            build: parsed.build
          } : undefined
        };
      }
      
      case 'satisfies': {
        const { version, range } = body;
        if (!version || !range) {
          return { error: 'Both version and range are required' };
        }
        
        const parsed = parse(version);
        if (!parsed) {
          return { error: `Invalid version: ${version}` };
        }
        
        return {
          satisfies: satisfies(parsed, range),
          version,
          range
        };
      }
      
      case 'sort': {
        const { versions, order = 'asc' } = body;
        if (!versions || !Array.isArray(versions)) {
          return { error: 'versions array is required' };
        }
        
        if (!['asc', 'desc'].includes(order)) {
          return { error: 'order must be "asc" or "desc"' };
        }
        
        return sort(versions, order);
      }
      
      default:
        return {
          error: 'Unknown action',
          available: ['compare', 'validate', 'satisfies', 'sort'],
          usage: {
            compare: 'POST with { v1, v2 }',
            validate: 'POST with { version }',
            satisfies: 'POST with { version, range }',
            sort: 'POST with { versions: [], order?: "asc"|"desc" }'
          }
        };
    }
  } catch (err) {
    return { error: err.message };
  }
};
