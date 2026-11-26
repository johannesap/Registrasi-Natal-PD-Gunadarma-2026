// Atlas free tier (M0) keeps no backups, so this is the only copy outside Atlas.
//   npm run backup                   live database -> backups/natal_pd_2026-<date>.json
//   npm run restore -- <file.json>   puts back documents that are missing (deleted); never overwrites or removes any
// Uses LIVE_MONGODB_URI from .env (user natal_live). The file holds personal data and password hashes: keep it private.
import 'dotenv/config';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, BSON } from 'mongodb';

const DATABASE = 'natal_pd_2026';
// limits only holds attempt counters that expire within minutes
const COLLECTIONS = ['registrations', 'users', 'audit_logs'];
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'backups');

if (!process.env.LIVE_MONGODB_URI) {
  console.error('LIVE_MONGODB_URI belum ada di .env.');
  process.exit(1);
}
const [mode, file] = process.argv.slice(2);
if (mode === 'restore' && !file) {
  console.error('Pakai: npm run restore -- backups/<file>.json');
  process.exit(1);
}

const client = await new MongoClient(process.env.LIVE_MONGODB_URI, { serverSelectionTimeoutMS: 15000 }).connect();
try {
  const db = client.db(DATABASE);

  if (mode === 'restore') {
    // Canonical EJSON keeps ObjectIds and dates as they were
    const backup = BSON.EJSON.parse(readFileSync(file, 'utf8'), { relaxed: false });
    console.log(`Backup ${backup.database}, dibuat ${backup.at.toISOString()}`);
    for (const name of COLLECTIONS) {
      const docs = backup.collections[name] || [];
      const { upsertedCount } = docs.length
        ? await db.collection(name).bulkWrite(
            docs.map(({ _id, ...rest }) => ({ updateOne: { filter: { _id }, update: { $setOnInsert: rest }, upsert: true } })),
            { ordered: false }
          )
        : { upsertedCount: 0 };
      console.log(`  ${name}: ${upsertedCount} dikembalikan (${docs.length - upsertedCount} sudah ada, tidak diubah)`);
    }
  } else {
    const collections = {};
    for (const name of COLLECTIONS) collections[name] = await db.collection(name).find().toArray();
    const at = new Date();
    mkdirSync(DIR, { recursive: true });
    // File name in WIB ("sv-SE" prints 2026-12-12 17:05:00)
    const wib = at.toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).slice(0, 16).replace(/[ :]/g, '-');
    const out = path.join(DIR, `${DATABASE}-${wib}.json`);
    writeFileSync(out, BSON.EJSON.stringify({ database: DATABASE, at, collections }, { relaxed: false }));
    console.log(`Backup tersimpan: ${path.relative(process.cwd(), out)}`);
    for (const name of COLLECTIONS) console.log(`  ${name}: ${collections[name].length}`);
  }
} finally {
  await client.close();
}
