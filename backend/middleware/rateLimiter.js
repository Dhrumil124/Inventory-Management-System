const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../config/env');
const { errorResponse } = require('../utils/responseFormatter');

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      'Too many login attempts from this IP. Please try again after 15 minutes.',
      429
    );
  }
});

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.windowMs,
  max: RATE_LIMIT.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return errorResponse(
      res,
      'Too many requests to the API. Please slow down.',
      429
    );
  }
});

module.exports = {
  authLimiter,
  apiLimiter
};
