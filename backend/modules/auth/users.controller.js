const { User, Company, UserCompany } = require('../../models');
const bcrypt = require('bcryptjs');
const AuditService = require('../../services/AuditService');
const MailService = require('../../services/MailService');

// Get all users in the active company (ADMIN only)
exports.getCompanyUsers = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.companyId, {
      include: [{
        model: User,
        through: { model: UserCompany, attributes: ['role', 'customRoleId'] },
        attributes: ['id', 'name', 'email', 'role', 'activeCompanyId', 'createdAt']
      }]
    });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const users = company.Users.map(u => {
      const raw = u.get({ plain: true });
      raw.role = (raw.UserCompany && raw.UserCompany.role) || raw.role || 'VIEWER';
      raw.customRoleId = raw.UserCompany && raw.UserCompany.customRoleId;
      return raw;
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

// Invite/add a user to the active company (ADMIN only)
exports.inviteUser = async (req, res, next) => {
  try {
    const { email, name, password, role, customRoleId } = req.body;

    const VALID_ROLES = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'];
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    let user = await User.findOne({ where: { email } });

    const company = await Company.findByPk(req.companyId);

    if (user) {
      // User already exists — link them to this company with specified role
      await UserCompany.upsert({
        userId: user.id,
        companyId: req.companyId,
        role: role || 'VIEWER',
        customRoleId: customRoleId || null
      });

      // Update name and role if provided during the re-invite
      let updated = false;
      if (name && user.name !== name) {
        user.name = name;
        updated = true;
      }
      if (role && user.role !== role) {
        user.role = role;
        updated = true;
      }
      if (updated) {
        await user.save();
      }

      await AuditService.log({
        action: 'ADD_EXISTING_USER_TO_COMPANY',
        tableName: 'UserCompanies',
        recordId: user.id,
        newData: { email: user.email, companyId: req.companyId, role: role || 'VIEWER' },
        companyId: req.companyId,
        userId: req.user?.id,
        req
      });

      // Send email to notify the existing user they were added to a new workspace
      const company = await Company.findByPk(req.companyId);
      const companyName = company?.name || 'our organization';
      MailService.sendMail({
        to: user.email,
        subject: `You have been added to ${companyName} on CalTally`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #2563eb; margin-top: 0;">Workspace Invitation</h2>
            <p>Hi <strong>${user.name || 'User'}</strong>,</p>
            <p>You have been granted access to the <strong>${companyName}</strong> workspace on the CalTally ERP platform with the role of <strong>${user.role}</strong>.</p>
            <p>Since you already have a CalTally account, simply log in with your existing password. You will now be able to switch to this new workspace from your dashboard.</p>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; margin: 15px 0;">Log In to CalTally</a>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="margin-bottom: 0; font-size: 12px; color: #64748b;">Regards,<br><strong>CalTally Operations Team</strong></p>
          </div>
        `
      }).catch(mailErr => console.error('✉️ Failed to send workspace addition email:', mailErr));

      return res.status(200).json({ message: 'Existing user added to company', user: { id: user.id, email: user.email } });
    }

    // New user — create and attach to company
    const crypto = require('crypto');
    const userPassword = password || crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    user = await User.create({
      email,
      name,
      password: hashedPassword,
      role: role || 'VIEWER',
      activeCompanyId: req.companyId
    });

    if (company) {
      await UserCompany.create({
        userId: user.id,
        companyId: req.companyId,
        role: role || 'VIEWER',
        customRoleId: customRoleId || null
      });
    }

    await AuditService.log({
      action: 'INVITE_NEW_USER',
      tableName: 'Users',
      recordId: user.id,
      newData: { email: user.email, role: role || 'VIEWER', companyId: req.companyId },
      companyId: req.companyId,
      userId: req.user?.id,
      req
    });

    // Send email invitation asynchronously
    const companyName = company?.name || 'our organization';
    MailService.sendMail({
      to: email,
      subject: `Invitation to join ${companyName} on CalTally`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-top: 0;">Welcome to CalTally ERP!</h2>
          <p>Hi <strong>${name}</strong>,</p>
          <p>You have been invited by the Administrator to join <strong>${companyName}</strong> on the CalTally ERP platform with the role of <strong>${role || 'Viewer'}</strong>.</p>
          <p>Here are your login credentials:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
              <li><strong>Login URL:</strong> <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/login" style="color: #2563eb; text-decoration: none;">http://localhost:5173/login</a></li>
              <li><strong>Username/Email:</strong> <span style="font-family: monospace;">${email}</span></li>
              <li><strong>Temporary Password:</strong> <span style="font-family: monospace; font-weight: bold; background-color: #cbd5e1; padding: 2px 6px; border-radius: 4px;">${userPassword}</span></li>
            </ul>
          </div>
          <p style="color: #64748b; font-size: 12px; line-height: 1.5;">For security reasons, please log in and change your password in the "My Profile & Security" settings tab immediately upon your first login.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="margin-bottom: 0;">Regards,<br><strong>CalTally Operations Team</strong></p>
        </div>
      `
    }).catch(mailErr => console.error('✉️ Failed to send onboarding email:', mailErr));

    res.status(201).json({
      message: 'User created and added to company. Onboarding invitation email sent.',
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    next(err);
  }
};

// Update the role of a user within the active company (ADMIN only)
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role, customRoleId } = req.body;
    const VALID_ROLES = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'AUDITOR', 'VIEWER', 'EMPLOYEE'];
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const user = await User.findByPk(req.params.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Verify user belongs to the requesting company and update role in junction table
    const userCompanyRel = await UserCompany.findOne({
      where: { userId: user.id, companyId: req.companyId }
    });
    if (!userCompanyRel) {
      return res.status(403).json({ error: 'User does not belong to your company' });
    }

    const oldData = { id: user.id, role: userCompanyRel.role, customRoleId: userCompanyRel.customRoleId };
    if (role) userCompanyRel.role = role;
    userCompanyRel.customRoleId = customRoleId || null;
    await userCompanyRel.save();

    await AuditService.log({
      action: 'UPDATE_USER_ROLE',
      tableName: 'UserCompanies',
      recordId: `${user.id}-${req.companyId}`,
      oldData,
      newData: { id: user.id, role: userCompanyRel.role },
      companyId: req.companyId,
      userId: req.user?.id,
      req
    });

    res.json({ message: 'User role updated', user: { id: user.id, email: user.email, role: userCompanyRel.role } });
  } catch (err) {
    next(err);
  }
};

// Remove a user from the active company (ADMIN only)
exports.removeUser = async (req, res, next) => {
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
    next(err);
  }
};

// ─── Step 1: User requests an email change ───────────────────────────────────
// Authenticated route (any logged-in user can request for themselves)
exports.requestEmailChange = async (req, res, next) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ error: 'New email address is required.' });

    // Validate format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) return res.status(400).json({ error: 'Invalid email format.' });

    // Check it is not already taken
    const existing = await User.findOne({ where: { email: newEmail } });
    if (existing) return res.status(409).json({ error: 'This email is already registered to another account.' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Generate a secure token and 1-hour expiry
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.pendingEmail = newEmail;
    user.emailVerificationToken = token;
    user.emailVerificationExpiry = expiry;
    await user.save();

    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    const verifyLink = `${CLIENT_URL}/verify-email?token=${token}`;

    await MailService.sendMail({
      to: newEmail,
      subject: 'Verify your new email address – CalTally',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #2563eb; margin-top: 0;">Confirm Your New Email Address</h2>
          <p>Hi <strong>${user.name || 'User'}</strong>,</p>
          <p>A request was made to change the email address for your CalTally account to <strong>${newEmail}</strong>.</p>
          <p>Click the button below to confirm. This link expires in <strong>1 hour</strong>.</p>
          <a href="${verifyLink}" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:12px 24px; border-radius:8px; font-weight:bold; margin: 16px 0;">
            Confirm New Email
          </a>
          <p style="color:#64748b; font-size:12px;">If you did not request this change, you can safely ignore this email. Your current email address will remain unchanged.</p>
          <hr style="border:0; border-top:1px solid #e2e8f0; margin:20px 0;">
          <p style="margin-bottom:0;">Regards,<br><strong>CalTally Security Team</strong></p>
        </div>
      `
    });

    res.json({ message: `Verification link sent to ${newEmail}. Please check your inbox.` });
  } catch (err) {
    next(err);
  }
};

// ─── Step 2: User clicks the link in their email ──────────────────────────────
// Public route — no auth header needed (link is opened in browser)
exports.verifyEmailChange = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Token is required.' });

    const user = await User.findOne({ where: { emailVerificationToken: token } });
    if (!user) return res.status(404).json({ error: 'Invalid or expired verification link.' });

    // Check expiry
    if (!user.emailVerificationExpiry || new Date() > new Date(user.emailVerificationExpiry)) {
      return res.status(410).json({ error: 'This verification link has expired. Please request a new one.' });
    }

    // Commit the email change
    const oldEmail = user.email;
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    await AuditService.log({
      action: 'EMAIL_CHANGED',
      tableName: 'Users',
      recordId: user.id,
      oldData: { email: oldEmail },
      newData: { email: user.email },
      userId: user.id,
      req
    });

    // Redirect to login with a success message so the user re-authenticates with the new email
    const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${CLIENT_URL}/login?emailChanged=true`);
  } catch (err) {
    next(err);
  }
};
