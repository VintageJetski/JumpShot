import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function startServer() {
  try {
    // Create HTTP server
    const server = createServer(app);

    // Health check endpoint for deployment
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'cs2-analytics'
      });
    });

    // Register API routes
    await registerRoutes(app);

    // Setup Vite for development or static serving for production
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    // Error handling middleware (must be after all routes)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error("Server error:", err);
    });

    // Start the HTTP server
    const port = Number(process.env.PORT) || 5000;
    
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port}`);
      console.log(`Server successfully bound to port ${port}`);
      console.log(`Web interface accessible externally`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // Background data processing removed to prevent server blocking

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();