import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import path from 'path';
import { setupAuth } from './auth';
import { setupFinalSolution } from './final-solution';

/**
 * Create and configure the Express server with the simplified database integration
 */
export async function createFinalServer(): Promise<Server> {
  const app: Express = express();
  
  // Middleware
  app.use(express.json());
  
  // Setup authentication
  setupAuth(app);
  
  // Setup database and API routes
  setupFinalSolution(app);
  
  // Serve static files
  app.use(express.static(path.resolve(__dirname, '../client/dist')));
  
  // Client-side routing
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
  });
  
  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}