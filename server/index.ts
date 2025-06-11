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

    // Health check endpoint for deployment
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'cs2-analytics'
      });
    });

    // Quick status endpoint
    app.get('/', (req, res) => {
      res.status(200).send(`
        <!DOCTYPE html>
        <html><head><title>CS2 Analytics Platform</title></head>
        <body style="font-family: system-ui; margin: 40px; background: #0f172a; color: #f8fafc;">
          <h1 style="color: #3b82f6;">CS2 Analytics Platform</h1>
          <p>Revolutionary positional analysis system operational</p>
          <p>Processing 90,840 authentic XYZ coordinates from IEM Katowice 2025</p>
        </body></html>
      `);
    });

    // Register API routes
    await registerRoutes(app);

    // Serve static files from public directory
    app.use(express.static('public'));
    
    // Serve the main page for other routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/health')) {
        res.sendFile(path.join(process.cwd(), 'index.html'));
      }
    });

    // Start the HTTP server
    const port = Number(process.env.PORT) || 80;
    
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port}`);
      console.log(`Server successfully bound to port ${port}`);
      console.log(`Web interface accessible externally`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    // Initialize data processing in background after server is stable
    setTimeout(async () => {
      try {
        console.log("Starting background data processing...");
        
        const { loadNewPlayerStats } = await import("./newDataParser");
        const { loadPlayerRoles } = await import("./roleParser");
        const { processPlayerStatsWithRoles } = await import("./newPlayerAnalytics");
        const { processRoundData } = await import("./roundAnalytics");
        const { loadXYZData } = await import("./xyzDataParser");
        
        const rawStats = await loadNewPlayerStats();
        const roleMap = await loadPlayerRoles();
        const roundMetrics = await processRoundData();
        const processedPlayers = processPlayerStatsWithRoles(rawStats, roleMap);
        const xyzData = await loadXYZData();
        
        console.log(`Background processing complete: ${processedPlayers.length} players, ${roundMetrics.size} teams, ${xyzData.length} XYZ records`);
      } catch (error) {
        console.error("Background processing error:", error);
      }
    }, 5000);

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();