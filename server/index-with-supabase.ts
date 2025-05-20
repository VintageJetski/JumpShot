import express, { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { v4 as uuidv4 } from 'uuid';
import { setupAuth, ensureAuthenticated } from './auth';
import { registerVite } from './vite';
import { registerRoutes } from './routes';
import { dataRefreshManager } from './dataRefreshManager';
import { supabaseStorage } from './supabase-storage';

// Create Express app
const app: Express = express();

// Configure Express
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const SESSION_SECRET = process.env.SESSION_SECRET || uuidv4();
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Set up authentication
setupAuth(app);

// API routes
app.get('/api/check-connection', async (req: Request, res: Response) => {
  const isConnected = await dataRefreshManager.checkSupabaseConnection();
  res.json({ connected: isConnected });
});

app.get('/api/refresh-data', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    await dataRefreshManager.refreshData();
    const lastRefresh = dataRefreshManager.getLastRefreshTime();
    res.json({ success: true, lastRefresh });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to refresh data' });
  }
});

app.get('/api/events', async (req: Request, res: Response) => {
  try {
    const events = await supabaseStorage.getEvents();
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
async function start() {
  try {
    // Register routes
    registerRoutes(app);
    
    // Register Vite middleware
    await registerVite(app);
    
    // Initialize data refresh manager
    await dataRefreshManager.start();
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`${new Date().toLocaleTimeString()} [express] serving on port ${PORT}`);
    });
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      dataRefreshManager.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('Shutting down server...');
      dataRefreshManager.stop();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();