const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * GOOGLE OAUTH STRATEGY
 * Used for production login handling.
 * Note: 'proxy: true' is essential for hosting on platforms like Render or Vercel
 * to ensure that https is correctly forwarded during the callback redirect.
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
        return done(new Error("No email associated with this Google account."), null);
      }

      const email = profile.emails[0].value;
      console.log(`[Google Auth] Attempting login/sign-up for: ${email}`);

      let user = await User.findOne({ where: { email } });
      console.log(`[Google Auth] User record from DB:`, user ? "Found" : "Not Found");

      if (!user) {
        console.log(`[Google Auth] Creating new user record for: ${email}`);
        user = await User.create({
          email,
          name: profile.displayName,
          // Since password is required in the DB, we hash a dummy string.
          password: await bcrypt.hash('GOOGLE_OAUTH_DUMMY_PWD', 10)
        });
      }

      return done(null, user);
    } catch (err) {
      console.error("[Google Auth Error]", err);
      return done(err, null);
    }
  }
));