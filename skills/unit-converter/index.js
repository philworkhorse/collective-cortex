/**
 * Unit Converter
 * Convert between common units of measurement
 */

const conversions = {
  // Length - base unit: meters
  length: {
    m: 1,
    meter: 1,
    meters: 1,
    km: 1000,
    kilometer: 1000,
    kilometers: 1000,
    cm: 0.01,
    centimeter: 0.01,
    centimeters: 0.01,
    mm: 0.001,
    millimeter: 0.001,
    millimeters: 0.001,
    ft: 0.3048,
    foot: 0.3048,
    feet: 0.3048,
    in: 0.0254,
    inch: 0.0254,
    inches: 0.0254,
    yd: 0.9144,
    yard: 0.9144,
    yards: 0.9144,
    mi: 1609.344,
    mile: 1609.344,
    miles: 1609.344,
  },

  // Weight - base unit: grams
  weight: {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    mg: 0.001,
    milligram: 0.001,
    milligrams: 0.001,
    lb: 453.592,
    pound: 453.592,
    pounds: 453.592,
    oz: 28.3495,
    ounce: 28.3495,
    ounces: 28.3495,
  },

  // Data - base unit: bytes
  data: {
    b: 1,
    byte: 1,
    bytes: 1,
    kb: 1024,
    kilobyte: 1024,
    kilobytes: 1024,
    mb: 1024 ** 2,
    megabyte: 1024 ** 2,
    megabytes: 1024 ** 2,
    gb: 1024 ** 3,
    gigabyte: 1024 ** 3,
    gigabytes: 1024 ** 3,
    tb: 1024 ** 4,
    terabyte: 1024 ** 4,
    terabytes: 1024 ** 4,
  },

  // Volume - base unit: liters
  volume: {
    l: 1,
    liter: 1,
    liters: 1,
    ml: 0.001,
    milliliter: 0.001,
    milliliters: 0.001,
    gal: 3.78541,
    gallon: 3.78541,
    gallons: 3.78541,
    qt: 0.946353,
    quart: 0.946353,
    quarts: 0.946353,
    pt: 0.473176,
    pint: 0.473176,
    pints: 0.473176,
    cup: 0.236588,
    cups: 0.236588,
    floz: 0.0295735,
  },

  // Time - base unit: seconds
  time: {
    s: 1,
    sec: 1,
    second: 1,
    seconds: 1,
    min: 60,
    minute: 60,
    minutes: 60,
    h: 3600,
    hr: 3600,
    hour: 3600,
    hours: 3600,
    d: 86400,
    day: 86400,
    days: 86400,
    w: 604800,
    week: 604800,
    weeks: 604800,
  },
};

// Temperature needs special handling (not ratio-based)
const tempUnits = ['c', 'celsius', 'f', 'fahrenheit', 'k', 'kelvin'];

function normalizeUnit(unit) {
  return unit.toLowerCase().trim();
}

function findCategory(unit) {
  const normalized = normalizeUnit(unit);
  
  // Check temperature first
  if (tempUnits.includes(normalized)) {
    return 'temperature';
  }
  
  // Check other categories
  for (const [category, units] of Object.entries(conversions)) {
    if (normalized in units) {
      return category;
    }
  }
  return null;
}

function convertTemperature(value, from, to) {
  const f = normalizeUnit(from);
  const t = normalizeUnit(to);
  
  // Convert to Celsius first
  let celsius;
  if (f === 'c' || f === 'celsius') {
    celsius = value;
  } else if (f === 'f' || f === 'fahrenheit') {
    celsius = (value - 32) * 5 / 9;
  } else if (f === 'k' || f === 'kelvin') {
    celsius = value - 273.15;
  }
  
  // Convert from Celsius to target
  if (t === 'c' || t === 'celsius') {
    return celsius;
  } else if (t === 'f' || t === 'fahrenheit') {
    return celsius * 9 / 5 + 32;
  } else if (t === 'k' || t === 'kelvin') {
    return celsius + 273.15;
  }
}

function convert(value, fromUnit, toUnit) {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  
  const fromCategory = findCategory(from);
  const toCategory = findCategory(to);
  
  if (!fromCategory) {
    return { error: `Unknown unit: ${fromUnit}` };
  }
  if (!toCategory) {
    return { error: `Unknown unit: ${toUnit}` };
  }
  if (fromCategory !== toCategory) {
    return { error: `Cannot convert between ${fromCategory} and ${toCategory}` };
  }
  
  // Handle temperature separately
  if (fromCategory === 'temperature') {
    const result = convertTemperature(value, from, to);
    return {
      input: { value, unit: fromUnit },
      output: { value: Number(result.toFixed(6)), unit: toUnit },
      category: 'temperature',
    };
  }
  
  // Standard ratio-based conversion
  const categoryUnits = conversions[fromCategory];
  const baseValue = value * categoryUnits[from];
  const result = baseValue / categoryUnits[to];
  
  return {
    input: { value, unit: fromUnit },
    output: { value: Number(result.toFixed(6)), unit: toUnit },
    category: fromCategory,
  };
}

function parseQuery(query) {
  // Parse: "100 km to mi" or "convert 100 km to mi"
  const patterns = [
    /^convert\s+([\d.]+)\s+(\w+)\s+to\s+(\w+)$/i,
    /^([\d.]+)\s+(\w+)\s+to\s+(\w+)$/i,
    /^([\d.]+)\s+(\w+)\s+in\s+(\w+)$/i,
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match) {
      return {
        value: parseFloat(match[1]),
        from: match[2],
        to: match[3],
      };
    }
  }
  return null;
}

function listCategories() {
  const categories = {};
  
  for (const [category, units] of Object.entries(conversions)) {
    // Get unique base unit names
    const uniqueUnits = [...new Set(Object.keys(units).filter(u => u.length <= 4))];
    categories[category] = uniqueUnits;
  }
  
  categories.temperature = ['c', 'f', 'k'];
  
  return categories;
}

module.exports = {
  convert,
  parseQuery,
  listCategories,
  
  // Direct API for programmatic use
  api: {
    convert: (params) => {
      if (params.query) {
        const parsed = parseQuery(params.query);
        if (!parsed) {
          return { error: 'Could not parse query. Use format: "100 km to mi"' };
        }
        return convert(parsed.value, parsed.from, parsed.to);
      }
      
      const { value, from, to } = params;
      if (value === undefined || !from || !to) {
        return { error: 'Required: value, from, to (or query string)' };
      }
      return convert(parseFloat(value), from, to);
    },
    
    categories: () => listCategories(),
  },
};
