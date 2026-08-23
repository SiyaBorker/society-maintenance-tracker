const ApiError = require('../utils/ApiError');
const multer = require('multer');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, details: err.details });
  }

  // Prisma unique constraint violation, e.g. duplicate email on register.
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists`,
    });
  }

  // Prisma "record not found" on update/delete.
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  console.error('[unhandled error]', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: `No route: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFoundHandler };
