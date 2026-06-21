const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { createUser, findByUsername, comparePassword, updatePreferences } = require('../models/User');
const authMiddleware = require('../middleware/auth');

const VALID_THEMES = ['dark-forest', 'midnight-ocean', 'moonlight', 'sunset-beach', 'aurora', 'starfield'];

function signToken(user) {
  return jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// POST /auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    if (username.trim().length < 2 || username.trim().length > 30) {
      return res.status(400).json({ error: 'username must be 2-30 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    const normalized = username.trim().toLowerCase();
    const existing = await findByUsername(normalized);
    if (existing) {
      return res.status(409).json({ error: 'username already taken' });
    }
    const user = await createUser(normalized, password);
    const token = signToken(user);
    res.status(201).json({ token, username: user.username, id: user._id, preferences: {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const normalized = username.trim().toLowerCase();
    const user = await findByUsername(normalized);
    if (!user) {
      return res.status(401).json({ error: 'invalid username or password' });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'invalid username or password' });
    }
    const token = signToken(user);
    res.json({ token, username: user.username, id: user._id, preferences: user.preferences || {} });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /auth/preferences — save user preferences (theme, etc.)
router.patch('/preferences', authMiddleware, async (req, res) => {
  try {
    const { theme } = req.body;
    if (theme !== undefined && !VALID_THEMES.includes(theme)) {
      return res.status(400).json({ error: 'invalid theme' });
    }
    await updatePreferences(req.user.username, { ...(theme !== undefined && { theme }) });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
