import express from "express";
import path from "path";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function startDirectServer() {
  // Register API routes first
  await registerRoutes(app);
  
  // Serve static files for client
  const clientPath = path.join(process.cwd(), 'client');
  app.use(express.static(clientPath));
  
  // Catch-all route for SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });

  const port = 5000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Direct server running on port ${port}`);
  });
}

startDirectServer().catch(console.error);