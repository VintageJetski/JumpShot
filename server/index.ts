import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import { setupVite } from './vite';
import { setupAuth, ensureAuthenticated } from './auth';
import { getPlayersFromSupabase, getTeamsFromPlayers, getEvents } from './direct-supabase-query';
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
  try {
    const events = await getEvents();
    res.json({ status: 'ok', connected: events.length > 0 });
  } catch (error) {
    res.json({ status: 'error', connected: false });
  }
});

// Get players
apiRouter.get('/players', async (req, res) => {
  const players = await getPlayersFromSupabase();
  res.json(players);
});

// Get player by ID
apiRouter.get('/players/:id', async (req, res) => {
  const players = await getPlayersFromSupabase();
  const player = players.find(p => p.id === req.params.id);
  
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  res.json(player);
});

// Get teams
apiRouter.get('/teams', async (req, res) => {
  const teams = await getTeamsFromPlayers();
  res.json(teams);
});

// Get team by ID
apiRouter.get('/teams/:id', async (req, res) => {
  const teams = await getTeamsFromPlayers();
  const team = teams.find(t => t.id === req.params.id);
  
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.json(team);
});

// Get players for a team
apiRouter.get('/teams/:id/players', async (req, res) => {
  const teams = await getTeamsFromPlayers();
  const team = teams.find(t => t.id === req.params.id);
  
  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }
  
  res.json(team.players || []);
});

// Get events
apiRouter.get('/events', async (req, res) => {
  const events = await getEvents();
  res.json(events);
});

// Register API routes
app.use('/api/cs2', apiRouter);

// Force database refresh (admin only)
app.post('/api/refresh-data', ensureAuthenticated, async (req, res) => {
  try {
    // Get fresh data stats
    const players = await getPlayersFromSupabase();
    const teams = await getTeamsFromPlayers();
    
    res.json({ 
      success: true,
      playerCount: players.length,
      teamCount: teams.length,
      dataSource: 'Supabase'
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
  
  try {
    // Get data stats
    const players = await getPlayersFromSupabase();
    const teams = await getTeamsFromPlayers();
    
    console.log(`Processed ${players.length} players and ${teams.length} teams from Supabase`);
  } catch (error) {
    console.error('Warning: Error processing Supabase data:', error);
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