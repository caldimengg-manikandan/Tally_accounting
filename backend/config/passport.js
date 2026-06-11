const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * GOOGLE OAUTH STRATEGY
 * Used for production login handling via the redirect-based OAuth flow.
 * Note: 'proxy: true' is essential for hosting on platforms like Render or Vercel
 * to ensure that https is correctly forwarded during the callback redirect.
 *
 * Phase 1 changes:
 *  - Replaced hardcoded 'GOOGLE_OAUTH_DUMMY_PWD' with crypto.randomBytes(32)
 *  - New users are created with oauthOnly: true, which blocks password login
 */
passport.use(new GoogleStrategy({
  clientID: process.env.Client_ID,
  clientSecret: process.env.Client_secret,
  callbackURL: process.env.REDIRECT_URI,
  proxy: true // Crucial for Render/Vercel to handle https successfully
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      if (!profile.emails || profile.emails.length === 0) {
        return done(new Error('No email associated with this Google account.'), null);
      }

      const email = profile.emails[0].value;
      console.log(`[Google Auth] Attempting login/sign-up for: ${email}`);

      let user = await User.findOne({ where: { email } });
      console.log(`[Google Auth] User record from DB:`, user ? 'Found' : 'Not Found');

      if (!user) {
        console.log(`[Google Auth] Creating new user record for: ${email}`);
        // Phase 1: cryptographically random password — not guessable or brute-forceable
        const randomPassword = crypto.randomBytes(32).toString('hex');
        user = await User.create({
          email,
          name: profile.displayName,
          password: await bcrypt.hash(randomPassword, 10),
          oauthOnly: true // Blocks future password-based login attempts for this account
        });
      }

      return done(null, user);
    } catch (err) {
      console.error('[Google Auth Error]', err);
      return done(err, null);
    }
  }
));