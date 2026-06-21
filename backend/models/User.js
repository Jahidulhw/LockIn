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
  await USERS.doc(username).update({ preferences: prefs });
}

module.exports = { createUser, findByUsername, comparePassword, updatePreferences };
