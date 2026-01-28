/**
 * cron-explainer - Parse and explain cron expressions in plain English
 * Author: Echo (Collective Cortex)
 */

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];

const LIMITS = {
  minute: { min: 0, max: 59, name: 'minute' },
  hour: { min: 0, max: 23, name: 'hour' },
  dayOfMonth: { min: 1, max: 31, name: 'day of month' },
  month: { min: 1, max: 12, name: 'month' },
  dayOfWeek: { min: 0, max: 6, name: 'day of week' }
};

function parseField(value, limits) {
  const errors = [];
  const values = new Set();
  
  // Handle wildcard
  if (value === '*') {
    for (let i = limits.min; i <= limits.max; i++) values.add(i);
    return { values: Array.from(values), errors, isWildcard: true };
  }
  
  // Handle step values like */15 or 0-30/5
  if (value.includes('/')) {
    const [range, step] = value.split('/');
    const stepNum = parseInt(step);
    if (isNaN(stepNum) || stepNum < 1) {
      errors.push(`Invalid step value: ${step}`);
      return { values: [], errors };
    }
    
    let start = limits.min, end = limits.max;
    if (range !== '*') {
      if (range.includes('-')) {
        [start, end] = range.split('-').map(Number);
      } else {
        start = parseInt(range);
        end = limits.max;
      }
    }
    
    for (let i = start; i <= end; i += stepNum) {
      if (i >= limits.min && i <= limits.max) values.add(i);
    }
    return { values: Array.from(values).sort((a,b) => a-b), errors };
  }
  
  // Handle lists and ranges
  const parts = value.split(',');
  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(Number);
      if (isNaN(start) || isNaN(end)) {
        errors.push(`Invalid range: ${part}`);
        continue;
      }
      if (start < limits.min || start > limits.max) {
        errors.push(`Invalid ${limits.name} value: ${start} (must be ${limits.min}-${limits.max})`);
        continue;
      }
      if (end < limits.min || end > limits.max) {
        errors.push(`Invalid ${limits.name} value: ${end} (must be ${limits.min}-${limits.max})`);
        continue;
      }
      for (let i = start; i <= end; i++) values.add(i);
    } else {
      const num = parseInt(part);
      if (isNaN(num)) {
        errors.push(`Invalid value: ${part}`);
        continue;
      }
      if (num < limits.min || num > limits.max) {
        errors.push(`Invalid ${limits.name} value: ${num} (must be ${limits.min}-${limits.max})`);
        continue;
      }
      values.add(num);
    }
  }
  
  return { values: Array.from(values).sort((a,b) => a-b), errors };
}

function formatTime(hour, minute) {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const m = minute.toString().padStart(2, '0');
  return `${h}:${m} ${ampm}`;
}

function formatDayRange(days) {
  if (days.length === 7) return 'every day';
  if (days.length === 0) return 'never';
  
  // Check for weekdays
  if (JSON.stringify(days) === '[1,2,3,4,5]') return 'Monday through Friday';
  // Check for weekends
  if (JSON.stringify(days) === '[0,6]') return 'weekends';
  
  // Check for consecutive ranges
  const names = days.map(d => DAYS_OF_WEEK[d]);
  if (days.length > 2) {
    let isConsecutive = true;
    for (let i = 1; i < days.length; i++) {
      if (days[i] !== days[i-1] + 1) isConsecutive = false;
    }
    if (isConsecutive) {
      return `${names[0]} through ${names[names.length-1]}`;
    }
  }
  
  return names.join(', ');
}

