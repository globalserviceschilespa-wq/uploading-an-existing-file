const fallbackNews = JSON.parse(pages['/news-fallback.json'].data);
const staticHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; base-uri 'none'; object-src 'none'",
};

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const path = new URL(request.url).pathname;
    if (path === '/api/automation-news') {
      if (request.method === 'HEAD') {
        return new Response(null, { headers: { 'Content-Type': 'application/json' } });
      }
      return newsResponse(fallbackNews);
    }
    const name = path === '/' ? '/index.html' : path;
    const asset = Object.hasOwn(pages, name) ? pages[name] : null;
    if (!asset) return new Response('Página no encontrada', { status: 404, headers: staticHeaders });
    const data = request.method === 'HEAD' ? null : asset.plain
      ? asset.data
      : Uint8Array.from(atob(asset.data), character => character.charCodeAt(0));
    return new Response(data, {
      headers: {
        ...staticHeaders,
        'Content-Type': asset.type,
        'Cache-Control': path.startsWith('/assets/') ? 'private, max-age=86400' : 'private, max-age=300',
      },
    });
  },
};
