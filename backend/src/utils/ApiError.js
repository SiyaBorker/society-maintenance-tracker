// Small typed error so controllers can `throw new ApiError(404, 'Not found')`
// and the central error handler knows what HTTP status to send.
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

module.exports = ApiError;