function explain(expression) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) {
    return {
      valid: false,
      error: `Expected 5 fields, got ${parts.length}. Format: minute hour day month weekday`
    };
  }
  
  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;
  
  const minute = parseField(minStr, LIMITS.minute);
  const hour = parseField(hourStr, LIMITS.hour);
  const dayOfMonth = parseField(domStr, LIMITS.dayOfMonth);
  const month = parseField(monthStr, LIMITS.month);
  const dayOfWeek = parseField(dowStr, LIMITS.dayOfWeek);
  
  const allErrors = [
    ...minute.errors,
    ...hour.errors,
    ...dayOfMonth.errors,
    ...month.errors,
    ...dayOfWeek.errors
  ];
  
  if (allErrors.length > 0) {
    return {
      valid: false,
      error: allErrors.join('; ')
    };
  }
  
  // Build explanation
  const explanationParts = [];
  
  // Time part
  if (minute.values.length === 1 && hour.values.length === 1) {
    explanationParts.push(`At ${formatTime(hour.values[0], minute.values[0])}`);
  } else if (minute.isWildcard && hour.isWildcard) {
    explanationParts.push('Every minute');
  } else if (minute.isWildcard) {
    const hours = hour.values.map(h => formatTime(h, 0).replace(':00', '')).join(', ');
    explanationParts.push(`Every minute during ${hours}`);
  } else if (hour.isWildcard) {
    if (minute.values.length === 1 && minute.values[0] === 0) {
      explanationParts.push('Every hour');
    } else {
      const stepMatch = minStr.match(/^\*\/(\d+)$/);
      if (stepMatch) {
        explanationParts.push(`Every ${stepMatch[1]} minutes`);
      } else {
        explanationParts.push(`At minute ${minute.values.join(', ')} of every hour`);
      }
    }
  } else {
    const times = [];
    for (const h of hour.values) {
      for (const m of minute.values) {
        times.push(formatTime(h, m));
      }
    }
    if (times.length <= 4) {
      explanationParts.push(`At ${times.join(' and ')}`);
    } else {
      explanationParts.push(`At ${times.length} different times`);
    }
  }
  
  // Day of week part
  if (!dayOfWeek.isWildcard) {
    explanationParts.push(formatDayRange(dayOfWeek.values));
  }
  
  // Day of month part
  if (!dayOfMonth.isWildcard) {
    const days = dayOfMonth.values;
    if (days.length === 1) {
      const d = days[0];
      const suffix = d === 1 || d === 21 || d === 31 ? 'st' :
                    d === 2 || d === 22 ? 'nd' :
                    d === 3 || d === 23 ? 'rd' : 'th';
      explanationParts.push(`on the ${d}${suffix}`);
    } else {
      explanationParts.push(`on days ${days.join(', ')}`);
    }
  }
  
  // Month part
  if (!month.isWildcard) {
    const monthNames = month.values.map(m => MONTHS[m - 1]);
    if (monthNames.length === 1) {
      explanationParts.push(`in ${monthNames[0]}`);
    } else {
      explanationParts.push(`in ${monthNames.join(', ')}`);
    }
  }
  
  return {
    valid: true,
    explanation: explanationParts.join(', '),
    parts: {
      minute: minStr,
      hour: hourStr,
      dayOfMonth: domStr,
      month: monthStr,
      dayOfWeek: dowStr
    },
    nextRuns: getNextRuns(expression, 3)
  };
}

function getNextRuns(expression, count = 3) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return [];
  
  const [minStr, hourStr, domStr, monthStr, dowStr] = parts;
  
  const minute = parseField(minStr, LIMITS.minute);
  const hour = parseField(hourStr, LIMITS.hour);
  const dayOfMonth = parseField(domStr, LIMITS.dayOfMonth);
  const month = parseField(monthStr, LIMITS.month);
  const dayOfWeek = parseField(dowStr, LIMITS.dayOfWeek);
  
  const runs = [];
  const now = new Date();
  let current = new Date(now);
  current.setSeconds(0);
  current.setMilliseconds(0);
  
  // Limit iterations to prevent infinite loops
  const maxIterations = 10000;
  let iterations = 0;
  
  while (runs.length < count && iterations < maxIterations) {
    iterations++;
    current = new Date(current.getTime() + 60000); // Add 1 minute
    
    const m = current.getMonth() + 1;
    const dom = current.getDate();
    const dow = current.getDay();
    const h = current.getHours();
    const min = current.getMinutes();
    
    if (!month.values.includes(m)) continue;
    if (!dayOfMonth.isWildcard && !dayOfMonth.values.includes(dom)) continue;
    if (!dayOfWeek.isWildcard && !dayOfWeek.values.includes(dow)) continue;
    if (!hour.values.includes(h)) continue;
    if (!minute.values.includes(min)) continue;
    
    runs.push(current.toISOString());
  }
  
  return runs;
}

function validate(expression) {
  const result = explain(expression);
  if (result.valid) {
    return { valid: true };
  }
  return { valid: false, error: result.error };
}

// Export for use as module
module.exports = { explain, validate, parseField, getNextRuns };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node index.js "cron expression"');
    console.log('Example: node index.js "0 9 * * 1-5"');
    process.exit(1);
  }
  
  const expression = args.join(' ');
  const result = explain(expression);
  console.log(JSON.stringify(result, null, 2));
}
