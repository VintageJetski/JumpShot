import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import bodyParser from 'body-parser';
import session from 'express-session';
import { setupAuth, ensureAuthenticated } from './auth';
import { setupVite } from './vite';
import { 
  checkConnection, 
  getEvents, 
  getPlayersWithPIV, 
  getTeamsWithTIR 
} from './supabase-integration';

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
    const events = await getEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const players = await getPlayersWithPIV(eventId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const teams = await getTeamsWithTIR(eventId);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Check database connection endpoint
app.get('/api/check-connection', async (req, res) => {
  try {
    const isConnected = await checkConnection();
    res.json({ 
      connected: isConnected,
      dataSource: isConnected ? 'Supabase' : 'Unavailable'
    });
  } catch (error) {
    console.error('Error checking connection:', error);
    res.status(500).json({ error: 'Failed to check connection' });
  }
});

// Force data refresh (admin only)
app.post('/api/refresh-data', ensureAuthenticated, async (req, res) => {
  try {
    const eventId = req.body.eventId || 1;
    const players = await getPlayersWithPIV(eventId);
    const teams = await getTeamsWithTIR(eventId);
    
    res.json({ 
      success: true,
      playerCount: players.length,
      teamCount: teams.length,
      dataSource: await checkConnection() ? 'Supabase' : 'Unavailable'
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

// Create HTTP server
const httpServer = createServer(app);

// Set up Vite in development mode
setupVite(app, httpServer);

// Start the server
const PORT = process.env.PORT || 5000;

async function start() {
  console.log('Starting server with direct Supabase integration...');
  
  // Test Supabase connection
  const isConnected = await checkConnection();
  console.log(`Supabase database connection: ${isConnected ? 'Available ✅' : 'Unavailable ❌'}`);
  
  if (isConnected) {
    // Get available events
    const events = await getEvents();
    console.log(`Available events: ${events.map(e => e.name).join(', ')}`);
    
    // Get player and team counts
    const players = await getPlayersWithPIV(1);
    const teams = await getTeamsWithTIR(1);
    
    console.log(`Found ${players.length} players and ${teams.length} teams for event 1`);
  }
  
  // Start the server
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});