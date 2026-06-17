require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const helmet       = require('helmet');
const cors         = require('cors');
const authRoutes                              = require('./routes/auth');
const tripRoutes                              = require('./routes/trip');
const { router: dispatcherRoutes, brokerRouter } = require('./routes/dispatcher');
const driverRoutes                            = require('./routes/driver');
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
      scriptSrc:   ["'self'", 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com', 'https://cdn.jsdelivr.net'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:'],
      connectSrc:  ["'self'", 'wss://0.peerjs.com', 'https://0.peerjs.com', 'wss://*.peerjs.com'],
      frameSrc:      ["'none'"],
      objectSrc:     ["'none'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin(origin, cb) {
    /* In dev, allow all origins (covers tunnels, mobile on local network, etc.) */
    if (process.env.NODE_ENV !== 'production') return cb(null, true);
    /* In production, no-origin requests are denied; listed origins are allowed */
    if (!origin) return cb(null, false);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(globalLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth',       authRoutes);
app.use('/api/broker',     brokerRouter);
app.use('/api/dispatcher', dispatcherRoutes);
app.use('/api/driver',     driverRoutes);
app.use('/api',            tripRoutes);

/* Generic error handler — never leak stack traces in production */
app.use((err, _req, res, _next) => {
  if (err.message?.startsWith('CORS:')) return res.status(403).json({ error: 'Forbidden' });
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = { app };
