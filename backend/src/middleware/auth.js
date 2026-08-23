const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/** Verifies the Bearer JWT and attaches { id, role, email, name } to req.user. */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { id, role, email, name }
    next();
  } catch (err) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

/** Use after requireAuth. Restricts a route to one or more roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new ApiError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
