/**
 * unix-timestamp - Convert between Unix timestamps and human-readable dates
 */

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);
  const diffWeek = Math.round(diffDay / 7);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const abs = Math.abs;
  const future = diffMs > 0;
  const prefix = future ? 'in ' : '';
  const suffix = future ? '' : ' ago';

  if (abs(diffSec) < 60) return future ? 'just now' : 'just now';
  if (abs(diffMin) < 60) return `${prefix}${abs(diffMin)} minute${abs(diffMin) !== 1 ? 's' : ''}${suffix}`;
  if (abs(diffHour) < 24) return `${prefix}${abs(diffHour)} hour${abs(diffHour) !== 1 ? 's' : ''}${suffix}`;
  if (abs(diffDay) < 7) return `${prefix}${abs(diffDay)} day${abs(diffDay) !== 1 ? 's' : ''}${suffix}`;
  if (abs(diffWeek) < 5) return `${prefix}${abs(diffWeek)} week${abs(diffWeek) !== 1 ? 's' : ''}${suffix}`;
  if (abs(diffMonth) < 12) return `${prefix}${abs(diffMonth)} month${abs(diffMonth) !== 1 ? 's' : ''}${suffix}`;
  return `${prefix}${abs(diffYear)} year${abs(diffYear) !== 1 ? 's' : ''}${suffix}`;
}

function formatOutput(date) {
  const unixSeconds = Math.floor(date.getTime() / 1000);
  return {
    unix_seconds: unixSeconds,
    unix_ms: date.getTime(),
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toString(),
    relative: getRelativeTime(date)
  };
}

function run(input) {
  const trimmed = (input || '').toString().trim();

  if (!trimmed) {
    return { error: 'No input provided. Supply a Unix timestamp, ISO date, or "now".' };
  }

  // Handle "now"
  if (trimmed.toLowerCase() === 'now') {
    return formatOutput(new Date());
  }

  // Try parsing as a number (Unix timestamp)
  const numericValue = Number(trimmed);
  if (!isNaN(numericValue) && trimmed.match(/^\d+$/)) {
    let date;
    // Detect if it's milliseconds (13+ digits) or seconds (10 digits)
    if (trimmed.length >= 13) {
      date = new Date(numericValue);
    } else {
      date = new Date(numericValue * 1000);
    }

    if (isNaN(date.getTime())) {
      return { error: 'Invalid Unix timestamp' };
    }

    return formatOutput(date);
  }

  // Try parsing as a date string
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return formatOutput(date);
  }

  // Try common formats
  // Format: "Jan 28, 2024" or "January 28, 2024"
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthMatch = trimmed.toLowerCase().match(/^([a-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (monthMatch) {
    const monthIdx = monthNames.findIndex(m => monthMatch[1].startsWith(m));
    if (monthIdx !== -1) {
      const parsed = new Date(parseInt(monthMatch[3]), monthIdx, parseInt(monthMatch[2]));
      if (!isNaN(parsed.getTime())) {
        return formatOutput(parsed);
      }
    }
  }

  return { error: `Could not parse input: "${trimmed}". Provide a Unix timestamp, ISO date, or "now".` };
}

module.exports = { run };
