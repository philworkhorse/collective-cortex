/**
 * shell-escape - Safely escape strings for shell commands
 * 
 * Prevents command injection when building dynamic shell commands.
 * Handles bash, zsh, sh, fish, powershell, and cmd.
 */

// Dangerous patterns that warrant warnings
const DANGEROUS_PATTERNS = [
  { pattern: /\$\(.*\)/, name: 'command substitution $()' },
  { pattern: /`.*`/, name: 'backtick command substitution' },
  { pattern: /\$\{.*\}/, name: 'variable expansion ${}' },
  { pattern: /[;&|]/, name: 'command chaining characters' },
  { pattern: />|>>|</, name: 'redirection operators' },
  { pattern: /\n|\r/, name: 'newlines (potential injection)' },
  { pattern: /\0/, name: 'null bytes' },
];

/**
 * Escape for POSIX shells (bash, zsh, sh) using single quotes
 * Single quotes are safest - only ' itself needs escaping
 */
function escapePosixSingle(text) {
  // In single quotes, only single quote needs escaping
  // We do: replace ' with '\'' (end quote, escaped quote, start quote)
  return "'" + text.replace(/'/g, "'\\''") + "'";
}

/**
 * Escape for POSIX shells using double quotes
 * More characters need escaping: $ ` \ " ! (in bash)
 */
function escapePosixDouble(text) {
  const escaped = text
    .replace(/\\/g, '\\\\')   // backslash first
    .replace(/"/g, '\\"')      // double quotes
    .replace(/\$/g, '\\$')     // dollar signs
    .replace(/`/g, '\\`')      // backticks
    .replace(/!/g, '\\!');     // history expansion (bash)
  return '"' + escaped + '"';
}

/**
 * Escape using backslashes (no quotes)
 * Every special character gets a backslash
 */
function escapePosixBackslash(text) {
  // Escape all shell metacharacters
  return text.replace(/([\\'"$ `!#&*(){}[\]|;<>?~\n\t])/g, '\\$1');
}

/**
 * Escape for fish shell
 * Fish uses single quotes differently - backslash escapes work inside
 */
function escapeFish(text, mode) {
  if (mode === 'single') {
    // Fish: single quotes, escape ' with \'
    return "'" + text.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  }
  // Double quotes work similarly to POSIX
  return escapePosixDouble(text);
}

/**
 * Escape for PowerShell
 * Uses different escaping rules - backtick is escape character
 */
function escapePowerShell(text, mode) {
  if (mode === 'single') {
    // Single quotes: only ' needs escaping (doubled)
    return "'" + text.replace(/'/g, "''") + "'";
  }
  // Double quotes: use backtick for special chars
  const escaped = text
    .replace(/`/g, '``')       // backtick (escape char)
    .replace(/"/g, '`"')       // double quotes
    .replace(/\$/g, '`$')      // variables
    .replace(/\n/g, '`n')      // newline
    .replace(/\r/g, '`r')      // carriage return
    .replace(/\t/g, '`t');     // tab
  return '"' + escaped + '"';
}

/**
 * Escape for Windows cmd.exe
 * Uses ^ as escape character, very limited
 */
function escapeCmd(text) {
  // cmd.exe: ^ escapes special characters
  // Double quotes need to be doubled
  const escaped = text
    .replace(/([&|<>^])/g, '^$1')  // escape metacharacters
    .replace(/"/g, '""');          // double quotes
  return '"' + escaped + '"';
}

/**
 * Detect dangerous patterns in input
 */
function detectDangers(text) {
  const warnings = [];
  for (const { pattern, name } of DANGEROUS_PATTERNS) {
    if (pattern.test(text)) {
      warnings.push(`Input contains ${name}`);
    }
  }
  return warnings;
}

/**
 * Main handler
 */
module.exports = async function handler(input) {
  const { text, shell = 'bash', mode = 'single' } = input;
  
  if (typeof text !== 'string') {
    return {
      error: 'text must be a string',
      escaped: null
    };
  }
  
  // Detect dangerous patterns
  const warnings = detectDangers(text);
  
  let escaped;
  const shellLower = shell.toLowerCase();
  
  switch (shellLower) {
    case 'bash':
    case 'zsh':
    case 'sh':
      if (mode === 'double') {
        escaped = escapePosixDouble(text);
      } else if (mode === 'escape' || mode === 'backslash') {
        escaped = escapePosixBackslash(text);
      } else {
        escaped = escapePosixSingle(text);
      }
      break;
      
    case 'fish':
      escaped = escapeFish(text, mode);
      break;
      
    case 'powershell':
    case 'pwsh':
      escaped = escapePowerShell(text, mode);
      break;
      
    case 'cmd':
    case 'batch':
      escaped = escapeCmd(text);
      if (mode !== 'double') {
        warnings.push('cmd.exe only supports double-quote escaping');
      }
      break;
      
    default:
      // Default to POSIX single-quote (safest)
      escaped = escapePosixSingle(text);
      warnings.push(`Unknown shell '${shell}', using POSIX single-quote escaping`);
  }
  
  // Generate example command
  const echoCmd = shellLower === 'powershell' || shellLower === 'pwsh'
    ? `Write-Output ${escaped}`
    : shellLower === 'cmd' || shellLower === 'batch'
    ? `echo ${escaped}`
    : `echo ${escaped}`;
  
  return {
    escaped,
    command: echoCmd,
    warnings,
    input: {
      original: text,
      length: text.length,
      shell: shellLower,
      mode
    }
  };
};
