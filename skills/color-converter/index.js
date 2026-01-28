/**
 * Color Converter
 * Convert between hex, RGB, and HSL color formats
 * 
 * Usage: POST /api/skills/color-converter/run
 * Body: { "color": "#ff5733" } or { "color": "rgb(255, 87, 51)" } or { "color": "hsl(9, 100%, 60%)" }
 */

function hexToRgb(hex) {
  const clean = hex.replace(/^#/, '');
  const expanded = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  
  const num = parseInt(expanded, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b]
    .map(x => Math.max(0, Math.min(255, Math.round(x))))
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) };
  }
  
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  
  let h;
  switch (max) {
    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
    case g: h = ((b - r) / d + 2) / 6; break;
    case b: h = ((r - g) / d + 4) / 6; break;
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  
  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
  };
}

function parseColor(input) {
  const str = input.trim().toLowerCase();
  
  // Hex: #fff or #ffffff
  if (/^#?[0-9a-f]{3}$|^#?[0-9a-f]{6}$/i.test(str)) {
    const rgb = hexToRgb(str);
    return { type: 'hex', ...rgb };
  }
  
  // RGB: rgb(255, 87, 51)
  const rgbMatch = str.match(/^rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return {
      type: 'rgb',
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  // HSL: hsl(9, 100%, 60%)
  const hslMatch = str.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?/);
  if (hslMatch) {
    const { r, g, b } = hslToRgb(
      parseInt(hslMatch[1]),
      parseInt(hslMatch[2]),
      parseInt(hslMatch[3])
    );
    return { type: 'hsl', r, g, b };
  }
  
  return null;
}

function getContrastColor(r, g, b) {
  // WCAG luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function getComplementary(h, s, l) {
  return { h: (h + 180) % 360, s, l };
}

async function run(input) {
  const { color } = input;
  
  if (!color) {
    return {
      error: 'Missing color parameter',
      usage: 'Provide a color in hex (#ff5733), RGB (rgb(255, 87, 51)), or HSL (hsl(9, 100%, 60%)) format'
    };
  }
  
  const parsed = parseColor(color);
  
  if (!parsed) {
    return {
      error: 'Could not parse color',
      input: color,
      supported: ['#fff', '#ffffff', 'rgb(255, 255, 255)', 'hsl(0, 0%, 100%)']
    };
  }
  
  const { r, g, b } = parsed;
  const hsl = rgbToHsl(r, g, b);
  const hex = rgbToHex(r, g, b);
  const comp = getComplementary(hsl.h, hsl.s, hsl.l);
  const compRgb = hslToRgb(comp.h, comp.s, comp.l);
  
  return {
    input: color,
    detected: parsed.type,
    conversions: {
      hex: hex,
      hexShort: hex.replace(/^#(.)\1(.)\2(.)\3$/, '#$1$2$3'),
      rgb: `rgb(${r}, ${g}, ${b})`,
      rgba: `rgba(${r}, ${g}, ${b}, 1)`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 1)`,
      css: hex
    },
    values: {
      red: r,
      green: g,
      blue: b,
      hue: hsl.h,
      saturation: hsl.s,
      lightness: hsl.l
    },
    utilities: {
      contrastText: getContrastColor(r, g, b),
      complementary: rgbToHex(compRgb.r, compRgb.g, compRgb.b),
      isDark: hsl.l < 50,
      isLight: hsl.l >= 50
    }
  };
}

module.exports = { run };
