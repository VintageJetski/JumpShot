import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import bodyParser from 'body-parser';
import session from 'express-session';
import { setupAuth, ensureAuthenticated } from './auth';
import { DirectSupabaseAdapter } from './direct-supabase-adapter';

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

// Create Supabase adapter
const supabaseAdapter = new DirectSupabaseAdapter();

// API routes
app.get('/api/events', async (req, res) => {
  try {
    const events = await supabaseAdapter.getEvents();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/players', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const players = await supabaseAdapter.getPlayersWithPIV(eventId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const eventId = req.query.eventId ? parseInt(req.query.eventId as string, 10) : 1;
    const teams = await supabaseAdapter.getTeamsWithTIR(eventId);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Check database connection endpoint
app.get('/api/check-connection', async (req, res) => {
  try {
    const isConnected = await supabaseAdapter.checkConnection();
    res.json({ 
      connected: isConnected,
      dataSource: isConnected ? 'Supabase' : 'CSV Fallback'
    });
  } catch (error) {
    console.error('Error checking connection:', error);
    res.status(500).json({ error: 'Failed to check connection' });
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Create HTTP server
const httpServer = createServer(app);

// Export the app and server for use in the main index.ts
export { app, httpServer };