import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
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

    // Initialize data processing
    console.log("Loading raw player data...");
    await storage.initializeData();
    
    console.log("Loading XYZ positional data...");
    const xyzData = await loadXYZData();
    console.log(`Loaded ${xyzData.length} XYZ position records`);
    
    console.log("Generating dynamic map areas from coordinate data...");
    const mapAreas = await processPositionalData(xyzData);
    console.log(`Generated ${mapAreas.length} map areas:`, mapAreas.map(area => `${area.name || 'Unknown Area'}`));

    // Create HTTP server
    const server = createServer(app);

    // Register API routes first
    await registerRoutes(app);

    // Setup Vite or serve static files in production
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }

    // Start the HTTP server with error handling
    const port = Number(process.env.PORT) || 5000;
    
    server.listen(port, () => {
      log(`serving on port ${port}`);
      console.log(`Server successfully bound to port ${port}`);
      console.log(`Processing complete: ${xyzData.length} XYZ coordinates loaded`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });

    server.on('listening', () => {
      console.log(`Server successfully bound to port ${port}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();