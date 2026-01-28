#!/usr/bin/env node

/**
 * Slug Generator - Transform any text into URL-friendly slugs, file names, or variable names
 * 
 * Usage: node slug.js "Your Text Here" [--format kebab|snake|camel|pascal|constant] [--max N] [--file]
 */

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function slugify(text, options = {}) {
  const { format = 'kebab', maxLength = null, fileMode = false } = options;
  
  // Handle file extension
  let extension = '';
  if (fileMode) {
    const match = text.match(/\.([a-zA-Z0-9]+)$/);
    if (match) {
      extension = match[0].toLowerCase();
      text = text.slice(0, -extension.length);
    }
  }
  
  // Normalize and clean
  let slug = removeAccents(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/[\s_-]+/g, ' ')      // Normalize whitespace
    .trim();
  
  // Apply max length at word boundary
  if (maxLength && slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    const lastSpace = slug.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.5) {
      slug = slug.slice(0, lastSpace);
    }
    slug = slug.trim();
  }
  
  // Split into words
  const words = slug.split(' ').filter(w => w.length > 0);
  
  // Format output
  let result;
  switch (format) {
    case 'snake':
      result = words.join('_');
      break;
    case 'camel':
      result = words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      break;
    case 'pascal':
      result = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      break;
    case 'constant':
      result = words.join('_').toUpperCase();
      break;
    case 'kebab':
    default:
      result = words.join('-');
  }
  
  return result + extension;
}

// CLI handling
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Slug Generator - Transform text into slugs, file names, or variable names

Usage: node slug.js "Your Text Here" [options]

Options:
  --format <type>   Output format: kebab, snake, camel, pascal, constant (default: kebab)
  --max <number>    Maximum length (respects word boundaries)
  --file            File mode: preserves extension
  --help            Show this help

Examples:
  node slug.js "Hello World"                    # hello-world
  node slug.js "My API Key" --format constant   # MY_API_KEY
  node slug.js "UserProfile" --format camel     # userprofile
  node slug.js "Report 2024.pdf" --file         # report-2024.pdf
`);
    process.exit(0);
  }
  
  // Parse arguments
  const text = args.find(a => !a.startsWith('--'));
  const formatIdx = args.indexOf('--format');
  const maxIdx = args.indexOf('--max');
  
  const options = {
    format: formatIdx !== -1 ? args[formatIdx + 1] : 'kebab',
    maxLength: maxIdx !== -1 ? parseInt(args[maxIdx + 1], 10) : null,
    fileMode: args.includes('--file')
  };
  
  if (!text) {
    console.error('Error: No text provided');
    process.exit(1);
  }
  
  console.log(slugify(text, options));
}

// Export for use as module
module.exports = { slugify, removeAccents };

// Run CLI if executed directly
if (require.main === module) {
  main();
}
