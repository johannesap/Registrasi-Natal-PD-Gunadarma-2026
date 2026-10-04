import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';
import { initDB } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize file database
initDB();

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Mount API routes under /api
app.use('/api', apiRouter);

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    event: 'Natal Persekutuan Doa Universitas Gunadarma 2026',
    tagline: 'Merayakan Kasih, Menyalakan Harapan',
    serverStatus: 'Online',
    apiHealthUrl: '/api/health',
    endpoints: [
      'POST /api/register',
      'GET /api/registrations',
      'GET /api/registrations/:ticketId',
      'PATCH /api/registrations/:ticketId/checkin',
      'DELETE /api/registrations/:ticketId',
      'POST /api/admin/login',
      'GET /api/stats',
      'GET /api/export',
    ],
  });
});

app.listen(PORT, () => {
  console.log(`
============================================================
  🌟 NATAL PERSEKUTUAN DOA UNIVERSITAS GUNADARMA 2026 🌟
             Backend Server Berhasil Berjalan!
============================================================
  🚀 Server URL       : http://localhost:${PORT}
  📡 API Health Check : http://localhost:${PORT}/api/health
  📋 Data Registrasi  : http://localhost:${PORT}/api/registrations
  📊 Statistik Acara  : http://localhost:${PORT}/api/stats
============================================================
  `);
});

export default app;
