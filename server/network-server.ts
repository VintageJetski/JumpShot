import express from "express";
import { createServer } from "http";
import path from "path";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

async function startNetworkServer() {
  try {
    // Register API routes
    await registerRoutes(app);
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // Serve static files
    app.use(express.static(path.join(process.cwd(), 'client', 'public')));
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
    });

    const server = createServer(app);
    const port = 5000;
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`Network server listening on ${port}`);
      console.log(`Health check: http://0.0.0.0:${port}/health`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    server.on('clientError', (err, socket) => {
      console.error('Client error:', err);
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });

  } catch (error) {
    console.error('Failed to start network server:', error);
  }
}

startNetworkServer();