import { Pool } from '@neondatabase/serverless';
import 'dotenv/config';

async function verifySupabaseConnection() {
  console.log('Checking Supabase database connection...');
  
  // Verify DATABASE_URL environment variable
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Missing DATABASE_URL environment variable');
    return false;
  }
  
  console.log('✅ DATABASE_URL environment variable found');
  
  try {
    // Create connection pool
    const pool = new Pool({ connectionString });
    
    // Test connection with a simple query
    const result = await pool.query('SELECT 1 as test');
    
    if (result.rows.length > 0) {
      console.log('✅ Successfully connected to Supabase database');
      
      // Check if player_stats table exists
      try {
        const tableResult = await pool.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `);
        
        console.log('\nAvailable tables:');
        const tables = tableResult.rows.map(row => row.table_name);
        tables.forEach(table => {
          console.log(`- ${table}`);
        });
        
        // Check if player_stats table exists
        if (tables.includes('player_stats')) {
          const playerCountResult = await pool.query('SELECT COUNT(*) FROM player_stats');
          console.log(`\nFound ${playerCountResult.rows[0].count} players in player_stats table`);
          
          // Get sample player data
          const samplePlayerResult = await pool.query('SELECT * FROM player_stats LIMIT 1');
          if (samplePlayerResult.rows.length > 0) {
            console.log('\nSample player data:');
            console.log(samplePlayerResult.rows[0]);
          }
        } else {
          console.log('❌ player_stats table not found');
        }
        
        // Check if teams table exists
        if (tables.includes('teams')) {
          const teamCountResult = await pool.query('SELECT COUNT(*) FROM teams');
          console.log(`\nFound ${teamCountResult.rows[0].count} teams in teams table`);
          
          // Get sample team data
          const sampleTeamResult = await pool.query('SELECT * FROM teams LIMIT 1');
          if (sampleTeamResult.rows.length > 0) {
            console.log('\nSample team data:');
            console.log(sampleTeamResult.rows[0]);
          }
        } else {
          console.log('❌ teams table not found');
        }
        
        await pool.end();
        return true;
      } catch (tableError) {
        console.error('❌ Error checking tables:', tableError);
        await pool.end();
        return false;
      }
    } else {
      console.error('❌ Connection test failed');
      await pool.end();
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to Supabase database:', error);
    return false;
  }
}

// Run the verification
verifySupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ Supabase connection verified successfully');
    } else {
      console.error('\n❌ Supabase connection verification failed');
    }
  })
  .catch(error => {
    console.error('\n❌ Unexpected error during verification:', error);
  });