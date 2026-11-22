import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../src/app.js';

// These tests exercise the guard layer itself: every protected route must refuse an
// anonymous caller before it ever reaches MongoDB. That keeps them runnable in CI with
// no database.
let server;
let baseUrl;

const call = (path, options = {}) => fetch(`${baseUrl}${path}`, {
  redirect: 'manual',
  ...options,
  headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
});

before(async () => {
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('health check answers', async () => {
  const res = await call('/api/health');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
});

test('unknown API route is a JSON 404', async () => {
  const res = await call('/api/definitely-not-a-route');
  assert.equal(res.status, 404);
  assert.equal((await res.json()).success, false);
});

test('public floor map never leaks QR tokens or guest contact details', async () => {
  const res = await call('/api/tables');
  assert.equal(res.status, 200);
  const raw = await res.text();
  assert.ok(!raw.includes('demo-token'), 'public tables must not expose QR tokens');
  assert.ok(!raw.includes('currentQrToken'), 'public tables must not expose currentQrToken');
  assert.ok(!raw.includes('customerPhone'), 'public tables must not expose phone numbers');
});

test('virtual table tokens reject invalid ids and fail closed without MongoDB', async () => {
  const invalid = await call('/api/tables/not-a-table/virtual-token', { method: 'POST' });
  assert.equal(invalid.status, 400);

  const unavailable = await call('/api/tables/TBL-001/virtual-token', { method: 'POST' });
  assert.equal(unavailable.status, 503);
});

test('order writes require a staff session', async () => {
  const status = await call('/api/orders/651111111111111111111111/status', {
    method: 'PATCH',
    body: JSON.stringify({ status: 'ready' }),
  });
  assert.equal(status.status, 401);

  const tick = await call('/api/orders/651111111111111111111111/items/651111111111111111111112', {
    method: 'PATCH',
    body: JSON.stringify({ isDone: true }),
  });
  assert.equal(tick.status, 401);

  const clear = await call('/api/orders/651111111111111111111111', { method: 'DELETE' });
  assert.equal(clear.status, 401);

  // Manual pickup messages are a counter/owner action only.
  const notify = await call('/api/orders/651111111111111111111111/notify', { method: 'POST' });
  assert.equal(notify.status, 401);
});

test('staff order reads require a session', async () => {
  for (const path of ['/api/orders', '/api/orders/kitchen', '/api/orders/stats']) {
    const res = await call(path);
    assert.equal(res.status, 401, `${path} should be protected`);
  }
});

test('table management requires a session', async () => {
  const requests = [
    ['/api/tables/manage', {}],
    ['/api/tables/651111111111111111111111', {}],
    ['/api/tables/651111111111111111111111/qr', { method: 'POST' }],
    ['/api/tables/651111111111111111111111/status', { method: 'PATCH', body: JSON.stringify({ status: 'available' }) }],
    ['/api/tables/651111111111111111111111/clear', { method: 'POST' }],
  ];
  for (const [path, options] of requests) {
    const res = await call(path, options);
    assert.equal(res.status, 401, `${options.method || 'GET'} ${path} should be protected`);
  }
});

test('cancelling as a guest needs the table token, not a body flag', async () => {
  const res = await call('/api/orders/651111111111111111111111/cancel', {
    method: 'PATCH',
    body: JSON.stringify({ reason: 'changed my mind', isStaffOverride: true }),
  });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.match(body.message, /table code/i);
});

test('login validates its payload before touching the database', async () => {
  const res = await call('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email', password: 'x' }),
  });
  assert.equal(res.status, 400);
  assert.equal((await res.json()).success, false);
});

test('registration is owner-only', async () => {
  const res = await call('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Nope', email: 'nope@example.com', password: 'longenough' }),
  });
  assert.equal(res.status, 401);
});
