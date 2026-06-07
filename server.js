import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;
const RATE_LIMIT_WINDOW_MS = 15_000;
const RATE_LIMIT_MAX = 20;
const CACHE_TTL_MS = 30_000;
const requestLog = new Map();
const cache = new Map();

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function json(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers,
  });
}

function text(res, status, body, headers = {}) {
  send(res, status, body, {
    'Content-Type': 'text/plain; charset=utf-8',
    ...headers,
  });
}

function rateLimited(ip) {
  const now = Date.now();
  const logs = requestLog.get(ip) || [];
  const fresh = logs.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  fresh.push(now);
  requestLog.set(ip, fresh);
  return fresh.length > RATE_LIMIT_MAX;
}

function sanitizeQuery(q = '') {
  return String(q).trim().slice(0, 80);
}

function cleanText(input) {
  return String(input || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseState(html) {
  const match = html.match(/window\.__INITIAL_STATE__=(\{[\s\S]*?\})\s*<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function normalizeItem(item) {
  const title = cleanText(item.bookName || item.title || item.name || '');
  const author = cleanText(item.authorName || item.author || item.nickName || '');
  const url = item.bookUrl || item.url || item.link || item.jumpUrl || item.pageUrl || '';
  const cover = item.coverUrl || item.cover || item.imgUrl || '';
  const intro = cleanText(item.bookDesc || item.intro || item.description || '');
  return { title, author, url, cover, intro, source: 'fanqie' };
}

function extractFromState(state, query) {
  const out = [];
  const seen = new Set();
  const lists = [
    state?.search?.searchBookList,
    state?.search?.authorData,
    state?.search?.bookList,
    state?.search?.list,
  ].filter(Array.isArray);

  for (const list of lists) {
    for (const item of list) {
      const book = normalizeItem(item);
      const key = `${book.title}|${book.author}|${book.url}`;
      if (!book.title || seen.has(key)) continue;
      if (query && !`${book.title} ${book.author} ${book.intro}`.toLowerCase().includes(query.toLowerCase())) continue;
      seen.add(key);
      out.push(book);
      if (out.length >= 20) return out;
    }
  }

  return out;
}

function extractFallback(html, query) {
  const results = [];
  const seen = new Set();
  const cardRegex = /<a[^>]+href="(\/page\/\d+)"[\s\S]*?<\/a>/g;
  let match;
  while ((match = cardRegex.exec(html)) !== null) {
    const block = match[0];
    const href = `https://fanqienovel.com${match[1]}`;
    if (seen.has(href)) continue;
    const title = cleanText((block.match(/title="([^"]+)"/) || block.match(/>([^<]{2,80})<\/a>/) || [,''])[1]);
    const author = cleanText((block.match(/作者[：:]?\s*([^<\n]{1,60})/) || [,''])[1]);
    const intro = cleanText((block.match(/<p[^>]*>([^<]{10,200})<\/p>/) || [,''])[1]);
    if (!title) continue;
    if (query && !`${title} ${author} ${intro}`.toLowerCase().includes(query.toLowerCase())) continue;
    seen.add(href);
    results.push({ title, author, url: href, cover: '', intro, source: 'fanqie' });
    if (results.length >= 20) break;
  }
  return results;
}

async function searchFanqie(query) {
  const q = sanitizeQuery(query);
  const key = q || '__all__';
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const url = q ? `https://fanqienovel.com/search/${encodeURIComponent(q)}` : 'https://fanqienovel.com/search/%E5%85%A8%E7%BD%91%E6%90%9C%E7%B4%A2';
  const resp = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'accept-language': 'zh-CN,zh;q=0.9',
      'referer': 'https://fanqienovel.com/',
    },
  });
  const html = await resp.text();
  const state = parseState(html);
  const data = (state ? extractFromState(state, q) : [])
    .concat(extractFallback(html, q));
  const dedup = [];
  const seen = new Set();
  for (const item of data) {
    const key = `${item.title}|${item.author}|${item.url}`;
    if (!item.title || seen.has(key)) continue;
    seen.add(key);
    dedup.push(item);
    if (dedup.length >= 20) break;
  }
  const payload = { query: q, count: dedup.length, results: dedup, source: 'fanqie' };
  cache.set(key, { ts: Date.now(), data: payload });
  return payload;
}

function serveStatic(res, filePath) {
  readFile(filePath)
    .then((buf) => {
      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, buf, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    })
    .catch(() => text(res, 404, 'Not Found'));
}

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const ip = req.socket.remoteAddress || 'unknown';

  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (rateLimited(ip)) return json(res, 429, { error: 'Too many requests' });

  if (reqUrl.pathname === '/api/fanqie/search' && req.method === 'GET') {
    try {
      const query = reqUrl.searchParams.get('q') || '';
      const data = await searchFanqie(query);
      return json(res, 200, data);
    } catch (error) {
      return json(res, 500, { error: 'search_failed', message: error.message });
    }
  }

  if (reqUrl.pathname === '/health') return text(res, 200, 'ok');

  const safePath = path.normalize(decodeURIComponent(reqUrl.pathname)).replace(/^([.]{2}[\/])+/, '');
  let filePath = path.join(ROOT, safePath);
  try {
    const stat = await import('node:fs/promises').then((m) => m.stat(filePath));
    if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    return serveStatic(res, filePath);
  } catch {
    return serveStatic(res, path.join(ROOT, 'index.html'));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Fanqie site running at http://${HOST}:${PORT}`);
});
