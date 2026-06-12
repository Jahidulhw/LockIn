require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize Firebase before importing routes
require('./config/firebase');

const challengeRoutes = require('./routes/challenges');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5001;

const allowedOrigins = [
  'http://localhost:3002',
  'http://localhost:5173',
  'https://lockin-frontend-i418.onrender.com',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : [])
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
