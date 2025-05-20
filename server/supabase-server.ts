import express, { Express, NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import { setupAuth } from './auth';
import { checkConnection, getEvents, getPlayersWithPIV, getTeamsWithTIR } from './supabase-adapter';
import MemoryStore from 'memorystore';

// Create in-memory session store
const MemStore = MemoryStore(session);

// Create Express app
const app: Express = express();

// Configure session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'csanalytics-secret',
  resave: false,
  saveUninitialized: false,
  store: new MemStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
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

// Define API routes
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
    const eventId = req.query.eventId ? Number(req.query.eventId) : 1;
    const players = await getPlayersWithPIV(eventId);
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const eventId = req.query.eventId ? Number(req.query.eventId) : 1;
    const teams = await getTeamsWithTIR(eventId);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

app.get('/api/player/:id', async (req, res) => {
  try {
    const playerId = req.params.id;
    const eventId = req.query.eventId ? Number(req.query.eventId) : 1;
    const players = await getPlayersWithPIV(eventId);
    const player = players.find(p => p.id === playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

app.get('/api/team/:id', async (req, res) => {
  try {
    const teamId = req.params.id;
    const eventId = req.query.eventId ? Number(req.query.eventId) : 1;
    const teams = await getTeamsWithTIR(eventId);
    const team = teams.find(t => t.id === teamId);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Middleware to serve the React app
app.use(express.static('dist/client'));

// Catch-all handler for client-side routing
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist/client' });
});

// Error handler middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    console.log('Starting server with Supabase integration...');
    
    // Check database connection
    const dbAvailable = await checkConnection();
    console.log(`Supabase database connection: ${dbAvailable ? 'Available ✅' : 'Unavailable ❌'}`);
    
    // Start server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[express] serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();