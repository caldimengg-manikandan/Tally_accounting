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

/**
 * POST /api/auth/oauth-token-exchange
 * Called by the /auth-callback frontend page after the OAuth redirect.
 * The backend set an httpOnly 'oauthAccessToken' cookie with a 2-minute TTL.
 * This endpoint validates that cookie, issues a proper refresh token cookie,
 * and returns the access token + user data as JSON for sessionStorage.
 * The one-time oauthAccessToken cookie is cleared after exchange.
 */
router.post('/oauth-token-exchange', looseLimiter, authController.oauthTokenExchange);

// ── Current User (/me) ────────────────────────────────────────────────────────
// Returns the full user payload + companies
router.get('/me', looseLimiter, verifyToken, authController.me);

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
    failureRedirect: `${process.env.CLIENT_URL || 'http://127.0.0.1:5173'}/login?error=oauth_refused`
  }),
  (req, res) => {
    const CLIENT_URL = process.env.CLIENT_URL || 'http://127.0.0.1:5173';
    try {
      // 🔐 SECURITY: Never put JWT in the URL (visible in browser history, server logs, referrer headers)
      const accessToken = jwt.sign(
        { id: req.user.id, role: req.user.role, companyId: req.user.activeCompanyId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Store access token in a short-lived httpOnly cookie for the redirect handshake
      res.cookie('oauthAccessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // 'lax' required for cross-site redirect flows
        maxAge: 2 * 60 * 1000, // 2 minutes — frontend must exchange immediately
        path: '/'
      });

      // Redirect without token in URL
      res.redirect(`${CLIENT_URL}/auth-callback`);
    } catch (err) {
      console.error('[OAuth Callback Error]', err.message);
      res.redirect(`${CLIENT_URL}/login?error=auth_failed`);
    }
  }
);

module.exports = router;
