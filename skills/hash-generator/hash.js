#!/usr/bin/env node
/**
 * hash-generator - Cryptographic hash utility for Clawdbot agents
 * 
 * Supports: MD5, SHA1, SHA256, SHA512, HMAC, bcrypt
 * 
 * Usage:
 *   node hash.js <algorithm> <input> [options]
 *   node hash.js md5 "hello world"
 *   node hash.js sha256 --file ./document.pdf
 *   node hash.js hmac sha256 "message" "secret-key"
 *   node hash.js bcrypt "password123" --rounds 12
 *   node hash.js verify-bcrypt "password123" "$2b$12$..."
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Check if bcrypt is available (optional dependency)
let bcrypt;
try {
  bcrypt = require('bcrypt');
} catch (e) {
  bcrypt = null;
}

const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512', 'sha384', 'sha3-256', 'sha3-512'];

function hashString(algorithm, input, encoding = 'hex') {
  if (!ALGORITHMS.includes(algorithm.toLowerCase())) {
    throw new Error(`Unsupported algorithm: ${algorithm}. Supported: ${ALGORITHMS.join(', ')}`);
  }
  return crypto.createHash(algorithm.toLowerCase()).update(input).digest(encoding);
}

function hashFile(algorithm, filePath, encoding = 'hex') {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  const fileBuffer = fs.readFileSync(filePath);
  return hashString(algorithm, fileBuffer, encoding);
}

function hmacHash(algorithm, message, secret, encoding = 'hex') {
  if (!ALGORITHMS.includes(algorithm.toLowerCase())) {
    throw new Error(`Unsupported algorithm: ${algorithm}. Supported: ${ALGORITHMS.join(', ')}`);
  }
  return crypto.createHmac(algorithm.toLowerCase(), secret).update(message).digest(encoding);
}

async function bcryptHash(password, rounds = 10) {
  if (!bcrypt) {
    throw new Error('bcrypt not installed. Run: npm install bcrypt');
  }
  return await bcrypt.hash(password, rounds);
}

async function bcryptVerify(password, hash) {
  if (!bcrypt) {
    throw new Error('bcrypt not installed. Run: npm install bcrypt');
  }
  return await bcrypt.compare(password, hash);
}

function printUsage() {
  console.log(`
hash-generator - Cryptographic hash utility

USAGE:
  hash <algorithm> <input>              Hash a string
  hash <algorithm> --file <path>        Hash a file
  hash hmac <algorithm> <msg> <secret>  Generate HMAC
  hash bcrypt <password> [--rounds N]   Bcrypt hash (default: 10 rounds)
  hash verify-bcrypt <password> <hash>  Verify bcrypt hash
  hash list                             List supported algorithms

ALGORITHMS:
  ${ALGORITHMS.join(', ')}

EXAMPLES:
  hash sha256 "hello world"
  hash md5 --file ./document.pdf
  hash hmac sha256 "api-request-body" "my-secret-key"
  hash bcrypt "password123" --rounds 12
  hash verify-bcrypt "password123" "$2b$12$..."

OUTPUT FORMATS:
  --hex     Hexadecimal (default)
  --base64  Base64 encoded
  --binary  Raw binary (for piping)
`);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    return;
  }
  
  if (args[0] === 'list') {
    console.log('Supported algorithms:', ALGORITHMS.join(', '));
    if (bcrypt) console.log('bcrypt: available');
    else console.log('bcrypt: not installed (npm install bcrypt)');
    return;
  }
  
  // Parse encoding option
  let encoding = 'hex';
  if (args.includes('--base64')) {
    encoding = 'base64';
    args.splice(args.indexOf('--base64'), 1);
  } else if (args.includes('--binary')) {
    encoding = 'binary';
    args.splice(args.indexOf('--binary'), 1);
  } else if (args.includes('--hex')) {
    args.splice(args.indexOf('--hex'), 1);
  }
  
  const command = args[0].toLowerCase();
  
  try {
    // HMAC
    if (command === 'hmac') {
      if (args.length < 4) {
        console.error('Usage: hash hmac <algorithm> <message> <secret>');
        process.exit(1);
      }
      const result = hmacHash(args[1], args[2], args[3], encoding);
      console.log(result);
      return;
    }
    
    // Bcrypt hash
    if (command === 'bcrypt') {
      let rounds = 10;
      const roundsIdx = args.indexOf('--rounds');
      if (roundsIdx !== -1 && args[roundsIdx + 1]) {
        rounds = parseInt(args[roundsIdx + 1], 10);
        if (isNaN(rounds) || rounds < 4 || rounds > 20) {
          console.error('Rounds must be between 4 and 20');
          process.exit(1);
        }
      }
      const password = args[1];
      if (!password) {
        console.error('Usage: hash bcrypt <password> [--rounds N]');
        process.exit(1);
      }
      const hash = await bcryptHash(password, rounds);
      console.log(hash);
      return;
    }
    
    // Bcrypt verify
    if (command === 'verify-bcrypt') {
      if (args.length < 3) {
        console.error('Usage: hash verify-bcrypt <password> <hash>');
        process.exit(1);
      }
      const match = await bcryptVerify(args[1], args[2]);
      console.log(match ? 'MATCH: true' : 'MATCH: false');
      process.exit(match ? 0 : 1);
    }
    
    // Standard hash
    if (ALGORITHMS.includes(command)) {
      let result;
      if (args.includes('--file')) {
        const fileIdx = args.indexOf('--file');
        const filePath = args[fileIdx + 1];
        if (!filePath) {
          console.error('Please provide a file path after --file');
          process.exit(1);
        }
        result = hashFile(command, filePath, encoding);
        console.log(`${result}  ${path.basename(filePath)}`);
      } else {
        const input = args[1];
        if (!input) {
          console.error(`Usage: hash ${command} <input>`);
          process.exit(1);
        }
        result = hashString(command, input, encoding);
        console.log(result);
      }
      return;
    }
    
    console.error(`Unknown command or algorithm: ${command}`);
    console.error(`Supported algorithms: ${ALGORITHMS.join(', ')}`);
    console.error('Other commands: hmac, bcrypt, verify-bcrypt, list');
    process.exit(1);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
