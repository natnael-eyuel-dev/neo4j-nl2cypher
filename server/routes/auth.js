const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { protect, generateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // check if user already exists
    let user = await User.findByGoogleId(profile.id);
    
    if (user) {
      // update last login
      await user.updateLastLogin();
      return done(null, user);
    }
    
    // create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      avatar: profile.photos[0]?.value || null
    });
    
    await user.save();
    return done(null, user);
  } catch (error) {
    console.error('❌ Google OAuth user creation failed:', error);
    return done(error, null);
  }
}));

// serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// google OAuth login
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false
}));

// google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/failure',
    session: false 
  }),
  async (req, res) => {
    try {
      if (!req.user) {
        return res.redirect('/auth/failure');
      }
      
      // generate JWT token
      const token = generateToken(req.user._id);
      
      // redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectUrl = `${frontendUrl}/auth/callback?token=${token}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Auth callback failed:', error);
      res.redirect('/auth/failure');
    }
  }
);

// auth failure
router.get('/failure', (req, res) => {
  res.status(401).json({
    success: false,
    error: 'Authentication failed'
  });
});

// get current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    
    res.json({
      success: true,
      data: user.profile
    });
  } catch (error) {
    console.error('❌ Get profile failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// update user preferences
router.put('/profile/preferences', protect, async (req, res) => {
  try {
    const { theme, defaultDatabase } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (theme && ['light', 'dark'].includes(theme)) {
      user.preferences.theme = theme;
    }
    
    if (defaultDatabase && ['movies', 'social', 'company'].includes(defaultDatabase)) {
      user.preferences.defaultDatabase = defaultDatabase;
    }
    
    await user.save();
    
    res.json({
      success: true,
      data: user.preferences,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('❌ Update preferences failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences'
    });
  }
});

// add custom database
router.post('/profile/databases', protect, async (req, res) => {
  try {
    const { name, uri, username, description } = req.body;
    
    if (!name || !uri) {
      return res.status(400).json({
        success: false,
        error: 'Name and URI are required'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // check if database with same name already exists
    const existingDB = user.customDatabases.find(db => db.name === name);
    if (existingDB) {
      return res.status(400).json({
        success: false,
        error: 'Database with this name already exists'
      });
    }
    
    await user.addCustomDatabase({
      name,
      uri,
      username,
      description
    });
    
    res.json({
      success: true,
      data: user.customDatabases,
      message: 'Custom database added successfully'
    });
  } catch (error) {
    console.error('❌ Add custom database failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add custom database'
    });
  }
});

// remove custom database
router.delete('/profile/databases/:databaseId', protect, async (req, res) => {
  try {
    const { databaseId } = req.params;
    
    const user = await User.findById(req.user._id);
    await user.removeCustomDatabase(databaseId);
    
    res.json({
      success: true,
      data: user.customDatabases,
      message: 'Custom database removed successfully'
    });
  } catch (error) {
    console.error('❌ Remove custom database failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove custom database'
    });
  }
});

// logout
router.post('/logout', protect, async (req, res) => {
  try {
    console.log(`👋 User ${req.user.email} logged out`);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('❌ Logout failed:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

// verify token validity
router.get('/verify', protect, (req, res) => {
  res.set('Cache-Control', 'no-store');   // prevent 304
  res.json({
    success: true,
    data: {
      isValid: true,
      user: req.user.profile
    }
  });
});

// get auth status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      googleClientId: !!process.env.GOOGLE_CLIENT_ID,
      googleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL,
      jwtSecret: !!process.env.JWT_SECRET
    }
  });
});

module.exports = router;
