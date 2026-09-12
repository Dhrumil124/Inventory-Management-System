const { errorResponse } = require('../utils/responseFormatter');

function errorHandler(err, req, res, next) {
  // Log internal server errors with timestamp for debugging
  console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.originalUrl}:`, err);

  // Handle specific MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(
      res,
      'A record with these unique details already exists.',
      409
    );
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return errorResponse(
      res,
      'Referenced entity does not exist.',
      400
    );
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return errorResponse(
      res,
      'Cannot perform operation because dependent historical records exist.',
      400
    );
  }

  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    return errorResponse(
      res,
      'Operation violates database data integrity constraint (e.g. quantity cannot be negative).',
      400
    );
  }

  // Handle JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 'Malformed JSON payload.', 400);
  }

  // Fallback generic 500 error — never leak internal details or stack traces
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' 
      ? 'An unexpected internal server error occurred.' 
      : err.message || 'Internal server error',
    err.statusCode || 500
  );
}

module.exports = errorHandler;
