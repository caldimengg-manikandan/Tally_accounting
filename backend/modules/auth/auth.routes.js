const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../../middleware/auth.middleware');

// ── Standard Authentication ──
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/switch-company', verifyToken, authController.switchCompany);

// ── Google OAuth Strategy ──
// Trigger: Client hits this to start Google Login
router.get('/google', passport.authenticate('google', { 
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
      { expiresIn: '1d' }
    );
    
    // Redirect user back to the frontend with the identity token
    res.redirect(`http://localhost:5173/auth-callback?token=${token}`);
  }
);

module.exports = router;
