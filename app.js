require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const authRoutes   = require('./routes/auth');
const tripRoutes   = require('./routes/trip');
const { globalLimiter } = require('./middleware/rateLimit');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api',      tripRoutes);

module.exports = { app };
