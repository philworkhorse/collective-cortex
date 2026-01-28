/**
 * http-status - HTTP Status Code Reference
 * Quick lookup for status codes, categories, and troubleshooting info.
 */

const HTTP_STATUSES = {
  // 1xx - Informational
  100: { name: 'Continue', category: 'Informational', description: 'Server received request headers, client should proceed to send body.', commonCauses: ['Normal flow with Expect: 100-continue header'], retryable: false },
  101: { name: 'Switching Protocols', category: 'Informational', description: 'Server is switching to a different protocol as requested.', commonCauses: ['WebSocket upgrade', 'HTTP/2 upgrade'], retryable: false },
  102: { name: 'Processing', category: 'Informational', description: 'Server received and is processing the request (WebDAV).', commonCauses: ['Long-running WebDAV operations'], retryable: false },
  103: { name: 'Early Hints', category: 'Informational', description: 'Used to return some response headers before final response.', commonCauses: ['Preloading resources', 'Link headers'], retryable: false },

  // 2xx - Success
  200: { name: 'OK', category: 'Success', description: 'Request succeeded. Standard response for successful HTTP requests.', commonCauses: ['Successful GET, POST, PUT, PATCH requests'], retryable: false },
  201: { name: 'Created', category: 'Success', description: 'Request succeeded and a new resource was created.', commonCauses: ['Successful POST creating new resource', 'Successful PUT creating resource'], retryable: false },
  202: { name: 'Accepted', category: 'Success', description: 'Request accepted for processing, but not yet completed.', commonCauses: ['Async processing', 'Queued jobs', 'Batch operations'], retryable: false },
  203: { name: 'Non-Authoritative Information', category: 'Success', description: 'Request succeeded but returned info may be from another source.', commonCauses: ['Proxy modified response', 'CDN transformation'], retryable: false },
  204: { name: 'No Content', category: 'Success', description: 'Request succeeded but there is no content to return.', commonCauses: ['Successful DELETE', 'Successful PUT with no response body'], retryable: false },
  205: { name: 'Reset Content', category: 'Success', description: 'Request succeeded, client should reset document view.', commonCauses: ['Form submission success', 'Clear input fields'], retryable: false },
  206: { name: 'Partial Content', category: 'Success', description: 'Server returning partial resource due to Range header.', commonCauses: ['Video streaming', 'Resumable downloads', 'Large file downloads'], retryable: false },
  207: { name: 'Multi-Status', category: 'Success', description: 'Response contains multiple status codes for multiple operations (WebDAV).', commonCauses: ['WebDAV batch operations', 'Multiple resource modifications'], retryable: false },
  208: { name: 'Already Reported', category: 'Success', description: 'Members already enumerated in previous response (WebDAV).', commonCauses: ['WebDAV binding operations'], retryable: false },
  226: { name: 'IM Used', category: 'Success', description: 'Server fulfilled GET with instance-manipulations applied.', commonCauses: ['Delta encoding', 'Instance manipulation'], retryable: false },

  // 3xx - Redirection
  300: { name: 'Multiple Choices', category: 'Redirection', description: 'Multiple options for the resource, client should choose.', commonCauses: ['Multiple formats available', 'Content negotiation'], retryable: false },
  301: { name: 'Moved Permanently', category: 'Redirection', description: 'Resource permanently moved to new URL.', commonCauses: ['URL restructuring', 'Domain change', 'HTTPS migration'], retryable: false },
  302: { name: 'Found', category: 'Redirection', description: 'Resource temporarily at different URL. Keep using original URL.', commonCauses: ['Temporary redirect', 'Login redirect', 'A/B testing'], retryable: false },
  303: { name: 'See Other', category: 'Redirection', description: 'Response to request found at another URL using GET.', commonCauses: ['POST-redirect-GET pattern', 'Form submission redirect'], retryable: false },
  304: { name: 'Not Modified', category: 'Redirection', description: 'Resource unchanged since last request. Use cached version.', commonCauses: ['Conditional GET with If-Modified-Since', 'ETag match'], retryable: false },
  305: { name: 'Use Proxy', category: 'Redirection', description: 'Request must be accessed through specified proxy (deprecated).', commonCauses: ['Legacy proxy requirement'], retryable: false },
  307: { name: 'Temporary Redirect', category: 'Redirection', description: 'Resource temporarily at different URL. Repeat request at new URL.', commonCauses: ['Temporary redirect preserving method', 'Load balancing'], retryable: false },
  308: { name: 'Permanent Redirect', category: 'Redirection', description: 'Resource permanently moved. Repeat request at new URL.', commonCauses: ['Permanent redirect preserving method', 'API versioning'], retryable: false },

  // 4xx - Client Errors
  400: { name: 'Bad Request', category: 'Client Error', description: 'Server cannot process request due to client error.', commonCauses: ['Malformed JSON', 'Missing required fields', 'Invalid syntax', 'Invalid query parameters'], retryable: false },
  401: { name: 'Unauthorized', category: 'Client Error', description: 'Authentication required or credentials invalid.', commonCauses: ['Missing auth header', 'Expired token', 'Invalid API key', 'Wrong credentials'], retryable: true },
  402: { name: 'Payment Required', category: 'Client Error', description: 'Payment required for this resource (reserved for future use).', commonCauses: ['Subscription required', 'Credits exhausted', 'Payment failed'], retryable: false },
  403: { name: 'Forbidden', category: 'Client Error', description: 'Server understood request but refuses to authorize it.', commonCauses: ['Insufficient permissions', 'IP blocked', 'Resource restricted', 'CORS blocked'], retryable: false },
  404: { name: 'Not Found', category: 'Client Error', description: 'Requested resource could not be found on the server.', commonCauses: ['Incorrect URL path', 'Resource deleted', 'Typo in URL', 'Resource never existed'], retryable: false },
  405: { name: 'Method Not Allowed', category: 'Client Error', description: 'HTTP method not allowed for this resource.', commonCauses: ['POST to read-only endpoint', 'DELETE not supported', 'Wrong HTTP verb'], retryable: false },
  406: { name: 'Not Acceptable', category: 'Client Error', description: 'Resource cannot generate content acceptable per Accept headers.', commonCauses: ['Unsupported Accept header', 'Content negotiation failed'], retryable: false },
  407: { name: 'Proxy Authentication Required', category: 'Client Error', description: 'Client must authenticate with the proxy.', commonCauses: ['Proxy requires credentials', 'Corporate proxy auth'], retryable: true },
  408: { name: 'Request Timeout', category: 'Client Error', description: 'Server timed out waiting for the request.', commonCauses: ['Slow client connection', 'Network issues', 'Client didn\'t send request in time'], retryable: true },
  409: { name: 'Conflict', category: 'Client Error', description: 'Request conflicts with current state of the resource.', commonCauses: ['Concurrent modification', 'Version conflict', 'Duplicate resource', 'Edit collision'], retryable: true },
  410: { name: 'Gone', category: 'Client Error', description: 'Resource permanently deleted and will not return.', commonCauses: ['Intentionally removed resource', 'Discontinued API endpoint'], retryable: false },
  411: { name: 'Length Required', category: 'Client Error', description: 'Server requires Content-Length header.', commonCauses: ['Missing Content-Length header', 'Chunked encoding not accepted'], retryable: false },
  412: { name: 'Precondition Failed', category: 'Client Error', description: 'Server does not meet request preconditions.', commonCauses: ['If-Match ETag mismatch', 'Conditional request failed'], retryable: true },
  413: { name: 'Payload Too Large', category: 'Client Error', description: 'Request entity larger than server limits.', commonCauses: ['File upload too large', 'Request body exceeds limit', 'JSON payload too big'], retryable: false },
  414: { name: 'URI Too Long', category: 'Client Error', description: 'Request URI longer than server accepts.', commonCauses: ['Too many query parameters', 'Encoded data in URL', 'URL exceeds limit'], retryable: false },
  415: { name: 'Unsupported Media Type', category: 'Client Error', description: 'Server does not support the request media type.', commonCauses: ['Wrong Content-Type header', 'Unsupported file format', 'Missing Content-Type'], retryable: false },
  416: { name: 'Range Not Satisfiable', category: 'Client Error', description: 'Range specified in header cannot be satisfied.', commonCauses: ['Requested range beyond file size', 'Invalid Range header'], retryable: false },
  417: { name: 'Expectation Failed', category: 'Client Error', description: 'Server cannot meet Expect header requirements.', commonCauses: ['Expect: 100-continue not supported'], retryable: false },
  418: { name: "I'm a Teapot", category: 'Client Error', description: 'Server refuses to brew coffee because it is a teapot (RFC 2324).', commonCauses: ['Easter egg', 'Joke response', 'Actually a teapot'], retryable: false },
  421: { name: 'Misdirected Request', category: 'Client Error', description: 'Request directed to server unable to produce a response.', commonCauses: ['HTTP/2 connection reuse issue', 'Wrong server in pool'], retryable: true },
  422: { name: 'Unprocessable Entity', category: 'Client Error', description: 'Request well-formed but semantically erroneous.', commonCauses: ['Validation error', 'Business logic violation', 'Invalid field values'], retryable: false },
  423: { name: 'Locked', category: 'Client Error', description: 'Resource is locked (WebDAV).', commonCauses: ['Resource being edited', 'Lock held by another user'], retryable: true },
  424: { name: 'Failed Dependency', category: 'Client Error', description: 'Request failed due to failure of previous request (WebDAV).', commonCauses: ['Dependent operation failed', 'Cascading failure'], retryable: true },
  425: { name: 'Too Early', category: 'Client Error', description: 'Server unwilling to risk processing potentially replayed request.', commonCauses: ['TLS early data replay risk', '0-RTT request rejected'], retryable: true },
  426: { name: 'Upgrade Required', category: 'Client Error', description: 'Client should switch to a different protocol.', commonCauses: ['TLS required', 'Protocol upgrade needed'], retryable: false },
  428: { name: 'Precondition Required', category: 'Client Error', description: 'Server requires conditional request headers.', commonCauses: ['Missing If-Match header', 'Optimistic locking required'], retryable: false },
  429: { name: 'Too Many Requests', category: 'Client Error', description: 'User sent too many requests in given time (rate limiting).', commonCauses: ['Rate limit exceeded', 'Too many API calls', 'Throttling'], retryable: true },
  431: { name: 'Request Header Fields Too Large', category: 'Client Error', description: 'Server refuses due to oversized headers.', commonCauses: ['Too many cookies', 'Header size exceeds limit', 'Large auth token'], retryable: false },
  451: { name: 'Unavailable For Legal Reasons', category: 'Client Error', description: 'Resource unavailable due to legal reasons.', commonCauses: ['DMCA takedown', 'Government censorship', 'Court order'], retryable: false },

  // 5xx - Server Errors
  500: { name: 'Internal Server Error', category: 'Server Error', description: 'Server encountered unexpected condition preventing fulfillment.', commonCauses: ['Unhandled exception', 'Bug in server code', 'Configuration error', 'Database error'], retryable: true },
  501: { name: 'Not Implemented', category: 'Server Error', description: 'Server does not support functionality required to fulfill request.', commonCauses: ['HTTP method not implemented', 'Feature not available', 'Stub endpoint'], retryable: false },
  502: { name: 'Bad Gateway', category: 'Server Error', description: 'Server acting as gateway received invalid response from upstream.', commonCauses: ['Upstream server down', 'Proxy error', 'Invalid response from backend'], retryable: true },
  503: { name: 'Service Unavailable', category: 'Server Error', description: 'Server temporarily unable to handle request.', commonCauses: ['Server overloaded', 'Maintenance mode', 'Temporary outage', 'Deployment in progress'], retryable: true },
  504: { name: 'Gateway Timeout', category: 'Server Error', description: 'Server acting as gateway did not receive timely response.', commonCauses: ['Upstream server timeout', 'Slow backend response', 'Network issues'], retryable: true },
  505: { name: 'HTTP Version Not Supported', category: 'Server Error', description: 'Server does not support HTTP version used in request.', commonCauses: ['HTTP/2 not supported', 'Old HTTP version'], retryable: false },
  506: { name: 'Variant Also Negotiates', category: 'Server Error', description: 'Content negotiation resulted in circular reference.', commonCauses: ['Misconfigured content negotiation'], retryable: false },
  507: { name: 'Insufficient Storage', category: 'Server Error', description: 'Server unable to store representation needed to complete request.', commonCauses: ['Disk full', 'Quota exceeded', 'Storage limit reached'], retryable: true },
  508: { name: 'Loop Detected', category: 'Server Error', description: 'Server detected infinite loop while processing request (WebDAV).', commonCauses: ['Circular reference in resource binding'], retryable: false },
  510: { name: 'Not Extended', category: 'Server Error', description: 'Further extensions to request required for server to fulfill it.', commonCauses: ['Missing required extension'], retryable: false },
  511: { name: 'Network Authentication Required', category: 'Server Error', description: 'Client needs to authenticate to gain network access.', commonCauses: ['Captive portal', 'WiFi login required', 'Network paywall'], retryable: true },
};

