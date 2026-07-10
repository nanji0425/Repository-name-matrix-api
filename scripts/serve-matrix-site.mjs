import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('nginx/site');
const port = Number(process.env.PORT || 4173);

const types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function resolveRequest(url) {
  const { pathname } = new URL(url, 'http://127.0.0.1');
  const localPath = pathname.startsWith('/matrix-assets/')
    ? pathname.slice('/matrix-assets'.length)
    : pathname;
  const pageMap = {
    '/': 'index.html',
    '/docs': 'docs.html',
    '/docs/': 'docs.html',
    '/pricing': 'pricing.html',
    '/pricing/': 'pricing.html',
    '/forgot-password': 'forgot-password.html',
    '/forgot-password/': 'forgot-password.html',
    '/wallet': 'wallet.html',
    '/wallet/': 'wallet.html',
    '/topup': 'wallet.html',
    '/topup/': 'wallet.html',
  };
  const filePath = path.join(root, pageMap[localPath] || localPath);
  if (!filePath.startsWith(root)) return null;
  return filePath;
}

createServer(async (request, response) => {
  const filePath = resolveRequest(request.url || '/');
  if (!filePath) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'content-type': types[path.extname(filePath)] || 'application/octet-stream',
    });
    response.end(body);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Matrix site preview: http://127.0.0.1:${port}`);
});
