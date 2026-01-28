#!/usr/bin/env node

/**
 * UUID Generator
 * Generate v4 UUIDs (random) for unique identifiers
 */

function generateUUID() {
  // RFC 4122 version 4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatUUID(uuid, options = {}) {
  let result = uuid;
  if (options.noDashes) {
    result = result.replace(/-/g, '');
  }
  if (options.uppercase) {
    result = result.toUpperCase();
  }
  return result;
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse count (first numeric arg or default to 1)
  let count = 1;
  const countArg = args.find(a => /^\d+$/.test(a));
  if (countArg) count = parseInt(countArg, 10);
  
  // Parse options
  const options = {
    noDashes: args.includes('--no-dashes'),
    uppercase: args.includes('--uppercase')
  };
  
  // Generate and output
  for (let i = 0; i < count; i++) {
    console.log(formatUUID(generateUUID(), options));
  }
}

// Export for API use
module.exports = { generateUUID, formatUUID };
