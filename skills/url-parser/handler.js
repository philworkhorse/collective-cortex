/**
 * URL Parser Skill - Parse and build URLs with ease
 * Author: SPARK
 */

function parseUrl(url) {
  try {
    const parsed = new URL(url);
    const params = {};
    parsed.searchParams.forEach((value, key) => {
      // Handle multiple values for same key
      if (params[key]) {
        if (Array.isArray(params[key])) {
          params[key].push(value);
        } else {
          params[key] = [params[key], value];
        }
      } else {
        params[key] = value;
      }
    });

    return {
      success: true,
      protocol: parsed.protocol,
      host: parsed.host,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: parsed.pathname,
      search: parsed.search,
      hash: parsed.hash,
      params,
      origin: parsed.origin,
      username: parsed.username || undefined,
      password: parsed.password || undefined
    };
  } catch (err) {
    return {
      success: false,
      error: `Invalid URL: ${err.message}`
    };
  }
}

function buildUrl(options) {
  try {
    let url;
    
    if (options.base) {
      url = new URL(options.base);
    } else if (options.protocol && options.host) {
      url = new URL(`${options.protocol}//${options.host}`);
    } else {
      return {
        success: false,
        error: 'Must provide either "base" URL or both "protocol" and "host"'
      };
    }

    if (options.pathname) {
      url.pathname = options.pathname;
    }

    if (options.params && typeof options.params === 'object') {
      for (const [key, value] of Object.entries(options.params)) {
        if (Array.isArray(value)) {
          value.forEach(v => url.searchParams.append(key, v));
        } else {
          url.searchParams.set(key, value);
        }
      }
    }

    if (options.hash) {
      url.hash = options.hash.startsWith('#') ? options.hash : `#${options.hash}`;
    }

    return {
      success: true,
      url: url.toString()
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to build URL: ${err.message}`
    };
  }
}

function extractParams(url) {
  const parsed = parseUrl(url);
  if (!parsed.success) return parsed;
  
  return {
    success: true,
    params: parsed.params
  };
}

function addParams(url, params) {
  try {
    const parsed = new URL(url);
    
    if (params && typeof params === 'object') {
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          // Clear existing and add all
          parsed.searchParams.delete(key);
          value.forEach(v => parsed.searchParams.append(key, v));
        } else if (value === null || value === undefined) {
          // Remove param if value is null/undefined
          parsed.searchParams.delete(key);
        } else {
          parsed.searchParams.set(key, value);
        }
      }
    }

    return {
      success: true,
      url: parsed.toString()
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to add params: ${err.message}`
    };
  }
}

// Export for Collective Cortex
module.exports = {
  parse: (input) => parseUrl(input.url),
  build: (input) => buildUrl(input),
  'extract-params': (input) => extractParams(input.url),
  'add-params': (input) => addParams(input.url, input.params)
};

// Test if run directly
if (require.main === module) {
  console.log('Testing URL Parser...\n');
  
  // Test parse
  console.log('Parse https://api.example.com:8080/v1/users?page=1&limit=10#section:');
  console.log(JSON.stringify(parseUrl('https://api.example.com:8080/v1/users?page=1&limit=10#section'), null, 2));
  
  // Test build
  console.log('\nBuild URL with base and params:');
  console.log(JSON.stringify(buildUrl({
    base: 'https://api.example.com/search',
    params: { q: 'clawdbot', page: '1' }
  }), null, 2));
  
  // Test add-params
  console.log('\nAdd params to existing URL:');
  console.log(JSON.stringify(addParams('https://example.com/api?existing=true', { new: 'param', page: '5' }), null, 2));
}
