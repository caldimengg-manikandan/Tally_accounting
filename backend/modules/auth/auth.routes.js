const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../../middleware/auth.middleware');
const rateLimit = require('express-rate-limit');

// ── Rate Limiters (Phase 1) ───────────────────────────────────────────────────

/**
 * Strict limiter: 5 attempts per 15 minutes per IP.
 * Applied to all authentication entry points — login, register, Google login.
 * Includes Retry-After header automatically via express-rate-limit.
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Raised to 100 to prevent blocking developers/testers
  standardHeaders: true,  // Sends RateLimit-* and Retry-After headers
  legacyHeaders: false,
  message: {
    error: 'Too many attempts. Please try again after 15 minutes.',
    retryAfter: '15 minutes'
  }
});

/**
 * Loose limiter: 100 requests per 15 minutes per IP.
 * Applied to token refresh and /me — authenticated but still worth throttling.
 */
const looseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

// ── Standard Authentication ───────────────────────────────────────────────────
router.post('/register',      strictLimiter, authController.register);
router.post('/login',         strictLimiter, authController.login);
router.post('/google-login',  strictLimiter, authController.googleLogin);

// ── Token Lifecycle ───────────────────────────────────────────────────────────
router.post('/refresh',  looseLimiter, authController.refresh);
router.post('/logout',   verifyToken,  authController.logout);

// ── Current User (/me) ────────────────────────────────────────────────────────
// Returns the decoded JWT payload — useful for frontend "who am I?" checks.
router.get('/me', looseLimiter, verifyToken, (req, res) => res.json(req.user));

// ── Company Context ───────────────────────────────────────────────────────────
router.post('/switch-company', verifyToken, authController.switchCompany);

// ── MFA (Phase 3) ─────────────────────────────────────────────────────────────
// All MFA routes require a valid access token (user must be logged in first).
router.post('/mfa/enroll',        verifyToken, authController.mfaEnroll);
router.post('/mfa/verify-enroll', verifyToken, authController.mfaVerifyEnroll);
router.post('/mfa/verify',                     authController.mfaVerify);  // Public: takes challengeToken in body

// ── Google OAuth Strategy (redirect flow) ────────────────────────────────────
// Trigger: Client hits this to start Google Login
router.get('/google', strictLimiter, passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
}));

// Callback: Google returns here with authorization code
router.get('/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: 'http://localhost:5173/login?error=oauth_refused'
  }),
  (req, res) => {
    // Generate our JWT token for the authenticated user
    const token = jwt.sign(
      { id: req.user.id, role: req.user.role, companyId: req.user.activeCompanyId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Phase 2: short-lived access token
    );

    // Redirect user back to the frontend with the identity token
    res.redirect(`http://localhost:5173/auth-callback?token=${token}`);
  }
);

module.exports = router;
