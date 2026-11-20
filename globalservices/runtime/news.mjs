const sources = [
  {
    name: 'The Robot Report',
    host: 'therobotreport.com',
    url: 'https://www.therobotreport.com/feed/',
  },
  {
    name: 'Robotics & Automation News',
    host: 'roboticsandautomationnews.com',
    url: 'https://roboticsandautomationnews.com/feed/',
  },
];

const topics = [
  { label: 'IA y visión artificial', terms: /\b(ai|machine learning|computer vision|vision system|digital twin)\b/i },
  { label: 'Control y conectividad', terms: /\b(plc|hmi|scada|industrial network|cybersecurity|controllers?|machine control|industrial iot|edge computing)\b/i },
  { label: 'Robótica industrial', terms: /\b(cobot\w*|robotic\w*|robots?|automation|automated|autonomy|autonomous|industrial|manufacturing|warehouse|factory|factories)\b/i },
];
const irrelevant = /\b(delivery robots?|robot vacuums?|personal robots?|lawn mower|toy robots?|football|healthcare|surgery|surgical|dating|kitchen robots?|robotaxi\w*|autonomous (?:driving|vehicles?|buses?|freight)|companion\w*|skills assessments?|game agents?)\b/i;
const maxFeedSize = 1_250_000;
const maxArticleAge = 45 * 24 * 60 * 60 * 1000;

function extract(item, tag) {
  const match = item.match(new RegExp('<' + tag + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + tag + '>', 'i'));
  return match?.[1]?.trim().replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, '$1') ?? '';
}

function decode(text) {
  const names = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code) => {
    if (code[0] !== '#') return names[code.toLowerCase()] ?? entity;
    const hex = code[1]?.toLowerCase() === 'x';
    const value = Number.parseInt(code.slice(hex ? 2 : 1), hex ? 16 : 10);
    return value > 0 && value <= 0x10ffff && !(value >= 0xd800 && value <= 0xdfff)
      ? String.fromCodePoint(value)
      : '';
  });
}

export function parseFeed(xml, source, now = Date.now()) {
  if (!/<rss\b/i.test(xml)) return [];
  const entries = [];
  for (const match of xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)) {
    const item = match[1];
    if (/<category[^>]*>(?:<!\[CDATA\[)?(?:Sponsored Content|Autonomous Vehicles|Computer games)(?:\]\]>)?<\/category>/i.test(item)) continue;
    const title = decode(extract(item, 'title')).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const published = Date.parse(extract(item, 'pubDate'));
    const topic = topics.find(({ terms }) => terms.test(title));
    if (!title || title.length > 260 || !topic || irrelevant.test(title)) continue;
    if (!Number.isFinite(published) || now - published > maxArticleAge || published > now + 86400_000) continue;
    const url = URL.parse(decode(extract(item, 'link')));
    if (!url || url.protocol !== 'https:' || url.username || url.password || url.port) continue;
    if (url.hostname.replace(/^www\./, '') !== source.host) continue;
    url.search = '';
    url.hash = '';
    entries.push({
      title,
      url: url.href,
      source: source.name,
      date: new Date(published).toISOString(),
      topic: topic.label,
    });
  }
  return entries;
}

async function readFeed(source, request = fetch) {
  const response = await request(source.url, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(4500),
    redirect: 'error',
    cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': 900, '300-599': 0 } },
  });
  if (!response.ok || !response.body) throw new Error('RSS unavailable');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let xml = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxFeedSize) {
        await reader.cancel();
        throw new Error('RSS body exceeds size limit');
      }
      xml += decoder.decode(value, { stream: true });
    }
    const entries = parseFeed(xml + decoder.decode(), source);
    if (!entries.length) throw new Error('RSS has no matching recent articles');
    return entries;
  } finally {
    reader.releaseLock();
  }
}

export function selectArticles(entries) {
  const seen = new Set();
  const articles = [];
  for (const article of [...entries].sort((a, b) => b.date.localeCompare(a.date))) {
    const key = article.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    articles.push(article);
  }
  return articles.slice(0, 12);
}

export async function newsResponse(fallback, request = fetch) {
  const results = await Promise.allSettled(sources.map(source => readFeed(source, request)));
  const successful = results.filter(result => result.status === 'fulfilled');
  const available = successful.flatMap(result => result.value);
  const failedSources = new Set(sources.filter((_, index) => results[index].status === 'rejected').map(source => source.name));
  const backup = fallback.articles.filter(article =>
    failedSources.has(article.source) && Date.now() - Date.parse(article.date) <= maxArticleAge
  );
  const data = {
    checkedAt: successful.length ? new Date().toISOString() : fallback.checkedAt,
    status: successful.length === sources.length ? 'live' : successful.length ? 'partial' : 'fallback',
    articles: selectArticles([...available, ...backup]),
  };
  return Response.json(data, {
    headers: {
      'Cache-Control': data.status === 'live' ? 'private, max-age=600' : 'private, max-age=120',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export { sources };
