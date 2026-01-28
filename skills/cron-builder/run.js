#!/usr/bin/env node
/**
 * cron-builder - Build cron expressions from human-readable descriptions
 * Author: Echo Agent (Collective Cortex)
 */

const DAYS = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6
};

const WEEKDAYS = '1-5';
const WEEKENDS = '0,6';

function parseTime(str) {
  // Handle "noon", "midnight"
  if (/\bnoon\b/i.test(str)) return { hour: 12, minute: 0 };
  if (/\bmidnight\b/i.test(str)) return { hour: 0, minute: 0 };
  
  // Handle "at 3pm", "at 9am", "at 3:30pm", "at 14:00"
  // Must have "at" or am/pm to distinguish from intervals like "every 5 minutes"
  const timeMatch = str.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i) ||
                    str.match(/at\s+(\d{1,2})(?::(\d{2}))?(?:\s*(am|pm))?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const period = timeMatch[3]?.toLowerCase();
    
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    
    return { hour, minute };
  }
  
  return null;
}

function parseDayOfWeek(str) {
  const lower = str.toLowerCase();
  
  // Weekday/weekend
  if (/\bweekday/i.test(lower)) return WEEKDAYS;
  if (/\bweekend/i.test(lower)) return WEEKENDS;
  
  // Specific days
  const days = [];
  for (const [name, num] of Object.entries(DAYS)) {
    if (lower.includes(name)) {
      if (!days.includes(num)) days.push(num);
    }
  }
  
  if (days.length > 0) {
    days.sort((a, b) => a - b);
    return days.join(',');
  }
  
  return '*';
}

function parseDayOfMonth(str) {
  const lower = str.toLowerCase();
  
  // "1st", "15th", "first", "last"
  if (/\bfirst\b|\b1st\b/i.test(lower) && /\bof\s+(the\s+)?month|\bmonthly\b/i.test(lower)) {
    return '1';
  }
  if (/\b15th?\b/i.test(lower) && /\bof\s+(the\s+)?month|\bmonthly\b/i.test(lower)) {
    return '15';
  }
  
  // Generic "every Nth"
  const nthMatch = str.match(/\b(\d{1,2})(?:st|nd|rd|th)?\b.*(?:of\s+(?:the\s+)?month|monthly)/i);
  if (nthMatch) {
    return nthMatch[1];
  }
  
  return '*';
}

function parseInterval(str) {
  const lower = str.toLowerCase();
  
  // "every 5 minutes", "every 15 minutes"
  const minMatch = lower.match(/every\s+(\d+)\s*min/);
  if (minMatch) {
    return { field: 'minute', interval: parseInt(minMatch[1], 10) };
  }
  
  // "every 2 hours", "every 3 hours"
  const hourMatch = lower.match(/every\s+(\d+)\s*hour/);
  if (hourMatch) {
    return { field: 'hour', interval: parseInt(hourMatch[1], 10) };
  }
  
  // "every minute"
  if (/every\s+minute/i.test(lower)) {
    return { field: 'minute', interval: 1 };
  }
  
  // "every hour", "hourly"
  if (/every\s+hour|hourly/i.test(lower)) {
    return { field: 'hour', interval: 1 };
  }
  
  // "every day", "daily"
  if (/every\s+day|daily/i.test(lower)) {
    return { field: 'day', interval: 1 };
  }
  
  // "every week", "weekly"
  if (/every\s+week|weekly/i.test(lower)) {
    return { field: 'week', interval: 1 };
  }
  
  // "every month", "monthly"
  if (/every\s+month|monthly/i.test(lower)) {
    return { field: 'month', interval: 1 };
  }
  
  return null;
}

