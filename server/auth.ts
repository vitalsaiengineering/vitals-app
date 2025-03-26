import { Express, Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.NODE_ENV === "production" 
  ? "https://your-production-domain.com/auth/google/callback"
  : "http://localhost:5000/auth/google/callback";

export function setupAuth(app: Express) {
  // Check if Google OAuth credentials are available
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth credentials not found. Google login will not work.");
    return;
  }

  // Configure Google OAuth strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists with this Google ID
          let user = await storage.getUserByGoogleId(profile.id);
          
          if (user) {
            // Update the user's Google tokens
            user = await storage.updateUserGoogleConnection(
              user.id,
              profile.id,
              accessToken,
              refreshToken || null
            );
            return done(null, user);
          }
          
          // Check if user exists with the same email
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          if (email) {
            const existingUser = await storage.getUserByEmail(email);
            if (existingUser) {
              // Link Google account to existing user
              user = await storage.updateUserGoogleConnection(
                existingUser.id,
                profile.id,
                accessToken,
                refreshToken || null
              );
              return done(null, user);
            }
          }
          
          // Create a new user if not found and has email
          if (email) {
            // Get default organization
            const organizations = await storage.getOrganizations();
            const defaultOrg = organizations.length > 0 ? organizations[0] : null;
            
            if (!defaultOrg) {
              return done(new Error("No organization available for new user registration"));
            }
            
            // Create a new user
            const fullName = profile.displayName || `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim();
            const newUser = await storage.createUser({
              username: email.split("@")[0],
              password: null, // No password for social login
              email: email,
              fullName: fullName || "Google User",
              role: "advisor", // Default role for new users
              organizationId: defaultOrg.id,
            });
            
            // Link Google account to new user
            user = await storage.updateUserGoogleConnection(
              newUser.id,
              profile.id,
              accessToken,
              refreshToken || null
            );
            
            return done(null, user);
          }
          
          // Cannot create user without email
          return done(new Error("No email found in Google profile"));
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Register Google OAuth routes
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
      // Successful authentication, redirect home
      res.redirect("/dashboard");
    }
  );

  // Add Google authentication status route
  app.get("/api/auth/google/status", (req, res) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return res.json({ configured: false });
    }
    return res.json({ configured: true });
  });
}

// Authentication middleware for API routes
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

// Role-based authorization middleware
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = req.user as any;
    if (!roles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
}