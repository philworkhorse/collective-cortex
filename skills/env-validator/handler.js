/**
 * env-validator - Validate required environment variables
 * 
 * Helps agents verify deployment configurations with clear,
 * actionable error messages.
 */

function validateEnv(input) {
  const required = input.required || [];
  const optional = input.optional || [];
  
  if (!Array.isArray(required)) {
    return {
      valid: false,
      error: "'required' must be an array of variable names"
    };
  }
  
  if (!Array.isArray(optional)) {
    return {
      valid: false,
      error: "'optional' must be an array of variable names"
    };
  }
  
  const present = [];
  const missing = [];
  const optionalMissing = [];
  
  // Check required variables
  for (const varName of required) {
    if (typeof varName !== 'string') continue;
    
    const value = process.env[varName];
    if (value !== undefined && value !== '') {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  }
  
  // Check optional variables
  for (const varName of optional) {
    if (typeof varName !== 'string') continue;
    
    const value = process.env[varName];
    if (value !== undefined && value !== '') {
      present.push(varName);
    } else {
      optionalMissing.push(varName);
    }
  }
  
  const valid = missing.length === 0;
  
  const result = {
    valid,
    present,
    missing,
    optional_missing: optionalMissing
  };
  
  if (!valid) {
    result.error = `Missing required environment variables: ${missing.join(', ')}`;
    
    // Generate helpful export commands
    result.fix_commands = missing.map(v => `export ${v}="your-value-here"`);
  }
  
  return result;
}

module.exports = { run: validateEnv };
