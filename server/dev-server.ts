import express from "express";
import path from "path";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function startDevServer() {
  // Register API routes first
  await registerRoutes(app);
  
  // Serve static files from client directory
  app.use(express.static(path.join(process.cwd(), 'client', 'public')));
  
  // For development, serve the raw HTML file
  app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'client', 'index.html'));
  });

  const server = createServer(app);
  const port = 5000;
  
  server.listen(port, '0.0.0.0', () => {
    console.log(`Dev server running on port ${port}`);
  });
}

startDevServer().catch(console.error);