function buildCron(description) {
  const desc = description.toLowerCase().trim();
  
  // Start with defaults
  let minute = '0';
  let hour = '*';
  let dayOfMonth = '*';
  let month = '*';
  let dayOfWeek = '*';
  
  // Parse interval first
  const interval = parseInterval(desc);
  let skipTimeParse = false;
  
  if (interval) {
    switch (interval.field) {
      case 'minute':
        minute = interval.interval === 1 ? '*' : `*/${interval.interval}`;
        hour = '*';
        skipTimeParse = true; // Don't let time parsing override this
        break;
      case 'hour':
        minute = '0';
        hour = interval.interval === 1 ? '*' : `*/${interval.interval}`;
        skipTimeParse = true;
        break;
      case 'day':
        // Will be handled with time below
        break;
      case 'week':
        // Default to Monday for weekly
        dayOfWeek = '1';
        break;
      case 'month':
        dayOfMonth = '1';
        break;
    }
  }
  
  // Parse specific time (only if not an interval-based schedule)
  if (!skipTimeParse) {
    const time = parseTime(desc);
    if (time) {
      minute = time.minute.toString();
      hour = time.hour.toString();
    }
  }
  
  // Parse day of week (only if not monthly)
  if (!desc.includes('month')) {
    const dow = parseDayOfWeek(desc);
    if (dow !== '*') {
      dayOfWeek = dow;
    }
  }
  
  // Parse day of month
  const dom = parseDayOfMonth(desc);
  if (dom !== '*') {
    dayOfMonth = dom;
    dayOfWeek = '*'; // Can't use both
  }
  
  return `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;
}

function explainCron(cron) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cron.split(' ');
  const parts = [];
  
  // Minute
  if (minute === '*') {
    parts.push('every minute');
  } else if (minute.startsWith('*/')) {
    parts.push(`every ${minute.slice(2)} minutes`);
  } else {
    // handled with hour
  }
  
  // Hour
  if (hour === '*' && minute !== '*' && !minute.startsWith('*/')) {
    parts.push(`at minute ${minute} of every hour`);
  } else if (hour.startsWith('*/')) {
    parts.push(`every ${hour.slice(2)} hours`);
  } else if (hour !== '*') {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    parts.push(`at ${timeStr}`);
  }
  
  // Day of month
  if (dayOfMonth !== '*') {
    const suffix = dayOfMonth === '1' ? 'st' : dayOfMonth === '2' ? 'nd' : dayOfMonth === '3' ? 'rd' : 'th';
    parts.push(`on the ${dayOfMonth}${suffix}`);
  }
  
  // Month
  if (month !== '*') {
    parts.push(`in month ${month}`);
  }
  
  // Day of week
  if (dayOfWeek !== '*') {
    if (dayOfWeek === '1-5') {
      parts.push('on weekdays');
    } else if (dayOfWeek === '0,6') {
      parts.push('on weekends');
    } else {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const days = dayOfWeek.split(',').map(d => dayNames[parseInt(d, 10)]);
      parts.push(`on ${days.join(', ')}`);
    }
  }
  
  return parts.join(' ') || 'every minute';
}

function getNextRuns(cron, count = 3) {
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cron.split(' ');
  const runs = [];
  const now = new Date();
  let current = new Date(now);
  
  // Simple next-run calculator (approximation)
  for (let i = 0; i < count * 100 && runs.length < count; i++) {
    current = new Date(current.getTime() + 60000); // Add 1 minute
    
    const m = current.getMinutes();
    const h = current.getHours();
    const dom = current.getDate();
    const mon = current.getMonth() + 1;
    const dow = current.getDay();
    
    // Check minute
    if (minute !== '*' && !minute.startsWith('*/')) {
      if (m !== parseInt(minute, 10)) continue;
    } else if (minute.startsWith('*/')) {
      if (m % parseInt(minute.slice(2), 10) !== 0) continue;
    }
    
    // Check hour
    if (hour !== '*' && !hour.startsWith('*/')) {
      if (h !== parseInt(hour, 10)) continue;
    } else if (hour.startsWith('*/')) {
      if (h % parseInt(hour.slice(2), 10) !== 0) continue;
    }
    
    // Check day of month
    if (dayOfMonth !== '*') {
      if (dom !== parseInt(dayOfMonth, 10)) continue;
    }
    
    // Check month
    if (month !== '*') {
      if (mon !== parseInt(month, 10)) continue;
    }
    
    // Check day of week
    if (dayOfWeek !== '*') {
      if (dayOfWeek.includes('-')) {
        const [start, end] = dayOfWeek.split('-').map(Number);
        if (dow < start || dow > end) continue;
      } else if (dayOfWeek.includes(',')) {
        const days = dayOfWeek.split(',').map(Number);
        if (!days.includes(dow)) continue;
      } else {
        if (dow !== parseInt(dayOfWeek, 10)) continue;
      }
    }
    
    runs.push(current.toISOString().slice(0, 19));
  }
  
  return runs;
}

function main() {
  // Handle CLI args or stdin
  let input;
  
  if (process.argv[2]) {
    input = process.argv.slice(2).join(' ');
  } else {
    // Try to read from stdin for API use
    try {
      input = require('fs').readFileSync(0, 'utf-8').trim();
      if (input.startsWith('{')) {
        const json = JSON.parse(input);
        input = json.description || json.input || input;
      }
    } catch {
      console.error('Usage: node run.js "every weekday at 9am"');
      process.exit(1);
    }
  }
  
  if (!input) {
    console.error('Usage: node run.js "every weekday at 9am"');
    process.exit(1);
  }
  
  const cron = buildCron(input);
  const explanation = explainCron(cron);
  const nextRuns = getNextRuns(cron);
  
  const result = {
    input: input,
    cron: cron,
    explanation: explanation,
    nextRuns: nextRuns
  };
  
  console.log(JSON.stringify(result, null, 2));
}

main();
