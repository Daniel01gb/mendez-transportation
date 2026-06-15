const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'mendez_session';
const secret = () => process.env.JWT_SECRET || 'dev_secret_change_in_prod';

function requireSession(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, secret());
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ error: 'Session expired' });
  }
}

function requireDispatcher(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, secret());
    if (req.user.role !== 'dispatcher') return res.status(403).json({ error: 'Access denied' });
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ error: 'Session expired' });
  }
}

function issueSession(res, payload, rememberDevice) {
  const maxAge = rememberDevice
    ? 30 * 24 * 60 * 60 * 1000   /* 30 days */
    : 8  * 60 * 60 * 1000;       /* 8 hours */

  const token = jwt.sign(payload, secret(), {
    expiresIn: rememberDevice ? '30d' : '8h'
  });

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge
  });
}

function clearSession(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: 'strict' });
}

function requireDriver(req, res, next) {
  const token = req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    req.user = jwt.verify(token, secret());
    if (req.user.role !== 'driver') return res.status(403).json({ error: 'Access denied' });
    next();
  } catch {
    res.clearCookie(COOKIE_NAME);
    res.status(401).json({ error: 'Session expired' });
  }
}

module.exports = { requireSession, requireDispatcher, requireDriver, issueSession, clearSession };
