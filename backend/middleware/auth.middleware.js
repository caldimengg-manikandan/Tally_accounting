const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');

// 1. verifyToken -> validates JWT and attaches user info to request
exports.verifyToken = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // We fetch the latest user to ensure they still exist and might fetch updated role
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Not authorized, user no longer exists' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    // Distinguish JWT errors from unexpected server errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
      return res.status(401).json({ error: 'Not authorized, invalid or expired token. Please log in again.' });
    }
    console.error('[verifyToken] Unexpected error:', err.message);
    res.status(500).json({ error: 'Server error during authentication' });
  }
};

// 2. authorizeRoles(...roles) -> restricts access based on user role
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not attached to request' });
    }

    // SUPER_ADMIN has access to everything
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Role (${req.user.role}) is not allowed to access this resource.` 
      });
    }
    
    next();
  };
};

// 3. tenantAccess -> ensures user can only access data belonging to their activeCompanyId
exports.tenantAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not attached to request' });
  }

  // SUPER_ADMIN can bypass tenant bounds if they need global access, 
  // but if they supply a company ID we respect it.
  if (req.user.role === 'SUPER_ADMIN' && !req.user.activeCompanyId) {
    // Optionally: require them to use a specific header, or allow them to fetch all data.
    // We let them pass but without a strict req.companyId, so queries must handle this
    return next();
  }

  if (!req.user.activeCompanyId) {
    return res.status(403).json({ error: 'Please switch to an active company first.' });
  }

  // Ensure they actually belong to this company (double check against DB if we want stringent security)
  // But the logic for selecting an activeCompanyId should already ensure they belong to it.

  req.companyId = req.user.activeCompanyId;
  next();
};
