import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

async function startSimpleServer() {
  const httpServer = createServer(app);
  await registerRoutes(app);
  
  // Simple static file serving for development
  app.use(express.static('client/dist'));
  app.get('*', (req, res) => {
    res.sendFile(require('path').resolve('client/dist/index.html'));
  });

  const port = 5000;
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Simple server running on port ${port}`);
  });
}

startSimpleServer().catch(console.error);