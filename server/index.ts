import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import { setupVite } from './vite';
import { setupAuth, ensureAuthenticated } from './auth';
import { cleanSupabaseService } from './clean-supabase-service';
import cleanApiRoutes from './clean-api-routes';

// Create Express app
const app: Express = express();

// Configure session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'csanalytics-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};

// Configure app middleware
app.use(session(sessionConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up authentication routes
setupAuth(app);

// Register our clean API routes
app.use('/api', cleanApiRoutes);

// Force database refresh (admin only)
app.post('/api/refresh-data', ensureAuthenticated, async (req, res) => {
  try {
    // Clear cache to force refresh 
    cleanSupabaseService.clearCache();
    
    // Check connection and refresh data
    await cleanSupabaseService.checkConnection();
    await cleanSupabaseService.refreshData();
    
    // Get fresh data stats
    const players = await cleanSupabaseService.getPlayersWithPIV();
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    
    res.json({ 
      success: true,
      playerCount: players.length,
      teamCount: teams.length,
      dataSource: cleanSupabaseService.isSupabaseAvailable() ? 'Supabase' : 'CSV fallback'
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Register Vite middleware in development
import { createServer } from 'http';
const httpServer = createServer(app);
setupVite(app, httpServer);

// Start the server
const PORT = process.env.PORT || 5000;

async function start() {
  console.log('Starting server with clean Supabase integration...');
  
  // Initialize data by checking connection and doing initial refresh
  const isConnected = await cleanSupabaseService.checkConnection();
  console.log(`Supabase database connection: ${isConnected ? 'Available ✅' : 'Unavailable ❌'}`);
  
  if (isConnected) {
    console.log('Refreshing data from Supabase...');
    await cleanSupabaseService.refreshData();
    
    // Get data stats
    const players = await cleanSupabaseService.getPlayersWithPIV();
    const teams = await cleanSupabaseService.getTeamsWithTIR();
    console.log(`Loaded ${players.length} players and ${teams.length} teams from Supabase`);
  } else {
    console.error('Warning: Could not connect to Supabase. Please check your database connection string.');
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`[express] serving on port ${PORT}`);
  });
}

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});