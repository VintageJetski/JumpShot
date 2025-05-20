import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import { setupVite } from './vite';
import { setupAuth, ensureAuthenticated } from './auth';
import { supabaseRawAdapter } from './supabase-raw-adapter';
import { Router } from 'express';

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

// Create API routes using our raw adapter
const apiRouter = Router();

// Health check
apiRouter.get('/health', async (req, res) => {
  const isConnected = await supabaseRawAdapter.checkConnection();
  res.json({ status: 'ok', connected: isConnected });
});

// Get players
apiRouter.get('/players', async (req, res) => {
  const players = await supabaseRawAdapter.getPlayersWithPIV();
  res.json(players);
});

// Get player by ID
apiRouter.get('/players/:id', async (req, res) => {
  const players = await supabaseRawAdapter.getPlayersWithPIV();
  const player = players.find(p => p.id === req.params.id);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.json(player);
});

// Get teams
apiRouter.get('/teams', async (req, res) => {
  const teams = await supabaseRawAdapter.getTeamsWithTIR();
  res.json(teams);
});

// Get team by ID
apiRouter.get('/teams/:id', async (req, res) => {
  const teams = await supabaseRawAdapter.getTeamsWithTIR();
  const team = teams.find(t => t.id === req.params.id);
  
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.json(team);
});

// Get players for a team
apiRouter.get('/teams/:id/players', async (req, res) => {
  const teams = await supabaseRawAdapter.getTeamsWithTIR();
  const team = teams.find(t => t.id === req.params.id);
  
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.json(team.players || []);
});

// Get events
apiRouter.get('/events', async (req, res) => {
  const events = await supabaseRawAdapter.getEvents();
  res.json(events);
});

// Register API routes
app.use('/api/cs2', apiRouter);

// Force database refresh (admin only)
app.post('/api/refresh-data', ensureAuthenticated, async (req, res) => {
  try {
    // Check connection
    const isConnected = await supabaseRawAdapter.checkConnection();
    
    // Get fresh data stats
    const players = await supabaseRawAdapter.getPlayersWithPIV();
    const teams = await supabaseRawAdapter.getTeamsWithTIR();
    
    res.json({ 
      success: true,
      playerCount: players.length,
      teamCount: teams.length,
      dataSource: isConnected ? 'Supabase' : 'Unknown'
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
  console.log('Starting server with raw Supabase data integration...');
  
  // Initialize data by checking connection
  const isConnected = await supabaseRawAdapter.checkConnection();
  console.log(`Supabase database connection: ${isConnected ? 'Available ✅' : 'Unavailable ❌'}`);
  
  if (isConnected) {
    // Get data stats
    const players = await supabaseRawAdapter.getPlayersWithPIV();
    const teams = await supabaseRawAdapter.getTeamsWithTIR();
    console.log(`Processed ${players.length} players and ${teams.length} teams from Supabase`);
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