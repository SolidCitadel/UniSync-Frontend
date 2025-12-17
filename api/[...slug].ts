import type { VercelRequest, VercelResponse } from '@vercel/node';

const BACKEND_URL = 'http://ec2-52-79-240-51.ap-northeast-2.compute.amazonaws.com:8080';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[Proxy] Function called!');
  console.log('[Proxy] Method:', req.method);
  console.log('[Proxy] URL:', req.url);
  console.log('[Proxy] Query:', req.query);

  try {
    // Build target URL with path and query
    const { slug, ...otherQuery } = req.query;
    console.log('[Proxy] Slug:', slug);

    const pathSegment = Array.isArray(slug) ? `/${slug.join('/')}` : (slug ? `/${slug}` : '');

    // Build query string from remaining query params
    const queryString = new URLSearchParams(otherQuery as Record<string, string>).toString();

    const targetUrl = `${BACKEND_URL}/api${pathSegment}${queryString ? `?${queryString}` : ''}`;

    console.log(`[Proxy] Target: ${req.method} ${targetUrl}`);

    // Forward headers (exclude hop-by-hop headers)
    const headers: Record<string, string> = {};
    const excludeHeaders = [
      'host',
      'connection',
      'content-length',
      'transfer-encoding',
      'keep-alive',
      'upgrade',
      'proxy-authenticate',
      'proxy-authorization',
      'te',
      'trailer',
    ];

    Object.keys(req.headers).forEach((key) => {
      const lowerKey = key.toLowerCase();
      if (!excludeHeaders.includes(lowerKey)) {
        const value = req.headers[key];
        if (value) {
          headers[key] = Array.isArray(value) ? value[0] : value;
        }
      }
    });

    // Prepare request body
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (typeof req.body === 'string') {
        body = req.body;
      } else if (req.body) {
        body = JSON.stringify(req.body);
        headers['content-type'] = 'application/json';
      }
    }

    // Make request to backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });

    // Get response body
    const data = await response.text();

    // Forward response headers
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!excludeHeaders.includes(lowerKey)) {
        res.setHeader(key, value);
      }
    });

    // Return response
    res.status(response.status).send(data);
  } catch (error) {
    console.error('[Proxy Error]', error);
    res.status(500).json({ error: 'Proxy error', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}
