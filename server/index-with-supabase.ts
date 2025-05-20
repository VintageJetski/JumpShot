import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import apiRoutes from './routes-with-supabase';
import session from 'express-session';
import { supabaseStorage } from './supabase-storage';

// Create Express app
const app: Express = express();

// Configure session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};

// Configure app
app.use(session(sessionConfig));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use the API routes
app.use(apiRoutes);

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

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