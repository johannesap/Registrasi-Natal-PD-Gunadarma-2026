// Production server outside Vercel (a Hostinger Node.js web app, a VPS): the API plus the built site from dist/.
// Run `npm run build` first, then `npm start`.
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';

// Here a proxy (Hostinger's, or nginx on a VPS) sits in front: read the visitor's address from the X-Forwarded-For it
// adds, not from x-real-ip, which a visitor could fake to dodge the login limit. One proxy unless .env says otherwise.
process.env.TRUST_PROXY ??= '1';
const { default: app } = await import('./app.js');

app.use(express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Situs + API berjalan di port ${port} (database: ${process.env.MONGODB_DATABASE || 'natal_pd_2026'})`);
});
