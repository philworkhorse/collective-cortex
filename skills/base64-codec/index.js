/**
 * Base64 Codec
 * Encode and decode base64 strings with URL-safe support and binary detection.
 */

function isValidBase64(str) {
  // Handle URL-safe base64 by converting first
  const normalized = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Check basic format (allowing for missing padding)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(normalized)) {
    return false;
  }
  
  // Try to decode - if it fails, not valid base64
  try {
    Buffer.from(normalized, 'base64');
    return true;
  } catch {
    return false;
  }
}

function containsBinary(buffer) {
  // Check if buffer contains non-printable characters (likely binary)
  for (let i = 0; i < Math.min(buffer.length, 1000); i++) {
    const byte = buffer[i];
    // Allow printable ASCII, tabs, newlines, carriage returns
    if (byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) {
      return true;
    }
    // Check for NULL bytes (strong indicator of binary)
    if (byte === 0) {
      return true;
    }
  }
  return false;
}

function encode(input, urlSafe = false) {
  const encoded = Buffer.from(input, 'utf-8').toString('base64');
  
  if (urlSafe) {
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  
  return encoded;
}

function decode(input, urlSafe = false) {
  // Normalize URL-safe base64
  let normalized = input;
  if (urlSafe || input.includes('-') || input.includes('_')) {
    normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const padding = (4 - (normalized.length % 4)) % 4;
    normalized += '='.repeat(padding);
  }
  
  const buffer = Buffer.from(normalized, 'base64');
  const isBinary = containsBinary(buffer);
  
  return {
    output: isBinary ? `[Binary data: ${buffer.length} bytes]` : buffer.toString('utf-8'),
    isBinary,
    byteLength: buffer.length
  };
}

async function run(params) {
  const { action = 'decode', input, urlSafe = false } = params;
  
  if (!input) {
    return {
      success: false,
      error: 'Missing required parameter: input'
    };
  }
  
  try {
    switch (action) {
      case 'encode': {
        const output = encode(input, urlSafe);
        return {
          success: true,
          action: 'encode',
          input: input.length > 100 ? `${input.substring(0, 100)}...` : input,
          output,
          inputLength: input.length,
          outputLength: output.length
        };
      }
      
      case 'decode': {
        if (!isValidBase64(input)) {
          return {
            success: false,
            error: 'Invalid base64 string',
            hint: 'Check for invalid characters or malformed padding'
          };
        }
        
        const result = decode(input, urlSafe);
        return {
          success: true,
          action: 'decode',
          input: input.length > 100 ? `${input.substring(0, 100)}...` : input,
          output: result.output,
          inputLength: input.length,
          outputLength: result.byteLength,
          isBinary: result.isBinary,
          ...(result.isBinary && { warning: 'Output contains binary data' })
        };
      }
      
      case 'validate': {
        const valid = isValidBase64(input);
        let details = {};
        
        if (valid) {
          const result = decode(input, urlSafe);
          details = {
            decodedLength: result.byteLength,
            isBinary: result.isBinary,
            isUrlSafe: input.includes('-') || input.includes('_')
          };
        }
        
        return {
          success: true,
          action: 'validate',
          input: input.length > 100 ? `${input.substring(0, 100)}...` : input,
          valid,
          ...details
        };
      }
      
      default:
        return {
          success: false,
          error: `Unknown action: ${action}`,
          validActions: ['encode', 'decode', 'validate']
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { run };
