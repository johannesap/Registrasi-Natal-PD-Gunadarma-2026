import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';

// Writes real documents, so it only runs against a non-production database from .env
const LIVE_DB = 'natal_pd_2026';
const skip = !process.env.MONGODB_URI
  ? 'MONGODB_URI not set'
  : (process.env.MONGODB_DATABASE || LIVE_DB) === LIVE_DB && 'refusing to write test data to the live database';
// Test participants have example.com addresses: never email them
delete process.env.SMTP_USER;

const { default: app } = await import('./app.js');
const { setCheckIn, deleteRegistration, closeDb, createUser, deleteUser, countAdmins } = await import('./db.js');
const { default: bcrypt } = await import('bcryptjs');

const person = {
  fullName: 'Tes Otomatis',
  npm: '19990001',
  email: 'Tes.Otomatis@Example.com',
  whatsapp: '081299990001',
  region: 'depok',
  komselStatus: 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
};

let server;
let base;
let ticketId;

const register = (body) =>
  fetch(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

before(() => {
  if (skip) return;
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

const TEST_PW = 'tes-password-123';
const testUserIds = [];

after(async () => {
  if (skip) return;
  if (ticketId) await deleteRegistration(ticketId);
  for (const id of testUserIds) await deleteUser(id);
  await closeDb();
  server.close();
});

async function makeUser(name, role) {
  const user = await createUser({
    name,
    email: `${name}@example.com`,
    role,
    passwordHash: await bcrypt.hash(TEST_PW, 4),
  });
  testUserIds.push(user.id);
  return user;
}

const loginToken = async (name, password = TEST_PW) =>
  (
    await (
      await fetch(`${base}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name, password }),
      })
    ).json()
  ).token;

const authed = (path, token, method = 'GET', body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
  });

test('registering again with the same NPM, email and phone returns the same ticket', { skip }, async () => {
  const first = await (await register(person)).json();
  assert.equal(first.success, true);
  ticketId = first.data.ticketId;

  // Email in other letter case and phone written as 62…: still the same person
  const again = await (
    await register({ ...person, email: person.email.toLowerCase(), whatsapp: '6281299990001' })
  ).json();
  assert.equal(again.alreadyRegistered, true);
  assert.equal(again.data.ticketId, ticketId);
});

test('same NPM and email with another phone gets no ticket back', { skip }, async () => {
  const res = await register({ ...person, whatsapp: '081200000000' });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.data, undefined);
  assert.equal(body.dispatch, undefined);
});

test('checking in twice keeps the first check-in time', { skip }, async () => {
  await setCheckIn(ticketId, true);

  // Move the first check-in an hour back, so a second call that overwrote it would show
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  const col = client.db(process.env.MONGODB_DATABASE).collection('registrations');
  const earlier = new Date(Date.now() - 60 * 60 * 1000);
  await col.updateOne({ ticket_id: ticketId }, { $set: { checked_in_at: earlier } });

  const again = await setCheckIn(ticketId, true);
  assert.equal(again.isCheckedIn, true);
  const stored = await col.findOne({ ticket_id: ticketId });
  await client.close();
  assert.equal(stored.checked_in_at.getTime(), earlier.getTime());

  const undone = await setCheckIn(ticketId, false);
  assert.equal(undone.isCheckedIn, false);
  assert.equal(undone.checkedInAt, null);
});

test('sekretariat sees registrations but not accounts; admin the other way round', { skip }, async () => {
  await makeUser('tes-sek', 'sekretariat');
  await makeUser('tes-adm', 'admin');
  const sek = await loginToken('tes-sek');
  const adm = await loginToken('tes-adm');

  assert.equal((await authed('/registrations', sek)).status, 200);
  assert.equal((await authed('/users', sek)).status, 403);
  assert.equal((await authed('/users', adm)).status, 200);
  assert.equal((await authed('/registrations', adm)).status, 403);
});

test('admin creates, edits and deletes accounts; changes apply at once', { skip }, async () => {
  const adm = await loginToken('tes-adm');
  const account = { name: 'tes-baru', email: 'tes-baru@example.com', role: 'sekretariat', password: 'password-baru-1' };

  const created = await (await authed('/users', adm, 'POST', account)).json();
  assert.equal(created.success, true);
  testUserIds.push(created.data.id);
  assert.equal(created.data.password, undefined, 'never send the hash');
  assert.equal((await authed('/users', adm, 'POST', account)).status, 409, 'duplicate username');

  const baru = await loginToken('tes-baru', 'password-baru-1');
  assert.equal((await authed('/registrations', baru)).status, 200);

  // Promote to admin: the old token now gets the new role's rights, without logging in again
  const edited = await authed(`/users/${created.data.id}`, adm, 'PATCH', { ...account, role: 'admin', password: '' });
  assert.equal(edited.status, 200);
  assert.equal((await authed('/registrations', baru)).status, 403);

  assert.equal((await authed(`/users/${created.data.id}`, adm, 'DELETE')).status, 200);
  assert.equal((await authed('/users', baru)).status, 401, 'deleted account loses access');

  const self = testUserIds[1]; // tes-adm
  assert.equal((await authed(`/users/${self}`, adm, 'DELETE')).status, 409, 'cannot delete own account');
});

test('the last admin cannot be demoted', { skip }, async (t) => {
  if ((await countAdmins()) !== 1) return t.skip('other admin accounts exist in this database');
  const adm = await loginToken('tes-adm');
  const res = await authed(`/users/${testUserIds[1]}`, adm, 'PATCH', {
    name: 'tes-adm',
    email: 'tes-adm@example.com',
    role: 'sekretariat',
    password: '',
  });
  assert.equal(res.status, 409);
});

test('changing your own password ends older sessions but keeps this one', { skip }, async () => {
  await makeUser('tes-ganti', 'sekretariat');
  const mine = await loginToken('tes-ganti');
  const other = await loginToken('tes-ganti'); // e.g. someone else who knew the old password
  const change = (token, currentPassword) =>
    authed('/me/password', token, 'POST', { currentPassword, newPassword: 'password-baru-9' });

  assert.equal((await change(mine, 'bukan-password-lama')).status, 422, 'wrong old password');
  assert.equal((await authed('/registrations', mine)).status, 200, 'a wrong old password does not log out');

  const result = await (await change(mine, TEST_PW)).json();
  assert.equal(result.success, true);
  assert.equal((await authed('/registrations', result.token)).status, 200, 'this session continues');
  assert.equal((await authed('/registrations', other)).status, 401, 'other sessions end');
  assert.equal(await loginToken('tes-ganti'), undefined, 'old password no longer works');
  assert.ok(await loginToken('tes-ganti', 'password-baru-9'), 'new password works');
});

test('an admin password reset ends that account’s sessions', { skip }, async () => {
  const user = await makeUser('tes-reset', 'sekretariat');
  const before = await loginToken('tes-reset');
  const adm = await loginToken('tes-adm');
  const res = await authed(`/users/${user.id}`, adm, 'PATCH', {
    name: 'tes-reset',
    email: 'tes-reset@example.com',
    role: 'sekretariat',
    password: 'password-reset-1',
  });
  assert.equal(res.status, 200);
  assert.equal((await authed('/registrations', before)).status, 401);
  assert.ok(await loginToken('tes-reset', 'password-reset-1'));
});
