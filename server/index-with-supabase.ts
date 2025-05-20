import express, { Express } from 'express';
import { registerRoutes } from './routes';
import { setupAuth } from './auth';
import { initializePlayerData } from './playerDataLoader';
import { initializeRoundData } from './roundDataLoader';
import { dataRefreshManager } from './dataRefreshManager';
import { storage } from './storage';
import { supabaseStorage } from './supabase-storage';

// Initialize app
const app: Express = express();

// Configure middleware
app.use(express.json());

// Setup authentication
setupAuth(app);

// Initialize data and start server
async function start() {
  try {
    // Start the data refresh manager - this will test the Supabase connection
    await dataRefreshManager.start();
    
    if (dataRefreshManager.isSupabaseAvailable()) {
      console.log('Using Supabase as the primary data source');
      
      // In a full implementation, you could replace the global storage
      // storage = supabaseStorage;
      
      // For now, let's still initialize data from CSV as a fallback
      await initializePlayerData();
      await initializeRoundData();
    } else {
      console.log('Using CSV files as the data source');
      await initializePlayerData();
      await initializeRoundData();
    }
    
    // Register routes and get HTTP server
    const httpServer = registerRoutes(app);

    // Default port
    const PORT = process.env.PORT || 5000;
    
    // Start server
    httpServer.listen(PORT, () => {
      console.log(`[express] serving on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      dataRefreshManager.stop();
      httpServer.close(() => {
        console.log('HTTP server closed');
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      dataRefreshManager.stop();
      httpServer.close(() => {
        console.log('HTTP server closed');
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
start();