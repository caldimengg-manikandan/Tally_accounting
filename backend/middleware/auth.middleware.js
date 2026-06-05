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
  
  // Basic validation to prevent SQL injection or null string bypassing
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (companyIdToCheck && !uuidRegex.test(companyIdToCheck)) {
    return res.status(400).json({ error: 'Invalid Company ID format.' });
  }

  const { Company, User } = require('../models');
  
  try {
    if (req.user.role === 'SUPER_ADMIN') {
      console.warn(`[SECURITY WARNING] User ${req.user.id} bypassed tenant access as SUPER_ADMIN for company ${companyIdToCheck}`);
      req.companyId = companyIdToCheck;
      return next();
    }

    const user = await User.findByPk(req.user.id, {
      include: [Company]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasAccess = user.Companies && user.Companies.some(c => c.id === companyIdToCheck);
    if (!hasAccess) {
      console.warn(`[SECURITY ALERT] User ${req.user.id} (${user.email || 'Unknown'}) attempted to access data for unauthorized company: ${companyIdToCheck}`);
      return res.status(403).json({ error: 'Access denied: You do not have access to this company' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  req.companyId = companyIdToCheck;
  next();
};

// 4. trackModifiers -> automatically inject CreatedBy/ModifiedBy
exports.trackModifiers = (req, res, next) => {
  if (req.user && req.user.id) {
    if (req.method === 'POST') {
      req.body.CreatedBy = req.user.id;
      req.body.ModifiedBy = req.user.id;
    } else if (['PUT', 'PATCH'].includes(req.method)) {
      req.body.ModifiedBy = req.user.id;
    }
  }
  next();
};

// 5. guardLockedVoucher -> block EMPLOYEE from editing/deleting approved vouchers or other peoples vouchers
exports.guardLockedVoucher = async (req, res, next) => {
  if (!req.user || req.user.role !== 'EMPLOYEE') return next();

  const voucherId = req.params.id;
  if (!voucherId) return next();

  try {
    const { Voucher } = require('../models');
    const voucher = await Voucher.findByPk(voucherId);
    if (!voucher) return res.status(404).json({ error: 'Voucher not found' });

    if (voucher.status === 'Approved' || voucher.status === 'locked' || voucher.status === 'approved') {
      return res.status(403).json({ error: 'Cannot modify or delete an approved/locked voucher.' });
    }

    if (voucher.CreatedBy && voucher.CreatedBy !== req.user.id && voucher.UserId !== req.user.id) {
      return res.status(403).json({ error: 'You can only edit your own unapproved vouchers.' });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
