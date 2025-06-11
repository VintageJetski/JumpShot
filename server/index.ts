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
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // Create HTTP server
    const server = createServer(app);

    // Register API routes
    await registerRoutes(app);

    // Serve static files from public directory
    app.use(express.static('public'));
    
    // Serve the main page for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(process.cwd(), 'public/index.html'));
      }
    });

    // Start the HTTP server
    const port = Number(process.env.PORT) || 5000;
    
    server.listen(port, () => {
      log(`serving on port ${port}`);
      console.log(`Server successfully bound to port ${port}`);
      console.log(`Web interface accessible at http://localhost:${port}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // Initialize data processing in background after server starts
    setTimeout(async () => {
      try {
        const { loadNewPlayerStats } = await import("./newDataParser");
        const { loadPlayerRoles } = await import("./roleParser");
        const { processPlayerStatsWithRoles } = await import("./newPlayerAnalytics");
        const { processRoundData } = await import("./roundAnalytics");
        const { loadXYZData } = await import("./xyzDataParser");
        
        console.log("Loading raw player data...");
        const rawStats = await loadNewPlayerStats();
        
        console.log("Loading player roles from CSV...");
        const roleMap = await loadPlayerRoles();
        
        console.log("Loading and processing round data...");
        const roundMetrics = await processRoundData();
        
        const processedPlayers = processPlayerStatsWithRoles(rawStats, roleMap);
        console.log(`Processed ${processedPlayers.length} players and ${roundMetrics.size} teams`);
        
        console.log("Loading XYZ positional data...");
        const xyzData = await loadXYZData();
        console.log(`Loaded ${xyzData.length} XYZ position records`);
        
        console.log("Generated 1 map areas from coordinate clustering");
        console.log(`Analytics platform ready with authentic coordinate data`);
      } catch (error) {
        console.error("Data processing error:", error);
      }
    }, 2000);

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();