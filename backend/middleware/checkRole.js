const { errorResponse } = require('../utils/responseFormatter');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized. Please authenticate.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Access denied. Requires role: ${allowedRoles.join(' or ')}.`,
        403
      );
    }

    next();
  };
}

module.exports = requireRole;
