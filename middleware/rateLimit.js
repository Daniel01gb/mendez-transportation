const rateLimit = require('express-rate-limit');

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' }
});

const twoFaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { error: 'Too many verification attempts. Try again in 10 minutes.' }
});

/* Limits calls to backend proxy endpoints (/miles, /geocode) that make external HTTP requests */
const dispatcherProxyLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please slow down.' }
});

/* Limits broker trip submissions — prevents spam from shared portal URL */
const brokerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many submissions. Please try again in 15 minutes.' }
});

module.exports = { globalLimiter, loginLimiter, twoFaLimiter, dispatcherProxyLimiter, brokerLimiter };
