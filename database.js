const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'poker.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#f0b90b',
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'player',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id),
    buy_in REAL NOT NULL DEFAULT 0,
    rebuys REAL NOT NULL DEFAULT 0,
    final_amount REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    time TEXT DEFAULT '',
    location TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_by INTEGER REFERENCES players(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'maybe',
    UNIQUE(game_id, player_id)
  );
`);

// ─── Players ─────────────────────────────────────────────────────────────────
const getPlayers = () => db.prepare(`
  SELECT id, name, color, username, role FROM players ORDER BY name
`).all();

const getPlayerById = id => db.prepare(`
  SELECT id, name, color, username, role FROM players WHERE id = ?
`).get(id);

const getPlayerByUsername = username => db.prepare(`
  SELECT * FROM players WHERE username = ?
`).get(username);

const createPlayer = (name, color, username, password_hash, role = 'player') =>
  db.prepare(`INSERT INTO players (name, color, username, password_hash, role) VALUES (?, ?, ?, ?, ?)`)
    .run(name, color, username, password_hash, role);

const updatePlayerColor = (id, color) =>
  db.prepare(`UPDATE players SET color = ? WHERE id = ?`).run(color, id);

const deletePlayer = id =>
  db.prepare(`DELETE FROM players WHERE id = ?`).run(id);

const playerCount = () => db.prepare(`SELECT COUNT(*) as c FROM players`).get().c;

// ─── Sessions ─────────────────────────────────────────────────────────────────
const getSessions = () => {
  const sessions = db.prepare(`SELECT * FROM sessions ORDER BY date DESC, id DESC`).all();
  return sessions.map(s => ({
    ...s,
    results: db.prepare(`
      SELECT r.*, p.name as player_name, p.color as player_color
      FROM results r JOIN players p ON r.player_id = p.id
      WHERE r.session_id = ?
    `).all(s.id)
  }));
};

const createSession = (date, notes, results) => {
  const insert = db.transaction(() => {
    const { lastInsertRowid } = db.prepare(`INSERT INTO sessions (date, notes) VALUES (?, ?)`).run(date, notes || '');
    const sessionId = lastInsertRowid;
    const stmt = db.prepare(`INSERT INTO results (session_id, player_id, buy_in, rebuys, final_amount) VALUES (?, ?, ?, ?, ?)`);
    for (const r of results) {
      stmt.run(sessionId, r.playerId, r.buyIn || 0, r.rebuys || 0, r.finalAmount || 0);
    }
    return sessionId;
  });
  return insert();
};

const deleteSession = id =>
  db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);

// ─── Scheduled Games ─────────────────────────────────────────────────────────
const getGames = () => {
  const games = db.prepare(`SELECT * FROM games ORDER BY date ASC, time ASC`).all();
  return games.map(g => ({
    ...g,
    rsvps: db.prepare(`
      SELECT r.status, p.id as player_id, p.name, p.color
      FROM rsvps r JOIN players p ON r.player_id = p.id
      WHERE r.game_id = ?
    `).all(g.id)
  }));
};

const createGame = (date, time, location, notes, created_by) =>
  db.prepare(`INSERT INTO games (date, time, location, notes, created_by) VALUES (?, ?, ?, ?, ?)`)
    .run(date, time || '', location || '', notes || '', created_by);

const upsertRsvp = (game_id, player_id, status) =>
  db.prepare(`
    INSERT INTO rsvps (game_id, player_id, status) VALUES (?, ?, ?)
    ON CONFLICT(game_id, player_id) DO UPDATE SET status = excluded.status
  `).run(game_id, player_id, status);

const deleteGame = id =>
  db.prepare(`DELETE FROM games WHERE id = ?`).run(id);

module.exports = {
  getPlayers, getPlayerById, getPlayerByUsername, createPlayer,
  updatePlayerColor, deletePlayer, playerCount,
  getSessions, createSession, deleteSession,
  getGames, createGame, upsertRsvp, deleteGame
};
