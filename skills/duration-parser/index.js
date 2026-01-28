/**
 * Duration Parser
 * Parse and format time durations between human-readable strings and milliseconds.
 */

const UNITS = {
  ms: 1,
  millisecond: 1,
  milliseconds: 1,
  s: 1000,
  sec: 1000,
  second: 1000,
  seconds: 1000,
  m: 60 * 1000,
  min: 60 * 1000,
  minute: 60 * 1000,
  minutes: 60 * 1000,
  h: 60 * 60 * 1000,
  hr: 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  wk: 7 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

const FORMAT_UNITS = [
  { unit: 'w', ms: 7 * 24 * 60 * 60 * 1000 },
  { unit: 'd', ms: 24 * 60 * 60 * 1000 },
  { unit: 'h', ms: 60 * 60 * 1000 },
  { unit: 'm', ms: 60 * 1000 },
  { unit: 's', ms: 1000 },
  { unit: 'ms', ms: 1 },
];

/**
 * Parse a duration string to milliseconds
 * @param {string} input - Duration string like "2h30m" or "1 day 12 hours"
 * @returns {number} Milliseconds
 */
function parse(input) {
  if (typeof input === 'number') return input;
  if (!input || typeof input !== 'string') return 0;

  const str = input.trim().toLowerCase();
  
  // Handle plain number (assume milliseconds)
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }

  let total = 0;
  // Match patterns like "2h", "30m", "1.5 hours", "2 days"
  const regex = /(-?\d+\.?\d*)\s*(ms|milliseconds?|s|sec|seconds?|m|min|minutes?|h|hr|hours?|d|days?|w|wk|weeks?)/gi;
  
  let match;
  while ((match = regex.exec(str)) !== null) {
    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = UNITS[unit];
    
    if (multiplier) {
      total += value * multiplier;
    }
  }

  return Math.round(total);
}

/**
 * Format milliseconds to a human-readable duration string
 * @param {number} ms - Milliseconds
 * @param {Object} options - Formatting options
 * @param {boolean} options.compact - If true, omit zero values (default: true)
 * @param {string[]} options.units - Units to use (default: ['d', 'h', 'm', 's'])
 * @param {string} options.separator - Separator between parts (default: ' ')
 * @returns {string} Formatted duration
 */
function format(ms, options = {}) {
  const {
    compact = true,
    units = ['d', 'h', 'm', 's'],
    separator = ' ',
  } = options;

  if (ms === 0) return '0ms';
  if (typeof ms !== 'number' || isNaN(ms)) return '0ms';

  const negative = ms < 0;
  let remaining = Math.abs(Math.round(ms));
  
  const parts = [];
  
  for (const { unit, ms: unitMs } of FORMAT_UNITS) {
    if (!units.includes(unit)) continue;
    
    const value = Math.floor(remaining / unitMs);
    remaining = remaining % unitMs;
    
    if (value > 0 || !compact) {
      parts.push(`${value}${unit}`);
    }
  }

  // Handle remaining milliseconds if not included in units
  if (remaining > 0 && !units.includes('ms')) {
    // Round up the last unit if there are remaining ms
    if (parts.length > 0) {
      // Already handled, ignore sub-unit remainder
    } else {
      parts.push(`${remaining}ms`);
    }
  }

  if (parts.length === 0) {
    // Find smallest requested unit
    const smallestUnit = [...units].reverse().find(u => FORMAT_UNITS.find(f => f.unit === u));
    return `0${smallestUnit || 'ms'}`;
  }

  const result = parts.join(separator);
  return negative ? `-${result}` : result;
}

/**
 * Convert between duration formats
 * @param {string|number} input - Input duration (string or ms)
 * @param {string} toFormat - Output format: 'ms', 's', 'm', 'h', 'd', 'w', or 'human'
 * @returns {number|string} Converted duration
 */
function convert(input, toFormat = 'ms') {
  const ms = parse(input);
  
  if (toFormat === 'human') {
    return format(ms);
  }
  
  const divisor = UNITS[toFormat] || 1;
  return ms / divisor;
}

/**
 * Add durations together
 * @param {...(string|number)} durations - Durations to add
 * @returns {number} Total milliseconds
 */
function add(...durations) {
  return durations.reduce((total, d) => total + parse(d), 0);
}

/**
 * Subtract durations
 * @param {string|number} from - Duration to subtract from
 * @param {...(string|number)} durations - Durations to subtract
 * @returns {number} Result in milliseconds
 */
function subtract(from, ...durations) {
  return durations.reduce((total, d) => total - parse(d), parse(from));
}

module.exports = {
  parse,
  format,
  convert,
  add,
  subtract,
  UNITS,
};

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  const input = args.slice(1).join(' ');
  
  if (command === 'parse' && input) {
    console.log(parse(input));
  } else if (command === 'format' && input) {
    console.log(format(parseInt(input, 10)));
  } else if (command === 'convert' && args[1] && args[2]) {
    console.log(convert(args[1], args[2]));
  } else {
    console.log('Duration Parser - Parse and format time durations');
    console.log('');
    console.log('Usage:');
    console.log('  node index.js parse "2h30m"     → 9000000');
    console.log('  node index.js format 9000000    → 2h 30m');
    console.log('  node index.js convert "1d" h    → 24');
  }
}
