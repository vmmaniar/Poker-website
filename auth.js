const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'poker-night-secret-change-in-production';
const SALT_ROUNDS = 10;

const hashPassword = password => bcrypt.hashSync(password, SALT_ROUNDS);
const verifyPassword = (password, hash) => bcrypt.compareSync(password, hash);

const signToken = player => jwt.sign(
  { id: player.id, username: player.username, role: player.role, name: player.name, color: player.color },
  JWT_SECRET,
  { expiresIn: '30d' }
);

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    req.player = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (req.player.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    next();
  });
};

module.exports = { hashPassword, verifyPassword, signToken, requireAuth, requireAdmin };
