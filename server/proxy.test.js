import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// The app as server/start.js runs it on Hostinger or a VPS: one proxy in front. Only reads (the health count).
const skip = !process.env.MONGODB_URI && 'MONGODB_URI not set';
process.env.TRUST_PROXY = '1';
const { default: app } = await import('./app.js');
const { closeDb } = await import('./db.js');

let server;
const yourIp = async (headers) =>
  (await (await fetch(`http://127.0.0.1:${server.address().port}/api/health`, { headers })).json()).yourIp;

before(() => {
  if (!skip) server = app.listen(0);
});
after(async () => {
  if (skip) return;
  await closeDb();
  server.close();
});

test('behind a proxy the limits use the address the proxy adds, not one the visitor makes up', { skip }, async () => {
  assert.equal(await yourIp({ 'x-forwarded-for': '1.2.3.4' }), '1.2.3.4');
  // A visitor sends their own x-real-ip and X-Forwarded-For entry; the proxy appends the real address last
  assert.equal(await yourIp({ 'x-real-ip': '9.9.9.9', 'x-forwarded-for': '6.6.6.6, 1.2.3.4' }), '1.2.3.4');
});
