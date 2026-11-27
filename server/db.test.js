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
const { setCheckIn, deleteRegistration, closeDb, createUser, deleteUser, countAdmins } = await import('./db.js');
const { default: bcrypt } = await import('bcryptjs');

const person = {
  fullName: 'Tes Otomatis',
  gender: 'Perempuan',
  status: 'Mahasiswa Gunadarma',
  whatsapp: '081299990001',
  region: 'depok',
  angkatan: '2024',
  komselStatus: 'Sudah memiliki Komsel (Tuliskan nama Kakak Komsel di bawah)',
  departure: 'Bersama',
  departureArea: 'Depok',
};

let server;
let base;
let ticketId;

// Attempt limits count per network: a fresh "address" per run keeps runs apart (the counters expire by themselves)
const TEST_IP = `tes-${Date.now()}`;

const register = (body, ip = TEST_IP) =>
  fetch(`${base}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify(body),
  });

before(() => {
  if (skip) return;
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});

const TEST_PW = 'tes-password-123';
const testUserIds = [];
let admId; // tes-adm

after(async () => {
  if (skip) return;
  if (ticketId) await deleteRegistration(ticketId);
  for (const id of testUserIds) await deleteUser(id);
  // Audit lines written by the test accounts
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  await client.db(process.env.MONGODB_DATABASE).collection('audit_logs').deleteMany({ user: /^tes-/ });
  await client.close();
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

const login = (name, password, ip = TEST_IP) =>
  fetch(`${base}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': ip },
    body: JSON.stringify({ username: name, password }),
  });

const loginToken = async (name, password = TEST_PW) => (await (await login(name, password)).json()).token;

const authed = (path, token, method = 'GET', body) =>
  fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body && { 'Content-Type': 'application/json' }) },
    body: body && JSON.stringify(body),
  });

test('registering again with the same phone and name returns the same ticket', { skip }, async () => {
  const first = await (await register(person)).json();
  assert.equal(first.success, true);
  ticketId = first.data.ticketId;
  assert.match(ticketId, /^NATAL-UG-\d{4}-0001$/, 'suffix is the last 4 digits of the phone');
  assert.equal(first.data.departureArea, 'Depok');
  assert.equal(first.data.angkatan, '2024');
  // The WhatsApp message names the meeting point, then its address
  assert.match(
    decodeURIComponent(first.dispatch.whatsappUrl),
    /TITIK KUMPUL KEBERANGKATAN DEPOK:\*\n\*Depan Rumah Sakit Bhayangkara Brimob, Kelapa Dua\*\nAlamat: Jl\. Komjen\. Pol\. M\. Jasin/
  );

  // Name in other letter case and phone written as 62…: still the same person
  const again = await (
    await register({ ...person, fullName: 'tes  OTOMATIS', whatsapp: '6281299990001' })
  ).json();
  assert.equal(again.alreadyRegistered, true);
  assert.equal(again.data.ticketId, ticketId);
});

test('same phone with another name gets no ticket back', { skip }, async () => {
  const res = await register({ ...person, fullName: 'Orang Lain' });
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.data, undefined);
  assert.equal(body.dispatch, undefined);
});

test('Pribadi always stores area "-"; Bersama needs a known area', { skip }, async () => {
  const pribadi = await register({ ...person, whatsapp: '081299990002', departure: 'Pribadi', departureArea: 'Depok' });
  const body = await pribadi.json();
  await deleteRegistration(body.data.ticketId);
  assert.equal(body.data.departureArea, '-');

  for (const bad of [
    { departure: 'Bersama', departureArea: 'Bogor' },
    { departure: 'Naik ojek' },
    { gender: 'X' },
    { region: 'bogor' },
    { komselStatus: 'apa saja' },
    { komselStatus: 'Alumni / Pengurus' },
    { region: 'alumni_tamu' },
    { angkatan: '2018' }, // students pick from the list
    { angkatan: '' },
    { status: 'Dosen' },
    { status: 'Alumni Gunadarma', angkatan: '1975' },
    { status: 'Alumni Gunadarma', angkatan: '2030' },
    { status: 'Alumni Gunadarma', angkatan: '20x4' },
    { status: 'Alumni Gunadarma', region: '-' },
    { status: 'Alumni Gunadarma', departure: '' },
    { status: 'Media Partner' }, // without the media partner's name
  ]) {
    // Own network, so these do not use up the 20-a-minute limit the other tests register under
    assert.equal((await register({ ...person, whatsapp: '081299990003', ...bad }, `${TEST_IP}-bad`)).status, 422, JSON.stringify(bad));
  }
});

