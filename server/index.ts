import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { setupVite } from './vite';
import { createCleanServer } from './clean-index';
import { cleanSupabaseService } from './clean-supabase-service';
import { getPlayersFromSupabase, getTeamsFromPlayers } from './direct-supabase-query';

// Start the server
const PORT = process.env.PORT || 5000;

async function start() {
  console.log('Starting server with raw Supabase data integration...');
  
  try {
    // Get data stats
    const players = await getPlayersFromSupabase();
    const teams = await getTeamsFromPlayers();
    
    console.log(`Found ${players.length} player stats in Supabase`);
    console.log(`Created ${teams.length} teams from player data`);
    console.log(`Processed ${players.length} players and ${teams.length} teams from Supabase`);
  } catch (error) {
    console.error('Warning: Error processing Supabase data:', error);
  }
  
  try {
    // Create and start the server using our clean implementation
    const app: Express = express();
    const httpServer = createServer(app);
    
    // Set up Vite middleware in development
    setupVite(app, httpServer);
    
    // Start the server
    httpServer.listen(PORT, () => {
      console.log(`[express] serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});