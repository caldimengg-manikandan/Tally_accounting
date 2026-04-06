const { User, Company } = require('../../models');
const bcrypt = require('bcryptjs');
const AuditService = require('../../services/AuditService');

// Get all users in the active company (ADMIN only)
exports.getCompanyUsers = async (req, res) => {
  try {
    const company = await Company.findByPk(req.companyId, {
      include: [{
        model: User,
        through: { attributes: [] },
        attributes: ['id', 'name', 'email', 'role', 'activeCompanyId', 'createdAt']
      }]
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    res.json({ users: company.Users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Invite/add a user to the active company (ADMIN only)
exports.inviteUser = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    const VALID_ROLES = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    let user = await User.findOne({ where: { email } });

    if (user) {
      // User already exists — link them to this company
      await user.addCompany(req.companyId);

      await AuditService.log({
        action: 'ADD_EXISTING_USER_TO_COMPANY',
        tableName: 'UserCompanies',
        recordId: user.id,
        newData: { email: user.email, companyId: req.companyId },
        companyId: req.companyId,
        userId: req.user?.id,
        req
      });

      return res.status(200).json({ message: 'Existing user added to company', user: { id: user.id, email: user.email } });
    }

    // New user — create and attach to company
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      email,
      name,
      password: hashedPassword,
      role: role || 'VIEWER',
      activeCompanyId: req.companyId
    });

    const company = await Company.findByPk(req.companyId);
    if (company) await company.addUser(user);

    await AuditService.log({
      action: 'INVITE_NEW_USER',
      tableName: 'Users',
      recordId: user.id,
      newData: { email: user.email, role: user.role, companyId: req.companyId },
      companyId: req.companyId,
      userId: req.user?.id,
      req
    });

    res.status(201).json({
      message: 'User created and added to company',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: err.message });
  }
};

// Update the role of a user within the active company (ADMIN only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const VALID_ROLES = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER'];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify user belongs to the requesting company
    const company = await Company.findByPk(req.companyId, {
      include: [{ model: User, where: { id: user.id }, through: { attributes: [] } }]
    });
    if (!company || company.Users.length === 0) {
      return res.status(403).json({ error: 'User does not belong to your company' });
    }

    const oldData = { id: user.id, role: user.role };
    user.role = role;
    await user.save();

    await AuditService.log({
      action: 'UPDATE_USER_ROLE',
      tableName: 'Users',
      recordId: user.id,
      oldData,
      newData: { id: user.id, role: user.role },
      companyId: req.companyId,
      userId: req.user?.id,
      req
    });

    res.json({ message: 'User role updated', user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Remove a user from the active company (ADMIN only)
exports.removeUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const company = await Company.findByPk(req.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    await company.removeUser(user);

    // Clear their activeCompanyId if it was this company
    if (user.activeCompanyId === req.companyId) {
      user.activeCompanyId = null;
      await user.save();
    }

    await AuditService.log({
      action: 'REMOVE_USER_FROM_COMPANY',
      tableName: 'Users',
      recordId: user.id,
      companyId: req.companyId,
      userId: req.user?.id,
      req
    });

    res.json({ message: 'User removed from company' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
