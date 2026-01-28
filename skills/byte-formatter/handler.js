/**
 * byte-formatter: Convert between bytes and human-readable sizes
 * 
 * Supports both decimal (KB, MB, GB) and binary (KiB, MiB, GiB) units.
 * Handles parsing of size strings back to bytes.
 */

const DECIMAL_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
const BINARY_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

const DECIMAL_BASE = 1000;
const BINARY_BASE = 1024;

// Mapping for parsing (case-insensitive)
const UNIT_TO_BYTES = {
  'b': 1,
  'kb': 1000,
  'kib': 1024,
  'mb': 1000 ** 2,
  'mib': 1024 ** 2,
  'gb': 1000 ** 3,
  'gib': 1024 ** 3,
  'tb': 1000 ** 4,
  'tib': 1024 ** 4,
  'pb': 1000 ** 5,
  'pib': 1024 ** 5,
  'eb': 1000 ** 6,
  'eib': 1024 ** 6,
  // Common aliases
  'k': 1024,
  'm': 1024 ** 2,
  'g': 1024 ** 3,
  't': 1024 ** 4,
  'bytes': 1,
  'byte': 1,
};

/**
 * Format bytes to human-readable string
 */
function format(bytes, options = {}) {
  const { binary = false, precision = 2 } = options;
  
  if (typeof bytes !== 'number' || isNaN(bytes)) {
    throw new Error('bytes must be a valid number');
  }
  
  if (bytes < 0) {
    return '-' + format(-bytes, options);
  }
  
  if (bytes === 0) return '0 B';
  
  const base = binary ? BINARY_BASE : DECIMAL_BASE;
  const units = binary ? BINARY_UNITS : DECIMAL_UNITS;
  
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(base)),
    units.length - 1
  );
  
  const value = bytes / Math.pow(base, exponent);
  const formatted = value.toFixed(precision).replace(/\.?0+$/, '');
  
  return `${formatted} ${units[exponent]}`;
}

/**
 * Parse human-readable size string to bytes
 */
function parse(sizeStr) {
  if (typeof sizeStr !== 'string') {
    throw new Error('size must be a string');
  }
  
  const cleaned = sizeStr.trim().toLowerCase();
  
  // Match number (with optional decimal) and unit
  const match = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*([a-z]+)?$/);
  
  if (!match) {
    throw new Error(`Invalid size format: "${sizeStr}". Expected format like "1.5 GB" or "500 MiB"`);
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  const multiplier = UNIT_TO_BYTES[unit];
  
  if (multiplier === undefined) {
    throw new Error(`Unknown unit: "${unit}". Valid units: ${Object.keys(UNIT_TO_BYTES).join(', ')}`);
  }
  
  return Math.round(value * multiplier);
}

/**
 * Express route handler
 */
module.exports = function(router) {
  router.post('/format', (req, res) => {
    try {
      const { bytes, binary = false, precision = 2 } = req.body;
      
      if (bytes === undefined) {
        return res.status(400).json({ error: 'bytes is required' });
      }
      
      const result = format(Number(bytes), { binary, precision });
      
      res.json({
        input: bytes,
        formatted: result,
        options: { binary, precision }
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  router.post('/parse', (req, res) => {
    try {
      const { size } = req.body;
      
      if (!size) {
        return res.status(400).json({ error: 'size is required' });
      }
      
      const bytes = parse(size);
      
      res.json({
        input: size,
        bytes: bytes,
        formatted: {
          decimal: format(bytes, { binary: false }),
          binary: format(bytes, { binary: true })
        }
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  // Convenience GET endpoint for quick formatting
  router.get('/format/:bytes', (req, res) => {
    try {
      const bytes = Number(req.params.bytes);
      const binary = req.query.binary === 'true';
      const precision = parseInt(req.query.precision) || 2;
      
      res.json({
        bytes: bytes,
        formatted: format(bytes, { binary, precision }),
        decimal: format(bytes, { binary: false, precision }),
        binary: format(bytes, { binary: true, precision })
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  
  return router;
};

// Export functions for direct use
module.exports.format = format;
module.exports.parse = parse;
