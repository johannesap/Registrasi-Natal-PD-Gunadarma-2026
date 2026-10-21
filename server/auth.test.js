import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// Auth must reject before any database call, so these tests run without MongoDB
process.env.ADMIN_TOKEN_SECRET = 'test-secret';
delete process.env.MONGODB_URI;

const { default: app } = await import('./app.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;
after(() => server.close());

const makeToken = (exp, secret = 'test-secret') => {
  const payload = Buffer.from(JSON.stringify({ u: 'admin', exp })).toString('base64url');
  return `${payload}.${crypto.createHmac('sha256', secret).update(payload).digest('base64url')}`;
};

const call = (path, method, token) =>
  fetch(`${base}${path}`, { method, headers: token ? { Authorization: `Bearer ${token}` } : {} });

test('admin endpoints reject missing, forged, expired and garbage tokens', async () => {
  const badTokens = [
    undefined,
    makeToken(Date.now() + 60_000, 'wrong-secret'),
    makeToken(Date.now() - 1),
    'garbage',
  ];
  const endpoints = [
    ['/registrations', 'GET'],
    ['/registrations/NATAL-UG-1234-5678/checkin', 'PATCH'],
    ['/registrations/NATAL-UG-1234-5678', 'DELETE'],
  ];
  for (const token of badTokens) {
    for (const [path, method] of endpoints) {
      const res = await call(path, method, token);
      assert.equal(res.status, 401, `${method} ${path} with token ${token}`);
    }
  }
});

test('a valid token gets past the auth check', async () => {
  const res = await call('/registrations', 'GET', makeToken(Date.now() + 60_000));
  // No database in tests: anything but 401 means the request got through auth
  assert.equal(res.status, 500);
});
