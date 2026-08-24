const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

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

// Slows down comment spam. Runs after requireAuth, so it's keyed by the
// authenticated user rather than IP — one chatty account shouldn't cost
// everyone else behind the same NAT/office network their comment budget.
const commentRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req.ip),
  message: { error: 'Too many comments. Please slow down and try again shortly.' },
});

module.exports = { loginRateLimiter, commentRateLimiter };
