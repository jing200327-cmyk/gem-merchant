import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number.parseInt(process.env.PORT ?? '4173', 10);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function send(response, status, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(status, {
    'Content-Type': contentType,
    'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'self'",
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(body);
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', 'http://localhost');
    const requestPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.resolve(root, `.${requestPath}`);
    if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
      send(response, 403, 'Forbidden');
      return;
    }
    const info = await stat(filePath);
    if (!info.isFile()) {
      send(response, 404, 'Not found');
      return;
    }
    const content = await readFile(filePath);
    send(response, 200, content, mimeTypes[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream');
  } catch (error) {
    send(response, error?.code === 'ENOENT' ? 404 : 500, error?.code === 'ENOENT' ? 'Not found' : 'Server error');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`宝石商人已启动：http://127.0.0.1:${port}`);
});
