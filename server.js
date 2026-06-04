const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const RESULTS_FILE = path.join(DATA_DIR, 'results.json');
const KEYS_FILE = path.join(DATA_DIR, 'keys.json');
const PUBLIC_DIR = __dirname;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(RESULTS_FILE)) fs.writeFileSync(RESULTS_FILE, '[]', 'utf-8');
if (!fs.existsSync(KEYS_FILE)) fs.writeFileSync(KEYS_FILE, '{}', 'utf-8');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function readResults() {
  const raw = fs.readFileSync(RESULTS_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeResults(results) {
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf-8');
}

function sendJSON(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/api/results' && method === 'GET') {
    const results = readResults();
    return sendJSON(res, 200, results);
  }

  if (pathname === '/api/results' && method === 'POST') {
    try {
      const body = await getBody(req);
      const results = readResults();
      results.push(body);
      writeResults(results);
      return sendJSON(res, 201, { ok: true, index: results.length - 1 });
    } catch (e) {
      return sendJSON(res, 400, { error: e.message });
    }
  }

  if (pathname === '/api/results' && method === 'DELETE') {
    writeResults([]);
    return sendJSON(res, 200, { ok: true });
  }

  const delMatch = pathname.match(/^\/api\/results\/(\d+)$/);
  if (delMatch && method === 'DELETE') {
    const idx = parseInt(delMatch[1]);
    const results = readResults();
    if (idx < 0 || idx >= results.length) {
      return sendJSON(res, 404, { error: 'Index out of range' });
    }
    results.splice(idx, 1);
    writeResults(results);
    return sendJSON(res, 200, { ok: true });
  }

  if (pathname === '/api/keys' && method === 'GET') {
    try {
      const raw = fs.readFileSync(KEYS_FILE, 'utf-8');
      const keys = JSON.parse(raw);
      const masked = {};
      for (const [provider, key] of Object.entries(keys)) {
        masked[provider] = key.length > 8 ? key.slice(0, 4) + '*'.repeat(key.length - 8) + key.slice(-4) : key;
      }
      return sendJSON(res, 200, { keys, masked });
    } catch (e) {
      return sendJSON(res, 500, { error: e.message });
    }
  }

  if (pathname === '/api/keys' && method === 'POST') {
    try {
      const body = await getBody(req);
      const existing = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
      const updated = { ...existing, ...body };
      fs.writeFileSync(KEYS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
      return sendJSON(res, 200, { ok: true });
    } catch (e) {
      return sendJSON(res, 400, { error: e.message });
    }
  }

  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  serveFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
