const permissions = require('../config/permissions.json');

const rbacMiddleware = (module, action) => {
  return (req, res, next) => {
    try {
      const userRole = req.user.role;

      if (!permissions[module]) {
        return res.status(500).json({
          success: false,
          message: `Module '${module}' not found in permissions.`
        });
      }

      if (!permissions[module][userRole]) {
        return res.status(403).json({
          success: false,
          message: `Role '${userRole}' not configured for '${module}'.`
        });
      }

      const isAllowed = permissions[module][userRole][action];

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Role '${userRole}' cannot '${action}' in '${module}'.`
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions.'
      });
    }
  };
};

module.exports = rbacMiddleware;