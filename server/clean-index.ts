import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import path from 'path';
import { cleanSupabaseService } from './clean-supabase-service';
import cleanApiRoutes from './clean-api-routes';
import { setupAuth } from './auth';

/**
 * Clean server implementation that uses our new Supabase integration
 */
export async function createCleanServer(): Promise<Server> {
  const app: Express = express();
  
  // Middleware for parsing JSON
  app.use(express.json());
  
  // Set up authentication
  setupAuth(app);
  
  // Register our API routes
  app.use('/api/cs2', cleanApiRoutes);
  
  // Serve static files from client/dist
  app.use(express.static(path.resolve(__dirname, '../client/dist')));
  
  // Default route handler - send index.html for client-side routing
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
  
  // Initialize data - do initial refresh
  await cleanSupabaseService.refreshData();
  
  return httpServer;
}