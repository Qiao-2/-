import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;
const DATA_DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp/fk-site-data' : path.join(ROOT, 'data'));
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSION_FILE = path.join(DATA_DIR, 'sessions.json');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

let users = [];
let sessions = [];
const CLIENT_CSS = await readFile(path.join(ROOT, 'styles.css'), 'utf8').catch(() => '');
const CLIENT_JS = await readFile(path.join(ROOT, 'script.js'), 'utf8').catch(() => '');

async function ensureStorage() {
  await mkdir(DATA_DIR, { recursive: true });
  try { users = JSON.parse(await readFile(USERS_FILE, 'utf8')); } catch { users = []; }
  try { sessions = JSON.parse(await readFile(SESSION_FILE, 'utf8')); } catch { sessions = []; }
  if (!users.some((u) => u.role === 'admin')) {
    users.push({
      id: crypto.randomUUID(),
      username: ADMIN_USERNAME,
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: 'admin',
      status: 'approved',
      createdAt: new Date().toISOString(),
    });
    await saveUsers();
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

async function saveUsers() {
  await writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

async function saveSessions() {
  await writeFile(SESSION_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function json(res, status, data) {
  send(res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
}

function text(res, status, body, headers = {}) {
  send(res, status, body, { 'Content-Type': 'text/plain; charset=utf-8', ...headers });
}

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(cookieHeader.split(';').map((c) => c.trim()).filter(Boolean).map((pair) => {
    const idx = pair.indexOf('=');
    return [decodeURIComponent(pair.slice(0, idx)), decodeURIComponent(pair.slice(idx + 1))];
  }).filter(([k]) => k));
}

function getCurrentSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sid = cookies.sid;
  if (!sid) return null;
  return sessions.find((s) => s.sid === sid && s.expiresAt > Date.now()) || null;
}

function getUserFromReq(req) {
  const session = getCurrentSession(req);
  if (!session) return null;
  return users.find((u) => u.id === session.userId) || null;
}

function setSession(res, userId) {
  const sid = crypto.randomUUID();
  sessions.push({ sid, userId, expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 7 });
  return saveSessions().then(() => {
    res.setHeader('Set-Cookie', `sid=${encodeURIComponent(sid)}; Path=/; HttpOnly; SameSite=Lax`);
  });
}

async function clearSession(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sid = cookies.sid;
  if (sid) {
    sessions = sessions.filter((s) => s.sid !== sid);
    await saveSessions();
  }
  res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

function renderPage(user) {
  const authJson = JSON.stringify({
    loggedIn: Boolean(user),
    username: user?.username || '',
    role: user?.role || '',
    status: user?.status || '',
  });
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>会员专属个人站</title>
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <div>
        <h1>会员专属个人站</h1>
        <p>注册后需要管理员审核，审核通过才能登录进入内部页面。</p>
      </div>
      <div class="badge">安全访问</div>
    </section>

    <section class="card" id="authCard"></section>
    <section class="card hidden" id="dashboardCard"></section>
    <section class="card hidden" id="adminCard"></section>
  </main>
  <script>window.__AUTH__=${authJson};</script>
  <script src="/script.js"></script>
</body>
</html>`;
}

async function handleApi(req, res, pathname) {
  const body = req.method === 'POST' ? await readBody(req) : {};

  if (pathname === '/api/me' && req.method === 'GET') {
    const user = getUserFromReq(req);
    return json(res, 200, { user: user ? { username: user.username, role: user.role, status: user.status } : null });
  }

  if (pathname === '/api/register' && req.method === 'POST') {
    const username = String(body.username || '').trim();
    const password = String(body.password || '').trim();
    if (!username || !password) return json(res, 400, { error: '用户名和密码不能为空' });
    if (users.some((u) => u.username === username)) return json(res, 400, { error: '用户名已存在' });
    users.push({
      id: crypto.randomUUID(),
      username,
      passwordHash: hashPassword(password),
      role: 'user',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await saveUsers();
    return json(res, 200, { ok: true, message: '注册成功，请等待管理员审核' });
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    const username = String(body.username || '').trim();
    const password = String(body.password || '').trim();
    const user = users.find((u) => u.username === username);
    if (!user) return json(res, 400, { error: '账号不存在' });
    if (user.passwordHash !== hashPassword(password)) return json(res, 400, { error: '密码错误' });
    if (user.status !== 'approved' && user.role !== 'admin') return json(res, 403, { error: '账号未通过审核' });
    await setSession(res, user.id);
    return json(res, 200, { ok: true, user: { username: user.username, role: user.role, status: user.status } });
  }

  if (pathname === '/api/logout' && req.method === 'POST') {
    await clearSession(req, res);
    return json(res, 200, { ok: true });
  }

  const current = getUserFromReq(req);
  if (!current) return json(res, 401, { error: '未登录' });

  if (pathname === '/api/admin/users' && req.method === 'GET') {
    if (current.role !== 'admin') return json(res, 403, { error: '无权限' });
    const list = users.filter((u) => u.role !== 'admin').map((u) => ({ id: u.id, username: u.username, status: u.status, createdAt: u.createdAt }));
    return json(res, 200, { users: list });
  }

  if (pathname === '/api/admin/review' && req.method === 'POST') {
    if (current.role !== 'admin') return json(res, 403, { error: '无权限' });
    const { userId, status } = body;
    if (!['approved', 'rejected'].includes(status)) return json(res, 400, { error: '状态错误' });
    const target = users.find((u) => u.id === userId && u.role !== 'admin');
    if (!target) return json(res, 404, { error: '用户不存在' });
    target.status = status;
    await saveUsers();
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'Not Found' });
}

async function serveStatic(res, filePath) {
  try {
    const buf = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, buf, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
  } catch {
    text(res, 404, 'Not Found');
  }
}

await ensureStorage();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith('/api/')) return handleApi(req, res, pathname);
  if (pathname === '/' || pathname === '/index.html') return send(res, 200, renderPage(getUserFromReq(req)), { 'Content-Type': 'text/html; charset=utf-8' });
  if (pathname === '/health') return text(res, 200, 'ok');

  const safePath = path.normalize(pathname).replace(/^([.]{2}[\/])+/, '');
  const filePath = path.join(ROOT, safePath);
  return serveStatic(res, filePath);
});

server.listen(PORT, HOST, () => {
  console.log(`Site running at http://${HOST}:${PORT}`);
});
