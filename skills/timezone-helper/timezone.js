#!/usr/bin/env node
/**
 * Timezone Helper - Convert and display times across timezones
 * No dependencies required - uses Node.js built-in Intl API
 */

const COMMON_ZONES = {
  // Americas
  'America/New_York': { aliases: ['eastern', 'est', 'edt', 'new york', 'nyc', 'boston', 'miami', 'atlanta'] },
  'America/Chicago': { aliases: ['central', 'cst', 'cdt', 'chicago', 'dallas', 'houston'] },
  'America/Denver': { aliases: ['mountain', 'mst', 'mdt', 'denver', 'phoenix'] },
  'America/Los_Angeles': { aliases: ['pacific', 'pst', 'pdt', 'los angeles', 'la', 'seattle', 'san francisco'] },
  'America/Sao_Paulo': { aliases: ['brazil', 'sao paulo'] },
  
  // Europe
  'Europe/London': { aliases: ['uk', 'gmt', 'bst', 'london', 'britain', 'england'] },
  'Europe/Paris': { aliases: ['paris', 'cet', 'cest', 'france'] },
  'Europe/Berlin': { aliases: ['berlin', 'germany', 'frankfurt'] },
  'Europe/Amsterdam': { aliases: ['amsterdam', 'netherlands', 'holland'] },
  'Europe/Moscow': { aliases: ['moscow', 'russia'] },
  
  // Asia
  'Asia/Tokyo': { aliases: ['tokyo', 'japan', 'jst'] },
  'Asia/Shanghai': { aliases: ['shanghai', 'china', 'beijing', 'cst-china'] },
  'Asia/Hong_Kong': { aliases: ['hong kong', 'hkt'] },
  'Asia/Singapore': { aliases: ['singapore', 'sgt'] },
  'Asia/Dubai': { aliases: ['dubai', 'uae', 'gulf'] },
  'Asia/Kolkata': { aliases: ['india', 'mumbai', 'delhi', 'ist-india'] },
  'Asia/Seoul': { aliases: ['seoul', 'korea', 'kst'] },
  
  // Oceania
  'Australia/Sydney': { aliases: ['sydney', 'australia', 'aest', 'aedt', 'melbourne'] },
  'Pacific/Auckland': { aliases: ['auckland', 'new zealand', 'nzst', 'nzdt'] },
  
  // UTC
  'UTC': { aliases: ['utc', 'zulu', 'gmt', 'coordinated'] }
};

function resolveTimezone(input) {
  if (!input) return null;
  const lower = input.toLowerCase().trim();
  
  // Direct IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: input });
    return input;
  } catch (e) {}
  
  // Search aliases
  for (const [zone, { aliases }] of Object.entries(COMMON_ZONES)) {
    if (aliases.some(a => lower.includes(a) || a.includes(lower))) {
      return zone;
    }
  }
  
  return null;
}

function formatTime(date, timezone, format = 'full') {
  const opts = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  if (format === 'full') {
    opts.weekday = 'short';
    opts.month = 'short';
    opts.day = 'numeric';
  }
  
  return new Intl.DateTimeFormat('en-US', opts).format(date);
}

function getOffsetMs(timezone) {
  const now = new Date();
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
  return tzDate - utcDate;
}

function getOffset(timezone) {
  const diffMs = getOffsetMs(timezone);
  const diffHours = diffMs / (1000 * 60 * 60);
  const sign = diffHours >= 0 ? '+' : '';
  return `UTC${sign}${diffHours}`;
}

function parseTimeInput(timeStr) {
  // Handle various formats: "3:30 PM", "15:30", "3pm", etc.
  const now = new Date();
  let hours, minutes = 0;
  
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
  if (!match) return null;
  
  hours = parseInt(match[1]);
  if (match[2]) minutes = parseInt(match[2]);
  
  if (match[3]) {
    const isPM = match[3].toLowerCase() === 'pm';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
  }
  
  const date = new Date(now);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// Commands
const commands = {
  now(args) {
    const tzInput = args[0] || 'UTC';
    const timezone = resolveTimezone(tzInput);
    
    if (!timezone) {
      return { error: `Unknown timezone: ${tzInput}`, suggestion: 'Try: node timezone.js list' };
    }
    
    const now = new Date();
    return {
      timezone,
      time: formatTime(now, timezone),
      offset: getOffset(timezone),
      iso: now.toISOString()
    };
  },
  
  convert(args) {
    const [timeStr, fromTz, toTz] = args;
    
    if (!timeStr || !fromTz || !toTz) {
      return { error: 'Usage: convert "3:30 PM" "America/New_York" "Europe/London"' };
    }
    
    const fromZone = resolveTimezone(fromTz);
    const toZone = resolveTimezone(toTz);
    
    if (!fromZone) return { error: `Unknown source timezone: ${fromTz}` };
    if (!toZone) return { error: `Unknown target timezone: ${toTz}` };
    
    const parsed = parseTimeInput(timeStr);
    if (!parsed) return { error: `Could not parse time: ${timeStr}` };
    
    // Build an ISO-ish string for the input time in the source timezone
    // Then convert to target timezone using Intl
    const hours = parsed.getHours().toString().padStart(2, '0');
    const mins = parsed.getMinutes().toString().padStart(2, '0');
    const today = new Date().toISOString().split('T')[0];
    
    // Create date assuming input is in source timezone
    // Use formatter to get offset, then adjust
    const fakeDate = new Date(`${today}T${hours}:${mins}:00`);
    
    // Format in both zones - the difference tells us the conversion
    const inSource = formatTime(fakeDate, fromZone, 'short');
    const inTarget = formatTime(fakeDate, toZone, 'short');
    
    // Calculate hour difference between zones
    const fromOffsetMs = getOffsetMs(fromZone);
    const toOffsetMs = getOffsetMs(toZone);
    const diffMs = toOffsetMs - fromOffsetMs;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return {
      input: timeStr,
      from: { timezone: fromZone, offset: getOffset(fromZone), time: inSource },
      to: { timezone: toZone, offset: getOffset(toZone), time: inTarget },
      difference: `${diffHours >= 0 ? '+' : ''}${diffHours} hours`
    };
  },
  
  list() {
    const zones = Object.entries(COMMON_ZONES).map(([zone, { aliases }]) => ({
      timezone: zone,
      currentTime: formatTime(new Date(), zone, 'short'),
      offset: getOffset(zone),
      aliases: aliases.slice(0, 3).join(', ')
    }));
    return { timezones: zones };
  },
  
  find(args) {
    const query = args.join(' ').toLowerCase();
    if (!query) return { error: 'Usage: find <city or country>' };
    
    const matches = [];
    for (const [zone, { aliases }] of Object.entries(COMMON_ZONES)) {
      if (zone.toLowerCase().includes(query) || aliases.some(a => a.includes(query))) {
        matches.push({
          timezone: zone,
          currentTime: formatTime(new Date(), zone, 'short'),
          offset: getOffset(zone)
        });
      }
    }
    
    return matches.length ? { matches } : { error: `No timezones found for: ${query}` };
  },
  
  help() {
    return {
      commands: {
        'now [timezone]': 'Show current time in timezone',
        'convert "time" "from" "to"': 'Convert time between timezones',
        'list': 'Show all common timezones',
        'find <query>': 'Search for timezone by city/country'
      },
      examples: [
        'node timezone.js now Tokyo',
        'node timezone.js convert "3:30 PM" NYC London',
        'node timezone.js find australia'
      ]
    };
  }
};

// Main
const [,, cmd, ...args] = process.argv;
const command = commands[cmd] || commands.help;
console.log(JSON.stringify(command(args), null, 2));
