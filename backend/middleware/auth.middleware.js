const jwt = require('jsonwebtoken');

// 1. verifyToken -> check for Bearer <token> in headers
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Failed to authenticate token' });
    }
    req.user = decoded; // Contains id, role, companyId (activeCompanyId)
    next();
  });
};

// 2. authorizeRoles -> check if req.user.role is in the allowed list
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permission denied: Insufficient role' });
    }
    next();
  };
};

// 3. tenantAccess -> ensures user can only access data belonging to their activeCompanyId
exports.tenantAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not attached to request' });
  }

  // Safely extract companyId
  const paramCompanyId = (req.params && req.params.companyId) || 
                         (req.body && req.body.companyId) || 
                         (req.query && req.query.companyId) ||
                         req.headers['x-company-id'];
                         
  const userActiveCompanyId = req.user.activeCompanyId || req.user.companyId;

  if (!userActiveCompanyId && !paramCompanyId) {
    return res.status(403).json({ error: 'Please switch to an active company first.' });
  }

  const companyIdToCheck = paramCompanyId || userActiveCompanyId;
  const { Company } = require('../models');
  
  try {
    const companyInstance = await Company.findOne({
      where: { id: companyIdToCheck, userId: req.user.id }
    });
    if (!companyInstance) {
      return res.status(403).json({ error: 'Access denied: You do not own this company' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  req.companyId = companyIdToCheck;
  next();
};
