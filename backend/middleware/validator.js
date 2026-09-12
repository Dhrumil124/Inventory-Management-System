const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseFormatter');

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));
    return errorResponse(res, 'Validation failed for submitted data.', 400, formattedErrors);
  }
  next();
}

module.exports = validateRequest;
