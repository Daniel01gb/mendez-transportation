const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

/* Constant-time string comparison — prevents timing attacks on credentials */
function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba); /* consume equal time regardless */
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}
const { sendTwoFaEmail }              = require('../utils/email');
const { requireSession, issueSession, clearSession } = require('../middleware/auth');
const { loginLimiter, twoFaLimiter }  = require('../middleware/rateLimit');
const { loginRules, verify2faRules, verifyTripRules, handleValidation } = require('../middleware/validate');

const secret         = () => process.env.JWT_SECRET || 'dev_secret_change_in_prod';
const PENDING_COOKIE = 'mendez_2fa_pending';

/* Demo credentials — override via Netlify env vars */
const DEMO = {
  email: (process.env.DEMO_EMAIL || 'demo@mendeztransport.com').toLowerCase(),
  pass:  process.env.DEMO_PASS  || 'Mendez2026!',
  code:  process.env.DEMO_CODE  || '123456',
  trip:  process.env.DEMO_TRIP  || 'MT-2026-4891',
  conf:  process.env.DEMO_CONF  || '7823'
};

const DISPATCHER = {
  email: (process.env.DISPATCHER_EMAIL || 'dispatcher@mendeztransport.com').toLowerCase(),
  pass:  process.env.DISPATCHER_PASS   || 'Dispatch2026!',
  code:  process.env.DISPATCHER_CODE   || '654321',
  name:  'Alex Rodriguez'
};

const DRIVER = {
  email: (process.env.DRIVER_EMAIL || 'driver@mendeztransport.com').toLowerCase(),
  pass:  process.env.DRIVER_PASS   || 'Driver2026!',
  code:  process.env.DRIVER_CODE   || '789012',
  name:  'Carlos Rivera',
  driverId: 1
};

/* ── GET /api/auth/me ── */
router.get('/me', requireSession, (req, res) => {
  res.json({ ok: true, email: req.user.email, role: req.user.role || 'patient' });
});

/* ── POST /api/auth/login ── */
router.post('/login', loginLimiter, loginRules, handleValidation, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Missing fields.' });

  const normalizedEmail = email.toLowerCase().trim();
  let role, code;

  if (safeEqual(normalizedEmail, DISPATCHER.email) && safeEqual(password, DISPATCHER.pass)) {
    role = 'dispatcher';
    code = DISPATCHER.code;
  } else if (safeEqual(normalizedEmail, DRIVER.email) && safeEqual(password, DRIVER.pass)) {
    role = 'driver';
    code = DRIVER.code;
  } else if (safeEqual(normalizedEmail, DEMO.email) && safeEqual(password, DEMO.pass)) {
    role = 'patient';
    code = DEMO.code;
  } else {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  /* Real email if SMTP is set, otherwise use demo code */
  if (process.env.SMTP_HOST) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    try { await sendTwoFaEmail(normalizedEmail, code); } catch (e) { console.error('[email]', e.message); }
  } else {
    console.log(`[2FA] To: ${normalizedEmail}  |  Code: ${code}  |  Role: ${role}`);
  }

  /* Sign code + role into a short-lived httpOnly cookie — no database needed */
  const token = jwt.sign({ email: normalizedEmail, code, role }, secret(), { expiresIn: '10m' });
  res.cookie(PENDING_COOKIE, token, cookieOpts(10 * 60 * 1000));

  res.json({ ok: true, maskedEmail: mask(normalizedEmail) });
});

/* ── POST /api/auth/resend-2fa ── */
router.post('/resend-2fa', twoFaLimiter, async (req, res) => {
  /* Pull email + role from existing pending cookie */
  let email = '', role = '';
  const pending = req.cookies[PENDING_COOKIE];
  if (pending) {
    try {
      const p = jwt.verify(pending, secret());
      email = p.email || '';
      role  = p.role  || '';
    } catch (_) {}
  }
  if (!email) email = ((req.body || {}).email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ error: 'Session expired. Please sign in again.' });

  /* Use the correct fixed code for each role (or generate one if SMTP is live) */
  let code = role === 'dispatcher' ? DISPATCHER.code : role === 'driver' ? DRIVER.code : DEMO.code;
  if (process.env.SMTP_HOST) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    try { await sendTwoFaEmail(email, code); } catch (e) { console.error('[email]', e.message); }
  } else {
    console.log(`[2FA RESEND] To: ${email}  |  Code: ${code}  |  Role: ${role || 'patient'}`);
  }

  const token = jwt.sign({ email, code, role }, secret(), { expiresIn: '10m' });
  res.cookie(PENDING_COOKIE, token, cookieOpts(10 * 60 * 1000));
  res.json({ ok: true });
});

/* ── POST /api/auth/verify-2fa ── */
router.post('/verify-2fa', twoFaLimiter, verify2faRules, handleValidation, (req, res) => {
  const { code, rememberDevice } = req.body || {};
  const pending = req.cookies[PENDING_COOKIE];
  if (!pending) return res.status(401).json({ error: 'Session expired. Please sign in again.' });

  let payload;
  try { payload = jwt.verify(pending, secret()); }
  catch { return res.status(401).json({ error: 'Session expired. Please sign in again.' }); }

  if (!code || !safeEqual(payload.code, code)) {
    return res.status(401).json({ error: 'Incorrect or expired code.' });
  }

  res.clearCookie(PENDING_COOKIE, { httpOnly: true, sameSite: 'strict' });
  const role = payload.role || 'patient';
  issueSession(res, { email: payload.email, role }, !!rememberDevice);
  res.json({ ok: true, role });
});

/* ── POST /api/auth/verify-trip ── */
router.post('/verify-trip', requireSession, verifyTripRules, handleValidation, (req, res) => {
  const { tripNumber, confirmCode } = req.body || {};
  if (!tripNumber || !confirmCode) return res.status(400).json({ error: 'Missing fields.' });
  if (tripNumber.trim() !== DEMO.trip || confirmCode.trim() !== DEMO.conf) {
    return res.status(401).json({ error: 'Trip number or confirmation code do not match our records.' });
  }
  res.json({ ok: true, tripId: 1 });
});

/* ── POST /api/auth/logout ── */
router.post('/logout', (req, res) => {
  clearSession(res);
  res.clearCookie(PENDING_COOKIE, { httpOnly: true, sameSite: 'strict' });
  res.json({ ok: true });
});

/* ── helpers ── */
function mask(email) {
  const [name, domain] = email.split('@');
  return name[0] + '***' + (name.length > 1 ? name[name.length - 1] : '') + '@' + domain;
}
function cookieOpts(maxAge) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge };
}

module.exports = router;
