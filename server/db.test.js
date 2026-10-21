import 'dotenv/config';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoClient } from 'mongodb';

// Writes real documents, so it only runs against a non-production database from .env
const LIVE_DB = 'natal_pd_2026';
const skip = !process.env.MONGODB_URI
  ? 'MONGODB_URI not set'
  : (process.env.MONGODB_DATABASE || LIVE_DB) === LIVE_DB && 'refusing to write test data to the live database';

const { default: app } = await import('./app.js');
const { setCheckIn, deleteRegistration, closeDb } = await import('./db.js');

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

after(async () => {
  if (skip) return;
  if (ticketId) await deleteRegistration(ticketId);
  await closeDb();
  server.close();
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
