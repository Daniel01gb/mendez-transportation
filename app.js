require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const cors         = require('cors');
const authRoutes        = require('./routes/auth');
const tripRoutes        = require('./routes/trip');
const dispatcherRoutes  = require('./routes/dispatcher');
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

/* Allowed origins: set ALLOWED_ORIGINS in env as comma-separated list */
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:8888'];

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'"],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'"],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin(origin, cb) {
    /* Allow requests with no origin (server-to-server, curl) in dev */
    if (!origin) return cb(null, process.env.NODE_ENV === 'production' ? false : true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use(globalLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth',       authRoutes);
app.use('/api/dispatcher', dispatcherRoutes);
app.use('/api',            tripRoutes);

/* Generic error handler — never leak stack traces in production */
app.use((err, _req, res, _next) => {
  if (err.message?.startsWith('CORS:')) return res.status(403).json({ error: 'Forbidden' });
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = { app };
