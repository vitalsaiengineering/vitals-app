import { Express, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { storage } from './storage';
import dotenv from 'dotenv';
import { userRoleEnum } from '../shared/schema';

// Load environment variables
dotenv.config();

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:5000';

// Configure Passport with Google OAuth
passport.use(new GoogleStrategy({
  clientID: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  callbackURL: `${CALLBACK_URL}/auth/google/callback`,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists by email in our system
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('No email found from Google'));
    }

    let user = await storage.getUserByEmail(email);

    if (user) {
      // User exists, update their Google details
      user = await storage.updateUserGoogleConnection(
        user.id,
        profile.id,
        accessToken,
        refreshToken || null
      );
    } else {
      // New user - create an account for them
      // By default, create as financial_advisor (you may want to change this based on your requirements)
      // First create the user with the basic information
      const newUser = await storage.createUser({
        username: email.split('@')[0], // Generate username from email
        email: email,
        password: '', // No password for OAuth users
        fullName: profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim(),
        role: 'financial_advisor' as (typeof userRoleEnum.enumValues)[number],
        organizationId: 1, // Default organization
      });
      
      // Then update with Google-specific information
      user = await storage.updateUserGoogleConnection(
        newUser.id,
        profile.id,
        accessToken,
        refreshToken || null
      );
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

// Setup auth routes and middleware
export function setupAuth(app: Express) {
  // Initialize passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Google OAuth routes
  app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
      // Successful authentication
      res.redirect('/dashboard');
    }
  );

  // Logout route
  app.get('/auth/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/login');
    });
  });

  // Current user route
  app.get('/api/me', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Return user without sensitive fields
    const user = req.user as any;
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
    };
    
    res.json(safeUser);
  });
}

// Auth middleware for protected routes
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Role-based auth middleware
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const user = req.user as any;
    if (roles.includes(user.role)) {
      return next();
    }
    
    res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
  };
}