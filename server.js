const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { hashPassword, verifyPassword, signToken, requireAuth, requireAdmin } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  const player = db.getPlayerByUsername(username.trim().toLowerCase());
  if (!player || !verifyPassword(password, player.password_hash)) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  res.json({ token: signToken(player), player: { id: player.id, name: player.name, color: player.color, role: player.role, username: player.username } });
});

// Admin registers new players
app.post('/api/auth/register', requireAdmin, (req, res) => {
  const { name, color, username, password } = req.body;
  if (!name || !username || !password) return res.status(400).json({ error: 'name, username, password required' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  try {
    const result = db.createPlayer(name.trim(), color || '#f0b90b', username.trim().toLowerCase(), hashPassword(password));
    res.json({ id: result.lastInsertRowid, name, username });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken' });
    throw e;
  }
});

// First-time setup: register first admin (only works when no players exist)
app.post('/api/auth/setup', (req, res) => {
  if (db.playerCount() > 0) return res.status(403).json({ error: 'Setup already complete' });
  const { name, color, username, password } = req.body;
  if (!name || !username || !password) return res.status(400).json({ error: 'name, username, password required' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  try {
    const result = db.createPlayer(name.trim(), color || '#f0b90b', username.trim().toLowerCase(), hashPassword(password), 'admin');
    const player = db.getPlayerById(result.lastInsertRowid);
    res.json({ token: signToken(player), player: { id: player.id, name: player.name, color: player.color, role: player.role, username: player.username } });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken' });
    throw e;
  }
});

// ─── Players ──────────────────────────────────────────────────────────────────
app.get('/api/players', requireAuth, (req, res) => {
  res.json(db.getPlayers());
});

app.post('/api/players', requireAdmin, (req, res) => {
  const { name, color, username, password } = req.body;
  if (!name || !username || !password) return res.status(400).json({ error: 'name, username, password required' });
  if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

  try {
    const result = db.createPlayer(name.trim(), color || '#f0b90b', username.trim().toLowerCase(), hashPassword(password));
    res.json({ id: result.lastInsertRowid, name, color, username });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken' });
    throw e;
  }
});

app.delete('/api/players/:id', requireAdmin, (req, res) => {
  db.deletePlayer(req.params.id);
  res.json({ ok: true });
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
app.get('/api/sessions', requireAuth, (req, res) => {
  res.json(db.getSessions());
});

app.post('/api/sessions', requireAdmin, (req, res) => {
  const { date, notes, results } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  if (!results || !results.length) return res.status(400).json({ error: 'results required' });

  // Validate balance: sum of net P&L must be ~0
  const total = results.reduce((s, r) => s + (r.finalAmount - r.buyIn - (r.rebuys || 0)), 0);
  if (Math.abs(total) > 1) return res.status(400).json({ error: `Results don't balance (off by $${total.toFixed(2)})` });

  const id = db.createSession(date, notes, results);
  res.json({ id });
});

app.delete('/api/sessions/:id', requireAdmin, (req, res) => {
  db.deleteSession(req.params.id);
  res.json({ ok: true });
});

// ─── Scheduled Games ──────────────────────────────────────────────────────────
app.get('/api/games', requireAuth, (req, res) => {
  res.json(db.getGames());
});

app.post('/api/games', requireAuth, (req, res) => {
  const { date, time, location, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'date required' });
  const result = db.createGame(date, time, location, notes, req.player.id);
  res.json({ id: result.lastInsertRowid });
});

app.put('/api/games/:id/rsvp', requireAuth, (req, res) => {
  const { status } = req.body;
  if (!['in', 'out', 'maybe'].includes(status)) return res.status(400).json({ error: 'status must be in/out/maybe' });
  db.upsertRsvp(req.params.id, req.player.id, status);
  res.json({ ok: true });
});

app.delete('/api/games/:id', requireAdmin, (req, res) => {
  db.deleteGame(req.params.id);
  res.json({ ok: true });
});

// ─── Catch-all → index.html ───────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n♠  Poker Night Tracker running at http://localhost:${PORT}`);
  console.log(`   Share on local network: http://<your-ip>:${PORT}\n`);
});
