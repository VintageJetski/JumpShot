import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { loadXYZData, processPositionalData } from "./xyzDataParser";
import { storage } from "./storage";

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
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    const server = await registerRoutes(app);

    // Setup middleware first
    if (app.get("env") === "development") {
      try {
        await setupVite(app, server);
        console.log('Vite middleware setup complete');
      } catch (err) {
        console.warn('Vite setup failed, using fallback serving:', (err as Error).message);
        // Fallback to basic static serving
        app.use(express.static('client'));
        app.get('*', (req, res) => {
          res.sendFile(path.resolve(process.cwd(), 'client/index.html'));
        });
      }
    } else {
      serveStatic(app);
    }

    // Start the HTTP server
    const port = 5000;
    server.listen(port, "0.0.0.0", (err?: Error) => {
      if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
      }
      log(`serving on port ${port}`);
    });

    // Load XYZ positional data after server starts
    setTimeout(async () => {
      console.log('Loading XYZ positional data...');
      try {
        const positionalMetrics = await loadXYZData();
        await storage.setPositionalMetrics(positionalMetrics);
        console.log(`Loaded positional metrics for ${positionalMetrics.length} players`);
      } catch (error) {
        console.error('Failed to load XYZ data:', error);
      }
    }, 2000);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