test('students and alumni keep region, angkatan and departure; other statuses store "-" and their affiliation', { skip }, async () => {
  const alumni = (await (await register({ ...person, whatsapp: '081299990004', status: 'Alumni Gunadarma', angkatan: '1998' })).json()).data;
  await deleteRegistration(alumni.ticketId);
  assert.deepEqual([alumni.region, alumni.angkatan, alumni.departure, alumni.affiliation], ['depok', '1998', 'Bersama', '-']);

  const media = await (
    await register({ ...person, whatsapp: '081299990005', status: 'Media Partner', affiliation: ' Kompas ' })
  ).json();
  await deleteRegistration(media.data.ticketId);
  const d = media.data;
  assert.deepEqual([d.region, d.angkatan, d.departure, d.departureArea, d.affiliation], ['-', '-', '-', '-', 'Kompas']);
  assert.match(decodeURIComponent(media.dispatch.whatsappUrl), /Nama Media Partner: \*Kompas\*/);
  assert.doesNotMatch(decodeURIComponent(media.dispatch.whatsappUrl), /Keberangkatan:/);

  // Umum gives no affiliation even if one is sent
  const umum = (await (await register({ ...person, whatsapp: '081299990007', status: 'Umum (di luar Gunadarma)', affiliation: 'x' })).json()).data;
  await deleteRegistration(umum.ticketId);
  assert.equal(umum.affiliation, '-');
});

test('more than 20 registrations a minute from one network get 429', { skip }, async () => {
  const ip = `${TEST_IP}-banjir`;
  const statuses = [];
  for (let i = 0; i < 21; i++) statuses.push((await register({}, ip)).status);
  assert.deepEqual(statuses.slice(0, 20), Array(20).fill(422), 'empty forms are rejected but still counted');
  assert.equal(statuses[20], 429);
});

test('5 wrong passwords block that username from that network for 5 minutes', { skip }, async () => {
  await makeUser('tes-kunci', 'sekretariat');
  for (let i = 1; i <= 4; i++) assert.equal((await login('tes-kunci', 'bukan-ini-123')).status, 401, `try ${i}`);
  assert.equal((await login('tes-kunci', 'bukan-ini-123')).status, 429, 'the 5th wrong password starts the block');
  assert.equal((await login('tes-kunci', TEST_PW)).status, 429, 'even the right password waits');
  assert.equal((await login('tes-kunci', TEST_PW, `${TEST_IP}-lain`)).status, 200, 'other networks are not locked out');
});

test('overlong usernames are refused without being counted or stored', { skip }, async () => {
  const huge = 'x'.repeat(5000);
  for (let i = 0; i < 6; i++) assert.equal((await login(huge, 'apa-saja-123')).status, 401, 'never 429: not counted');
  const client = await new MongoClient(process.env.MONGODB_URI).connect();
  const stored = await client.db(process.env.MONGODB_DATABASE).collection('limits').countDocuments({ _id: { $regex: 'xxxxxxxxxx' } });
  await client.close();
  assert.equal(stored, 0);
});

test('a successful login clears earlier wrong passwords', { skip }, async () => {
  await makeUser('tes-lupa', 'sekretariat');
  for (let i = 0; i < 4; i++) await login('tes-lupa', 'bukan-ini-123');
  assert.equal((await login('tes-lupa', TEST_PW)).status, 200);
  assert.equal((await login('tes-lupa', 'bukan-ini-123')).status, 401, 'counting starts again from zero');
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
  admId = (await makeUser('tes-adm', 'admin')).id;
  const sek = await loginToken('tes-sek');
  const adm = await loginToken('tes-adm');

  assert.equal((await authed('/registrations', sek)).status, 200);
  assert.equal((await authed('/users', sek)).status, 403);
  assert.equal((await authed('/users', adm)).status, 200);
  assert.equal((await authed('/registrations', adm)).status, 403);
});

