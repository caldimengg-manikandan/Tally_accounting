const { User, RefreshToken, MfaSecret, AuditLog } = require('../../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { Op } = require('sequelize');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.Client_ID);

// ── Constants ───────────────────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;          // Extra 3: lock after this many failures
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes


// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Hash a plain-text refresh token before storing in DB.
 * We store the hash, send the raw value to the client.
 */
const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

/**
 * Issue a short-lived access JWT (15 minutes).
 */
const signAccessToken = (user, companyId) =>
  jwt.sign(
    { id: user.id, role: user.role, companyId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

/**
 * Create a refresh token row in DB, return raw token for cookie.
 * The raw token is a 48-byte hex string — never stored plain.
 */
const issueRefreshToken = async (userId) => {
  const rawToken = crypto.randomBytes(48).toString('hex');
  const hashed = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await RefreshToken.create({ token: hashed, UserId: userId, expiresAt, used: false });
  return rawToken;
};

/**
 * Set the refresh token cookie on the response.
 */
const setRefreshCookie = (res, rawToken) => {
  res.cookie('refreshToken', rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * Validate password complexity.
 * Returns an array of unmet criteria strings (empty = valid).
 */
const validatePasswordComplexity = (password) => {
  const issues = [];
  if (!password || password.length < 8) {
    issues.push('At least 8 characters');
  }
  if (!/[a-z]/.test(password)) {
    issues.push('At least one lowercase letter');
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('At least one uppercase letter');
  }
  if (!/[0-9]/.test(password)) {
    issues.push('At least one numeric digit');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    issues.push('At least one special character (e.g. !@#$%^&*)');
  }
  return issues;
};

/**
 * Extra 2: Write an auth event to the AuditLog table.
 * Never throws — audit failure must never block the auth flow.
 *
 * @param {string} action  - e.g. 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'ACCOUNT_LOCKED'
 * @param {object} opts    - { userId, email, ip, userAgent, detail }
 */
const logAuthEvent = async (action, { userId = null, email = null, ip = null, userAgent = null, detail = null } = {}) => {
  try {
    await AuditLog.create({
      action,
      tableName: 'Users',
      recordId: userId,
      newData: JSON.stringify({ email, detail }),
      ipAddress: ip,
      userAgent,
      UserId: userId
    });
  } catch (e) {
    // Intentionally silent — audit log failure must not break login
    console.error('[AuditLog] Failed to write auth event:', action, e.message);
  }
};


// ── Register ──────────────────────────────────────────────────────────────────

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Phase 2: password complexity gate
    const complexityIssues = validatePasswordComplexity(password);
    if (complexityIssues.length > 0) {
      return res.status(400).json({
        error: 'Password does not meet requirements.',
        issues: complexityIssues
      });
    }

    // Prevent generic Sequelize validation error leaking to client
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered. Please sign in.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashedPassword,
      name: name || undefined,
      role: 'ADMIN', // Strictly enforce ADMIN role for new registrations to prevent SUPER_ADMIN bypass
      oauthOnly: false
    });

    res.status(201).json({
      message: 'User created',
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: err.errors[0].message });
    }
    res.status(500).json({ error: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
//
// Phase 0: Auto-register block REMOVED. Unknown email → 401 immediately.
// Phase 1: oauthOnly check before bcrypt — no timing-attack leak.
// Phase 2: Issues short 15-min JWT + sets httpOnly refresh token cookie.
// Phase 3: If user has verified MFA, issue a short-lived challenge token
//           instead of a real JWT and return 202. ADMIN/SUPER_ADMIN without
//           MFA enrolled get a 7-day grace period warning.

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { Company } = require('../../models');
    const ip = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    const user = await User.findOne({
      where: { email },
      include: [{ model: Company, through: { attributes: [] } }]
    });

    // Phase 0: unknown email → 401. No auto-register, no user creation.
    if (!user) {
      await logAuthEvent('LOGIN_FAIL', { email, ip, userAgent, detail: 'Email not found' });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Phase 1: block password login for OAuth-only accounts
    if (user.oauthOnly) {
      await logAuthEvent('LOGIN_FAIL', { userId: user.id, email, ip, userAgent, detail: 'oauthOnly account attempted password login' });
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please log in with Google.' });
    }

    // Extra 3: check account lockout BEFORE running bcrypt (saves CPU on brute-force)
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      const minutesLeft = Math.ceil((user.lockedUntil - new Date()) / 60000);
      await logAuthEvent('LOGIN_FAIL', { userId: user.id, email, ip, userAgent, detail: 'Account locked' });
      return res.status(423).json({
        error: `Account is temporarily locked. Try again in ${minutesLeft} minute(s).`
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Extra 3: increment failure counter, lock if threshold reached
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;
      await user.update({
        failedLoginAttempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null
      });

      if (shouldLock) {
        await logAuthEvent('ACCOUNT_LOCKED', { userId: user.id, email, ip, userAgent, detail: `Locked after ${newAttempts} failed attempts` });
        return res.status(423).json({ error: 'Too many failed attempts. Account locked for 5 minutes.' });
      }

      await logAuthEvent('LOGIN_FAIL', { userId: user.id, email, ip, userAgent, detail: `Wrong password (attempt ${newAttempts})` });
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Success — reset lockout counters
    await user.update({ failedLoginAttempts: 0, lockedUntil: null });

    // Phase 3: MFA check
    const mfaRecord = await MfaSecret.findOne({ where: { userId: user.id, verified: true } });
    const isPrivileged = ['ADMIN', 'SUPER_ADMIN'].includes(user.role);

    if (isPrivileged && !mfaRecord) {
      const mfaGraceWarning = {
        mfaWarning: true,
        message: 'MFA is required for your role. Please enroll within 7 days.'
      };
      await logAuthEvent('LOGIN_SUCCESS', { userId: user.id, email, ip, userAgent, detail: 'MFA grace period' });
      return await _issueTokens(req, res, user, mfaGraceWarning);
    }

    if (mfaRecord) {
      const challengeToken = jwt.sign(
        { id: user.id, mfaChallenge: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      await logAuthEvent('LOGIN_MFA_CHALLENGE', { userId: user.id, email, ip, userAgent });
      return res.status(202).json({
        mfaRequired: true,
        challengeToken,
        message: 'MFA verification required. POST your TOTP code to /api/auth/mfa/verify.'
      });
    }

    await logAuthEvent('LOGIN_SUCCESS', { userId: user.id, email, ip, userAgent });
    return await _issueTokens(req, res, user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ── Shared token issuance helper (login + MFA verify) ─────────────────────────

async function _issueTokens(req, res, user, extraFields = {}) {
  const { Company } = require('../../models');

  // Re-fetch companies if not already attached
  let userCompanies = user.Companies;
  if (!userCompanies) {
    const freshUser = await User.findOne({
      where: { id: user.id },
      include: [{ model: Company, through: { attributes: [] } }]
    });
    userCompanies = freshUser.Companies || [];
  }

  let activeCoId = user.activeCompanyId;
  if (!activeCoId && userCompanies.length === 1) {
    activeCoId = userCompanies[0].id;
    user.activeCompanyId = activeCoId;
    await user.save();
  }

  // Phase 2: short-lived access token + rotating refresh token
  const accessToken = signAccessToken(user, activeCoId);
  const rawRefreshToken = await issueRefreshToken(user.id);
  setRefreshCookie(res, rawRefreshToken);

  res.json({
    token: accessToken,
    user: { id: user.id, email: user.email, name: user.name, role: user.role, activeCompanyId: activeCoId },
    companies: userCompanies,
    ...extraFields
  });
}

// ── Refresh Token Rotation ────────────────────────────────────────────────────
//
// Client sends the httpOnly cookie automatically.
// We: hash it → look up → validate → invalidate old → issue new pair.

exports.refresh = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    const ip = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    if (!rawToken) {
      return res.status(401).json({ error: 'No refresh token provided.' });
    }

    const hashed = hashToken(rawToken);
    const tokenRow = await RefreshToken.findOne({ where: { token: hashed } });

    if (!tokenRow) {
      return res.status(401).json({ error: 'Invalid refresh token.' });
    }

    if (tokenRow.used) {
      // Possible token theft — invalidate all sessions for this user
      await RefreshToken.destroy({ where: { UserId: tokenRow.UserId } });
      await logAuthEvent('REFRESH_TOKEN_REUSE', { userId: tokenRow.UserId, ip, userAgent, detail: 'All sessions invalidated due to token reuse' });
      return res.status(401).json({ error: 'Refresh token already used. All sessions invalidated.' });
    }

    if (new Date() > tokenRow.expiresAt) {
      await tokenRow.destroy();
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.' });
    }

    // Mark old token as used (rotation)
    tokenRow.used = true;
    await tokenRow.save();

    const user = await User.findByPk(tokenRow.UserId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const accessToken = signAccessToken(user, user.activeCompanyId);
    const rawNew = await issueRefreshToken(user.id);
    setRefreshCookie(res, rawNew);

    await logAuthEvent('TOKEN_REFRESHED', { userId: user.id, ip, userAgent });
    res.json({
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, activeCompanyId: user.activeCompanyId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ── Logout ────────────────────────────────────────────────────────────────────

exports.logout = async (req, res) => {
  try {
    const rawToken = req.cookies?.refreshToken;
    const ip = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    if (rawToken) {
      const hashed = hashToken(rawToken);
      await RefreshToken.destroy({ where: { token: hashed } });
    }
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    await logAuthEvent('LOGOUT', { userId: req.user?.id, ip, userAgent });
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ── Switch Company ────────────────────────────────────────────────────────────

exports.switchCompany = async (req, res) => {
  try {
    const { companyId } = req.body;
    const { Company } = require('../../models');

    const user = await User.findByPk(req.user.id, {
      include: [{ model: Company, through: { attributes: [] } }]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'SUPER_ADMIN') {
      const belongsToCompany = user.Companies && user.Companies.some(c => c.id === companyId);
      if (!belongsToCompany) {
        return res.status(403).json({ error: 'Access denied to this company' });
      }
    }

    user.activeCompanyId = companyId;
    await user.save();

    // Re-issue tokens with new companyId embedded
    const accessToken = signAccessToken(user, companyId);
    const rawNew = await issueRefreshToken(user.id);
    setRefreshCookie(res, rawNew);

    res.json({
      message: 'Company switched successfully',
      token: accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, activeCompanyId: user.activeCompanyId }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Google Login (credential-based — frontend Google Sign-In button) ──────────
//
// Phase 1: random 32-byte password instead of Math.random(), oauthOnly: true.

exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.Client_ID,
    });

    const payload = ticket.getPayload();
    const { email, name } = payload;

    const { Company } = require('../../models');
    let user = await User.findOne({
      where: { email },
      include: [{ model: Company, through: { attributes: [] } }]
    });

    if (!user) {
      // Phase 1: cryptographically random password, not guessable via Math.random()
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = await User.create({
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'ADMIN',
        oauthOnly: true // Phase 1: block password login for this account
      });
      user = await User.findOne({
        where: { id: user.id },
        include: [{ model: Company, through: { attributes: [] } }]
      });
    }

    return await _issueTokens(req, res, user);
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(500).json({ error: 'Google Authentication Failed' });
  }
};

// ── MFA — Enroll (Phase 3) ────────────────────────────────────────────────────
//
// POST /api/auth/mfa/enroll — protected route (requires valid JWT)
// Returns a TOTP secret + QR code URI for the authenticator app.
// The secret is NOT verified yet — call /mfa/verify-enroll to confirm.

exports.mfaEnroll = async (req, res) => {
  try {
    const userId = req.user.id;

    // Destroy any unverified leftover enrollment attempt
    await MfaSecret.destroy({ where: { userId, verified: false } });

    const secret = speakeasy.generateSecret({
      name: `TallyApp (${req.user.email || userId})`
    });

    await MfaSecret.create({
      userId,
      secret: secret.base32, // In production: encrypt at rest before storing
      verified: false
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      message: 'Scan the QR code with your authenticator app, then POST your TOTP code to /api/auth/mfa/verify-enroll.',
      secret: secret.base32, // Return for manual entry (no scanner)
      qrCode: qrCodeDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── MFA — Confirm Enrollment (Phase 3) ───────────────────────────────────────
//
// POST /api/auth/mfa/verify-enroll — protected route
// Body: { token: "123456" }

exports.mfaVerifyEnroll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    const mfaRecord = await MfaSecret.findOne({ where: { userId, verified: false } });
    if (!mfaRecord) {
      return res.status(404).json({ error: 'No pending MFA enrollment found. Call /mfa/enroll first.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: mfaRecord.secret,
      encoding: 'base32',
      token,
      window: 1 // Allow 1 step of clock skew
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid TOTP code. Check your authenticator app and try again.' });
    }

    mfaRecord.verified = true;
    await mfaRecord.save();

    res.json({ message: 'MFA successfully enrolled and verified.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── MFA — Verify at Login (Phase 3) ──────────────────────────────────────────
//
// POST /api/auth/mfa/verify
// Body: { challengeToken: "...", token: "123456" }
// Called after login returns 202 mfaRequired.

exports.mfaVerify = async (req, res) => {
  try {
    const { challengeToken, token } = req.body;
    const ip = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    let payload;
    try {
      payload = jwt.verify(challengeToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Challenge token invalid or expired. Please log in again.' });
    }

    if (!payload.mfaChallenge) {
      return res.status(401).json({ error: 'Invalid challenge token.' });
    }

    const userId = payload.id;
    const mfaRecord = await MfaSecret.findOne({ where: { userId, verified: true } });
    if (!mfaRecord) {
      return res.status(404).json({ error: 'MFA not enrolled for this account.' });
    }

    const isValid = speakeasy.totp.verify({
      secret: mfaRecord.secret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!isValid) {
      await logAuthEvent('MFA_FAIL', { userId, ip, userAgent, detail: 'Invalid TOTP code at login' });
      return res.status(401).json({ error: 'Invalid TOTP code.' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await logAuthEvent('LOGIN_SUCCESS', { userId, email: user.email, ip, userAgent, detail: 'MFA verified' });
    return await _issueTokens(req, res, user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