const CATEGORIES = {
  '1xx': { name: 'Informational', description: 'Request received, continuing process' },
  '2xx': { name: 'Success', description: 'Request successfully received, understood, and accepted' },
  '3xx': { name: 'Redirection', description: 'Further action needed to complete request' },
  '4xx': { name: 'Client Error', description: 'Request contains bad syntax or cannot be fulfilled' },
  '5xx': { name: 'Server Error', description: 'Server failed to fulfill valid request' },
};

function handler(params) {
  const { code, category, search } = params;

  // Lookup specific code
  if (code !== undefined) {
    const statusCode = parseInt(code, 10);
    const status = HTTP_STATUSES[statusCode];
    
    if (!status) {
      // Check if it's in a valid range
      const categoryKey = `${Math.floor(statusCode / 100)}xx`;
      if (CATEGORIES[categoryKey]) {
        return {
          code: statusCode,
          name: 'Unknown',
          category: CATEGORIES[categoryKey].name,
          description: `Non-standard or unknown status code in the ${categoryKey} range.`,
          commonCauses: ['Custom application-specific status', 'Non-standard implementation'],
          retryable: statusCode >= 500,
        };
      }
      return { error: `Unknown status code: ${code}. Valid range is 100-599.` };
    }

    return { code: statusCode, ...status };
  }

  // Filter by category
  if (category) {
    const normalizedCategory = category.toLowerCase();
    if (!CATEGORIES[normalizedCategory]) {
      return { error: `Invalid category: ${category}. Valid categories: 1xx, 2xx, 3xx, 4xx, 5xx` };
    }

    const categoryInfo = CATEGORIES[normalizedCategory];
    const prefix = parseInt(normalizedCategory[0], 10);
    const codes = Object.entries(HTTP_STATUSES)
      .filter(([c]) => Math.floor(parseInt(c, 10) / 100) === prefix)
      .map(([c, info]) => ({ code: parseInt(c, 10), name: info.name, description: info.description }));

    return {
      category: normalizedCategory,
      name: categoryInfo.name,
      description: categoryInfo.description,
      codes,
    };
  }

  // Search descriptions
  if (search) {
    const query = search.toLowerCase();
    const results = Object.entries(HTTP_STATUSES)
      .filter(([_, info]) => 
        info.name.toLowerCase().includes(query) ||
        info.description.toLowerCase().includes(query) ||
        info.commonCauses.some(cause => cause.toLowerCase().includes(query))
      )
      .map(([c, info]) => ({ code: parseInt(c, 10), name: info.name, description: info.description }));

    if (results.length === 0) {
      return { results: [], message: `No status codes found matching "${search}"` };
    }

    return { query: search, results };
  }

  // No params - return summary
  return {
    usage: {
      byCode: 'GET /api/skills/http-status?code=404',
      byCategory: 'GET /api/skills/http-status?category=4xx',
      bySearch: 'GET /api/skills/http-status?search=auth',
    },
    categories: Object.entries(CATEGORIES).map(([key, info]) => ({
      range: key,
      name: info.name,
      description: info.description,
    })),
    totalCodes: Object.keys(HTTP_STATUSES).length,
  };
}

module.exports = { handler, HTTP_STATUSES, CATEGORIES };
