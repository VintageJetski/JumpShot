import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure WebSocket for Neon/Supabase
neonConfig.webSocketConstructor = ws;

// Create database pool with the provided connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function viewDatabaseStructure() {
  console.log('Exploring Supabase database structure...');
  
  try {
    // Get all tables in the database
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    const tablesResult = await pool.query(tablesQuery);
    console.log('\nAvailable tables:');
    tablesResult.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check player_stats table structure
    console.log('\nExploring player_stats table structure:');
    const playerStatsColumns = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'player_stats'
      ORDER BY ordinal_position
    `);
    
    console.log('player_stats columns:');
    playerStatsColumns.rows.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type})`);
    });
    
    // Sample data from player_stats
    const samplePlayersQuery = `
      SELECT * FROM player_stats LIMIT 1
    `;
    
    const samplePlayersResult = await pool.query(samplePlayersQuery);
    console.log('\nSample player data:');
    console.log(samplePlayersResult.rows[0]);
    
    // Check teams table structure (if it exists)
    if (tablesResult.rows.some(row => row.table_name === 'teams')) {
      console.log('\nExploring teams table structure:');
      const teamsColumns = await pool.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'teams'
        ORDER BY ordinal_position
      `);
      
      console.log('teams columns:');
      teamsColumns.rows.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type})`);
      });
      
      // Sample data from teams
      const sampleTeamsQuery = `
        SELECT * FROM teams LIMIT 1
      `;
      
      const sampleTeamsResult = await pool.query(sampleTeamsQuery);
      console.log('\nSample team data:');
      console.log(sampleTeamsResult.rows[0]);
    }
    
  } catch (error) {
    console.error('Error exploring database structure:', error);
  } finally {
    await pool.end();
  }
}

viewDatabaseStructure()
  .then(() => console.log('\nDatabase exploration complete.'))
  .catch(err => console.error('Unexpected error:', err));