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
  
  // Initialize authentication
  setupAuth(app);
  
  // Standard middleware
  app.use(express.json());
  
  // Initialize Supabase connection
  await cleanSupabaseService.checkConnection();
  await cleanSupabaseService.refreshData();
  
  // API routes
  app.use('/api', cleanApiRoutes);
  
  // Serve static files in production
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'client', 'dist', 'index.html'));
  });
  
  // Error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Server error',
      message: err.message || 'Internal server error'
    });
  });
  
  // Create HTTP server
  const server = createServer(app);
  
  return server;
}