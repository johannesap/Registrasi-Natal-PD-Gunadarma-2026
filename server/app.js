import express from 'express';
import apiRouter from './routes/api.js';

// Shared by Vercel (api/index.js), the local server (index.js) and the tests
const app = express();

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
