import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import session from 'express-session';
import { registerVite } from './vite';
import { setupAuth, ensureAuthenticated } from './auth';
import { supabaseStorage } from './fixed-supabase-storage';

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
app.use(cors());
app.use(session(sessionConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set up authentication routes
setupAuth(app);

// API routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await supabaseStorage.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const players = await supabaseStorage.getPlayersWithPIV(eventId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const teams = await supabaseStorage.getTeamsWithTIR(eventId);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Check database connection endpoint
app.get('/api/check-connection', async (req, res) => {
  try {
    const isConnected = await supabaseStorage.checkConnection();
    res.json({ connected: isConnected });
  } catch (error) {
    console.error('Error checking connection:', error);
    res.status(500).json({ error: 'Failed to check connection' });
  }
});

// Force database refresh (admin only)
app.post('/api/refresh-data', ensureAuthenticated, async (req, res) => {
  try {
    // Clear cache and force refresh by checking connection again
    await supabaseStorage.checkConnection();
    
    // Get fresh data
    const eventId = req.body.eventId || 1;
    const players = await supabaseStorage.getPlayersWithPIV(eventId);
    const teams = await supabaseStorage.getTeamsWithTIR(eventId);
    
    res.json({ 
      success: true,
      playerCount: players.length,
      teamCount: teams.length
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
registerVite(app);

// Start the server
const PORT = process.env.PORT || 5000;

async function start() {
  console.log('Starting server with Supabase integration...');
  
  // Test Supabase connection
  const isConnected = await supabaseStorage.checkConnection();
  console.log(`Supabase database connection: ${isConnected ? 'Available' : 'Unavailable'}`);
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`[express] serving on port ${PORT}`);
  });
}

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});