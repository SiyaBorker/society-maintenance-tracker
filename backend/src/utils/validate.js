const { validationResult } = require('express-validator');
const ApiError = require('./ApiError');

/** Run after an array of express-validator checks to reject with 400 on failure. */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ApiError(400, 'Validation failed', errors.array()));
  }
  next();
}

module.exports = validate;
