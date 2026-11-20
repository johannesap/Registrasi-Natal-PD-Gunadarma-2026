import express from 'express';
import apiRouter from './routes/api.js';

// Shared by Vercel (api/index.js), the Vite dev server (vite.config.js) and the tests
const app = express();

// Outside Vercel: how many proxies sit in front (server/start.js sets 1), so req.ip reads their X-Forwarded-For
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

app.use('/api', apiRouter);

export default app;
