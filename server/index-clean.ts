import { createCleanServer } from './clean-index';
import dotenv from 'dotenv';

dotenv.config();

// Initialize clean Supabase server
async function start() {
  try {
    console.log('Starting server with clean Supabase integration...');
    const server = await createCleanServer();
    
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`[express] serving on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();