test('the audit log records logins and check-ins; only admin can read it', { skip }, async () => {
  const sek = await loginToken('tes-sek');
  assert.equal((await authed(`/registrations/${ticketId}/checkin`, sek, 'PATCH', { checkedIn: true })).status, 200);
  await login('tes-sek', 'bukan-ini-123');

  assert.equal((await authed('/audit-logs', sek)).status, 403);
  const logs = (await (await authed('/audit-logs', await loginToken('tes-adm'))).json()).data;
  const mine = logs.filter((l) => l.user === 'tes-sek').map((l) => l.action);
  assert.ok(mine.includes('LOGIN'));
  assert.ok(mine.includes('LOGIN GAGAL'));
  const checkIn = logs.find((l) => l.user === 'tes-sek' && l.action === 'CHECK-IN');
  assert.equal(checkIn.entity, 'peserta');
  assert.ok(checkIn.detail.startsWith(ticketId), 'names the ticket');
  // The login helper sends the network address as x-real-ip, the way Vercel does
  assert.equal(logs.find((l) => l.user === 'tes-sek' && l.action === 'LOGIN').ip, TEST_IP);
});

test('bus attendance (berangkat, pulang) is ticked by hand, apart from the door check-in', { skip }, async () => {
  const sek = await loginToken('tes-sek');
  const bus = (body, id = ticketId, token = sek) => authed(`/registrations/${id}/bus`, token, 'PATCH', body);
  await authed(`/registrations/${ticketId}/checkin`, sek, 'PATCH', { checkedIn: false });

  const went = (await (await bus({ leg: 'berangkat', value: true })).json()).data;
  assert.equal(went.busDeparted, true);
  assert.equal(went.busReturned, false);
  assert.equal(went.isCheckedIn, false, 'the door check-in stays as it was');
  assert.equal((await (await bus({ leg: 'pulang', value: true })).json()).data.busReturned, true);
  assert.equal((await (await bus({ leg: 'berangkat', value: false })).json()).data.busDeparted, false);

  assert.equal((await bus({ leg: 'naik', value: true })).status, 422);
  assert.equal((await bus({ leg: 'berangkat', value: 'ya' })).status, 422);
  assert.equal((await bus({ leg: 'berangkat', value: true }, ticketId, await loginToken('tes-adm'))).status, 403);

  const pribadi = (await (await register({ ...person, whatsapp: '081299990006', departure: 'Pribadi' })).json()).data;
  const status = (await bus({ leg: 'berangkat', value: true }, pribadi.ticketId)).status;
  await deleteRegistration(pribadi.ticketId);
  assert.equal(status, 404, 'Pribadi participants do not ride the bus');
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

  const self = admId;
  assert.equal((await authed(`/users/${self}`, adm, 'DELETE')).status, 409, 'cannot delete own account');
});

test('weak passwords are refused when creating, resetting or changing one', { skip }, async () => {
  const adm = await loginToken('tes-adm');
  const account = { name: 'tes-lemah', email: 'tes-lemah@example.com', role: 'sekretariat' };
  for (const weak of ['tes-lemah123', 'Natal2026', 'password123', 'aaaaaaaa', 'pendek']) {
    assert.equal((await authed('/users', adm, 'POST', { ...account, password: weak })).status, 422, weak);
  }
  const created = await (await authed('/users', adm, 'POST', { ...account, password: 'Bintang-Timur-48' })).json();
  assert.equal(created.success, true);
  testUserIds.push(created.data.id);

  const reset = await authed(`/users/${created.data.id}`, adm, 'PATCH', { ...account, password: 'qwerty123' });
  assert.equal(reset.status, 422, 'admin reset to a common password');
  const own = await loginToken('tes-lemah', 'Bintang-Timur-48');
  const change = await authed('/me/password', own, 'POST', { currentPassword: 'Bintang-Timur-48', newPassword: 'TES-LEMAH-2026' });
  assert.equal(change.status, 422, 'own new password containing the username, other letter case');
});

test('the last admin cannot be demoted', { skip }, async (t) => {
  if ((await countAdmins()) !== 1) return t.skip('other admin accounts exist in this database');
  const adm = await loginToken('tes-adm');
  const res = await authed(`/users/${admId}`, adm, 'PATCH', {
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
