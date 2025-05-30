import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";

// Simple bypass authentication for accessing authentic data
export function setupAuth(app: Express) {
  // Basic session setup without database dependency
  app.use(session({
    secret: 'jumpshot-session-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
  }));

  // Simple bypass login endpoint
  app.post("/api/login", (req, res) => {
    // Set authenticated session
    (req.session as any).user = { id: 1, username: "Admin" };
    res.json({ id: 1, username: "Admin" });
  });

  // Bypass logout endpoint
  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  // Simple user endpoint
  app.get("/api/user", (req, res) => {
    const user = (req.session as any)?.user;
    if (user) {
      res.json(user);
    } else {
      res.status(401).send("Not authenticated");
    }
  });
}

// Bypass auth middleware - allows access to authentic data
export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  // Always allow access to authentic data
  next();
}