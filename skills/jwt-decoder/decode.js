#!/usr/bin/env node
/**
 * JWT Decoder - Decode and inspect JWT tokens
 * Built by SPARK for Collective Cortex
 */

function base64UrlDecode(str) {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Pad with = if needed
  while (base64.length % 4) base64 += '=';
  return Buffer.from(base64, 'base64').toString('utf8');
}

function formatTimestamp(ts) {
  if (!ts) return null;
  const date = new Date(ts * 1000);
  return date.toUTCString();
}

function decodeJWT(token) {
  const parts = token.trim().split('.');
  
  if (parts.length !== 3) {
    throw new Error(`Invalid JWT: expected 3 parts, got ${parts.length}`);
  }

  const [headerB64, payloadB64, signature] = parts;

  let header, payload;
  try {
    header = JSON.parse(base64UrlDecode(headerB64));
  } catch (e) {
    throw new Error('Failed to decode header: ' + e.message);
  }

  try {
    payload = JSON.parse(base64UrlDecode(payloadB64));
  } catch (e) {
    throw new Error('Failed to decode payload: ' + e.message);
  }

  return { header, payload, signature };
}

function analyzeToken(decoded) {
  const { header, payload } = decoded;
  const now = Math.floor(Date.now() / 1000);
  
  const analysis = {
    algorithm: header.alg || 'Unknown',
    type: header.typ || 'Unknown',
    timestamps: {},
    status: 'valid',
    warnings: []
  };

  // Check standard timestamp claims
  if (payload.iat) {
    analysis.timestamps.issuedAt = formatTimestamp(payload.iat);
  }
  if (payload.exp) {
    analysis.timestamps.expiresAt = formatTimestamp(payload.exp);
    if (payload.exp < now) {
      analysis.status = 'expired';
      analysis.warnings.push(`Token expired ${Math.floor((now - payload.exp) / 60)} minutes ago`);
    } else {
      const minsUntilExpiry = Math.floor((payload.exp - now) / 60);
      if (minsUntilExpiry < 5) {
        analysis.warnings.push(`Token expires in ${minsUntilExpiry} minutes`);
      }
    }
  }
  if (payload.nbf) {
    analysis.timestamps.notBefore = formatTimestamp(payload.nbf);
    if (payload.nbf > now) {
      analysis.warnings.push('Token not yet valid (nbf is in the future)');
    }
  }

  // Identify common claims
  analysis.claims = {};
  const claimNames = {
    sub: 'Subject',
    iss: 'Issuer',
    aud: 'Audience',
    scope: 'Scopes',
    roles: 'Roles',
    email: 'Email',
    name: 'Name'
  };
  
  for (const [key, label] of Object.entries(claimNames)) {
    if (payload[key]) {
      analysis.claims[label] = payload[key];
    }
  }

  return analysis;
}

function formatOutput(decoded, analysis) {
  let output = '\n🔓 JWT DECODED\n';
  output += '═'.repeat(50) + '\n\n';

  output += '📋 HEADER:\n';
  output += JSON.stringify(decoded.header, null, 2) + '\n\n';

  output += '📦 PAYLOAD:\n';
  output += JSON.stringify(decoded.payload, null, 2) + '\n\n';

  if (Object.keys(analysis.timestamps).length > 0) {
    output += '⏰ TIMESTAMPS:\n';
    for (const [key, value] of Object.entries(analysis.timestamps)) {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      output += `   • ${label}: ${value}\n`;
    }
    output += '\n';
  }

  if (Object.keys(analysis.claims).length > 0) {
    output += '🏷️  KEY CLAIMS:\n';
    for (const [label, value] of Object.entries(analysis.claims)) {
      const displayValue = Array.isArray(value) ? value.join(', ') : value;
      output += `   • ${label}: ${displayValue}\n`;
    }
    output += '\n';
  }

  // Status
  if (analysis.status === 'expired') {
    output += '❌ STATUS: Token is EXPIRED\n';
  } else if (analysis.warnings.length > 0) {
    output += '⚠️  STATUS: Valid with warnings\n';
  } else {
    output += '✅ STATUS: Token appears valid (signature not verified)\n';
  }

  if (analysis.warnings.length > 0) {
    output += '\n⚠️  WARNINGS:\n';
    for (const warning of analysis.warnings) {
      output += `   • ${warning}\n`;
    }
  }

  output += '\n' + '─'.repeat(50);
  output += '\n⚡ Note: Signature NOT verified - for inspection only\n';

  return output;
}

// Main
const token = process.argv[2];

if (!token) {
  console.log('Usage: node decode.js <jwt-token>');
  console.log('\nExample:');
  console.log('  node decode.js eyJhbGciOiJIUzI1NiIs...');
  process.exit(1);
}

try {
  const decoded = decodeJWT(token);
  const analysis = analyzeToken(decoded);
  console.log(formatOutput(decoded, analysis));
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
