#!/usr/bin/env node
/**
 * Secret Masker - Redact sensitive data from text
 * 
 * Usage:
 *   node mask.js "text with secrets"
 *   node mask.js --file ./log.txt
 *   cat log.txt | node mask.js --stdin
 *   node mask.js --peek "partial masking"
 */

const fs = require('fs');

// Patterns to detect and mask
const PATTERNS = [
  // API Keys (OpenAI, Anthropic, Stripe, etc.)
  { name: 'openai_key', regex: /sk-[a-zA-Z0-9]{20,}/g, mask: 'sk-***MASKED***' },
  { name: 'anthropic_key', regex: /sk-ant-[a-zA-Z0-9-]{20,}/g, mask: 'sk-ant-***MASKED***' },
  { name: 'stripe_key', regex: /(sk|pk)_(test|live)_[a-zA-Z0-9]{20,}/g, mask: (m) => m.slice(0,8) + '***MASKED***' },
  
  // AWS
  { name: 'aws_access_key', regex: /AKIA[0-9A-Z]{16}/g, mask: 'AKIA***MASKED***' },
  { name: 'aws_secret', regex: /(?<=aws_secret_access_key\s*[=:]\s*)[A-Za-z0-9/+=]{40}/g, mask: '***AWS_SECRET_MASKED***' },
  
  // JWT Tokens
  { name: 'jwt', regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, mask: '[JWT REDACTED]' },
  
  // Bearer tokens
  { name: 'bearer', regex: /(?<=Bearer\s)[a-zA-Z0-9_-]{20,}/g, mask: '***MASKED***' },
  
  // Private keys
  { name: 'private_key', regex: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(RSA\s+)?PRIVATE\s+KEY-----/g, mask: '[PRIVATE KEY REDACTED]' },
  { name: 'ssh_key', regex: /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----[\s\S]*?-----END\s+OPENSSH\s+PRIVATE\s+KEY-----/g, mask: '[SSH KEY REDACTED]' },
  
  // Passwords in URLs
  { name: 'url_password', regex: /(:\/\/[^:]+:)([^@]+)(@)/g, mask: (m, pre, pass, post) => `${pre}***MASKED***${post}` },
  
  // Environment variables with sensitive names
  { name: 'env_secret', regex: /((?:PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY|AUTH|CREDENTIAL)[_A-Z]*\s*[=:]\s*)([^\s\n]+)/gi, mask: (m, key, val) => `${key}***MASKED***` },
  
  // Generic long hex strings (potential secrets)
  { name: 'hex_secret', regex: /(?<=[=:\s])[a-f0-9]{32,}/gi, mask: (m) => m.slice(0,8) + '***MASKED***' },
  
  // Credit card numbers
  { name: 'credit_card', regex: /\b[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}\b/g, mask: (m) => m.replace(/[0-9]/g, (d, i) => (i < 4 || i > 11) ? d : '*') },
  
  // Phone numbers (various formats)
  { name: 'phone', regex: /\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, mask: (m) => m.replace(/[0-9]{4}$/, '****') },
  
  // Email addresses
  { name: 'email', regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, mask: (m) => {
    const [local, domain] = m.split('@');
    return `${local[0]}***@${domain}`;
  }},
  
  // GitHub tokens
  { name: 'github_token', regex: /gh[pousr]_[a-zA-Z0-9]{36,}/g, mask: (m) => m.slice(0,4) + '_***MASKED***' },
  
  // Discord tokens
  { name: 'discord_token', regex: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/g, mask: '[DISCORD TOKEN REDACTED]' },
  
  // Slack tokens
  { name: 'slack_token', regex: /xox[baprs]-[0-9a-zA-Z-]{10,}/g, mask: (m) => m.slice(0,5) + '-***MASKED***' },
  
  // Generic base64 that looks like a secret (long, follows = or :)
  { name: 'base64_secret', regex: /(?<=[=:\s])[A-Za-z0-9+/]{40,}={0,2}(?=\s|$)/g, mask: '[BASE64 REDACTED]' },
];

/**
 * Mask secrets in text
 * @param {string} text - Input text
 * @param {object} options - { peek: boolean, customPatterns: array }
 * @returns {string} - Masked text
 */
function maskSecrets(text, options = {}) {
  let result = text;
  const masks = [];
  
  // Add custom patterns if provided
  const patterns = [...PATTERNS];
  if (options.customPatterns) {
    patterns.push(...options.customPatterns);
  }
  
  for (const pattern of patterns) {
    result = result.replace(pattern.regex, (match, ...groups) => {
      let masked;
      
      if (options.peek && typeof pattern.mask === 'string') {
        // Show first/last 4 chars
        if (match.length > 12) {
          masked = match.slice(0, 4) + '...' + match.slice(-4);
        } else {
          masked = pattern.mask;
        }
      } else if (typeof pattern.mask === 'function') {
        masked = pattern.mask(match, ...groups);
      } else {
        masked = pattern.mask;
      }
      
      masks.push({ type: pattern.name, original: match.slice(0, 20) + '...', masked });
      return masked;
    });
  }
  
  if (options.json) {
    return JSON.stringify({ masked: result, redactions: masks.length, types: masks.map(m => m.type) }, null, 2);
  }
  
  return result;
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const options = { text: null, file: null, stdin: false, peek: false, json: false, custom: null };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file' || arg === '-f') {
      options.file = args[++i];
    } else if (arg === '--stdin') {
      options.stdin = true;
    } else if (arg === '--peek' || arg === '-p') {
      options.peek = true;
    } else if (arg === '--json' || arg === '-j') {
      options.json = true;
    } else if (arg === '--custom' || arg === '-c') {
      options.custom = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Secret Masker - Redact sensitive data from text

Usage:
  node mask.js "text with secrets"
  node mask.js --file ./log.txt
  cat log.txt | node mask.js --stdin
  node mask.js --peek "partial masking"

Options:
  --file, -f <path>   Read from file
  --stdin             Read from stdin
  --peek, -p          Show first/last 4 chars of masked values
  --json, -j          Output as JSON with mask metadata
  --custom, -c <regex> Add custom regex pattern
  --help, -h          Show this help
`);
      process.exit(0);
    } else if (!arg.startsWith('-')) {
      options.text = arg;
    }
  }
  
  return options;
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);
  
  let text;
  
  if (options.stdin) {
    // Read from stdin
    const chunks = [];
    for await (const chunk of process.stdin) {
      chunks.push(chunk);
    }
    text = Buffer.concat(chunks).toString();
  } else if (options.file) {
    // Read from file
    if (!fs.existsSync(options.file)) {
      console.error(`Error: File not found: ${options.file}`);
      process.exit(1);
    }
    text = fs.readFileSync(options.file, 'utf8');
  } else if (options.text) {
    text = options.text;
  } else {
    console.error('Error: No input provided. Use --help for usage.');
    process.exit(1);
  }
  
  // Build mask options
  const maskOptions = { peek: options.peek, json: options.json };
  if (options.custom) {
    maskOptions.customPatterns = [{ name: 'custom', regex: new RegExp(options.custom, 'g'), mask: '[CUSTOM REDACTED]' }];
  }
  
  const result = maskSecrets(text, maskOptions);
  console.log(result);
}

// Export for programmatic use
module.exports = { maskSecrets, PATTERNS };

// Run CLI if executed directly
if (require.main === module) {
  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}
