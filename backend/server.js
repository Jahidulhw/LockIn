require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Firebase before importing routes
require('./config/firebase');

const challengeRoutes = require('./routes/challenges');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5001;

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow the deployed frontend, local dev, AND Capacitor native app schemes
const allowedOrigins = [
  // Capacitor iOS/Android native shell
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  // Local dev
  'http://localhost:3002',
  'http://localhost:5173',
  // Production frontend (set FRONTEND_URL in your Render env vars)
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin not allowed — ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
