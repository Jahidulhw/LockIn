const db = require('../config/firebase');
const bcrypt = require('bcryptjs');

const USERS = db.collection('users');

async function createUser(username, password) {
  const hash = await bcrypt.hash(password, 12);
  await USERS.doc(username).set({
    username,
    password: hash,
    createdAt: new Date().toISOString()
  });
  return { _id: username, username };
}

async function findByUsername(username) {
  const doc = await USERS.doc(username).get();
  if (!doc.exists) return null;
  return { _id: doc.id, ...doc.data() };
}

async function comparePassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}

async function updatePreferences(username, prefs) {
  // Bug fix: use dot-notation field paths so we merge individual keys instead of
  // replacing the entire preferences map (which would wipe unrelated settings).
  const updates = {};
  for (const [k, v] of Object.entries(prefs)) {
    updates[`preferences.${k}`] = v;
  }
  await USERS.doc(username).update(updates);
}

module.exports = { createUser, findByUsername, comparePassword, updatePreferences };
