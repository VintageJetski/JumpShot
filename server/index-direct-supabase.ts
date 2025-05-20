import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import { setupVite } from './vite';
import { setupAuth, ensureAuthenticated } from './auth';
import { directSupabaseStorage } from './direct-supabase-storage';
import { DataRefreshManager } from './dataRefreshManager';

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

// API routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await directSupabaseStorage.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const players = await directSupabaseStorage.getPlayersWithPIV(eventId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const teams = await directSupabaseStorage.getTeamsWithTIR(eventId);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Check database connection endpoint
app.get('/api/check-connection', async (req, res) => {
  try {
    const isConnected = await directSupabaseStorage.checkConnection();
    res.json({ 
      connected: isConnected,
      lastRefresh: directSupabaseStorage.getLastRefreshTime()
    });
  } catch (error) {
    console.error('Error checking connection:', error);
    res.status(500).json({ error: 'Failed to check connection' });
  }
});

// Force database refresh (admin only)
app.post('/api/refresh-data', ensureAuthenticated, async (req, res) => {
  try {
    // Clear cache to force refresh 
    directSupabaseStorage.clearCache();
    
    // Check connection to refresh data
    await directSupabaseStorage.checkConnection();
    
    // Get fresh data
    const eventId = req.body.eventId || 1;
    const players = await directSupabaseStorage.getPlayersWithPIV(eventId);
    const teams = await directSupabaseStorage.getTeamsWithTIR(eventId);
    
    res.json({ 
      success: true,
      playerCount: players.length,
      teamCount: teams.length,
      dataSource: directSupabaseStorage.isSupabaseAvailable() ? 'Supabase' : 'CSV fallback'
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
// Set up Vite in development mode
setupVite(app, httpServer);

// Start the server
const PORT = process.env.PORT || 5000;

async function start() {
  console.log('Starting server with Direct Supabase integration...');
  
  // Initialize and start the data refresh manager
  const dataRefreshManager = await import('./dataRefreshManager');
  const refreshManager = dataRefreshManager.dataRefreshManager;
  refreshManager.start();
  
  // Test Supabase connection
  const isConnected = await directSupabaseStorage.checkConnection();
  console.log(`Supabase database connection: ${isConnected ? 'Available ✅' : 'Unavailable ❌'}`);
  
  if (!isConnected) {
    console.log('Using CSV fallback data source');
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