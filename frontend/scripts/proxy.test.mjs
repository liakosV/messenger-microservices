import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer as httpServer } from 'node:http';
import { once } from 'node:events';
import { createServer } from 'vite';
import WebSocket, { WebSocketServer } from 'ws';

test(
  'Vite forwards identity/chat REST and authenticated WebSocket frames without changing Origin',
  { timeout: 20000 },
  async () => {
    const requests = [];
    const backend = httpServer((req, res) => {
      requests.push({ path: req.url, auth: req.headers.authorization });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ path: req.url }));
    });
    backend.listen(0, '127.0.0.1');
    await once(backend, 'listening');
    const target = `http://127.0.0.1:${backend.address().port}`;
    let origin;
    const sockets = new WebSocketServer({ server: backend, path: '/ws/chat' });
    sockets.on('connection', (socket, req) => {
      origin = req.headers.origin;
      socket.on('message', (data) => {
        assert.equal(data.toString(), 'Bearer test-only-token');
        socket.send('{"type":"AUTHENTICATED"}');
      });
    });
    const vite = await createServer({
      logLevel: 'silent',
      server: {
        host: '127.0.0.1',
        port: 0,
        strictPort: false,
        proxy: {
          '/identity': {
            target,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/identity/, ''),
          },
          '/chat': { target, changeOrigin: true, rewrite: (path) => path.replace(/^\/chat/, '') },
          '/ws/chat': { target, ws: true, changeOrigin: true },
        },
      },
    });
    let client;
    try {
      await vite.listen();
      const port = vite.httpServer.address().port;
      for (const path of ['/identity/api/users/me', '/chat/api/conversations']) {
        const response = await fetch(`http://127.0.0.1:${port}${path}`, {
          headers: { Authorization: 'Bearer test-only-token' },
        });
        assert.equal(response.status, 200);
        assert.equal((await response.json()).path, path.replace(/^\/(identity|chat)/, ''));
      }
      assert.deepEqual(
        requests.map((req) => req.auth),
        ['Bearer test-only-token', 'Bearer test-only-token'],
      );
      client = new WebSocket(`ws://127.0.0.1:${port}/ws/chat`, { origin: 'http://localhost:5173' });
      await once(client, 'open');
      const notification = once(client, 'message');
      client.send('Bearer test-only-token');
      assert.equal(JSON.parse((await notification)[0].toString()).type, 'AUTHENTICATED');
      assert.equal(origin, 'http://localhost:5173');
    } finally {
      client?.terminate();
      sockets.clients.forEach((socket) => socket.terminate());
      await vite.close();
      await new Promise((resolve) => sockets.close(resolve));
      backend.closeAllConnections();
      await new Promise((resolve) => backend.close(resolve));
    }
  },
);
