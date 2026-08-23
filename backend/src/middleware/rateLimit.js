const rateLimit = require('express-rate-limit');

// Slows down credential-stuffing/brute-force attempts against login.
// Keyed by IP (express-rate-limit's default), not by the submitted email,
// so it can't be used to lock another user's account out.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

module.exports = { loginRateLimiter };
