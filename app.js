require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const authRoutes   = require('./routes/auth');
const tripRoutes   = require('./routes/trip');
const { globalLimiter } = require('./middleware/rateLimit');

/* Fail loudly in production if critical env vars are missing */
if (process.env.NODE_ENV === 'production') {
  const required = ['JWT_SECRET', 'DEMO_EMAIL', 'DEMO_PASS', 'DEMO_TRIP', 'DEMO_CONF'];
  const missing  = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error('[FATAL] Missing required env vars:', missing.join(', '));
    process.exit(1);
  }
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api',      tripRoutes);

module.exports = { app };
