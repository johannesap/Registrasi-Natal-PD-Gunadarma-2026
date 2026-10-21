// Local API server for `npm run dev` (Vite proxies /api here). Production runs server/app.js on Vercel.
import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API lokal berjalan di http://localhost:${PORT}/api (database: ${process.env.MONGODB_DATABASE})`);
});
