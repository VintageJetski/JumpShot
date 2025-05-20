import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure for serverless environment
import { neonConfig } from '@neondatabase/serverless';
neonConfig.webSocketConstructor = ws;

async function testDatabaseTables() {
  console.log('Testing Supabase database tables...');
  
  // Create a database pool with the transaction pooler URI
  const pool = new Pool({ 
    connectionString: 'postgresql://postgres.rrtfmkpqembrnieogqmk:7847T8RtFanS6RUC@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' 
  });
  
  try {
    // Test basic connection
    const connectionResult = await pool.query('SELECT NOW() as time');
    console.log(`Database connection successful. Server time: ${connectionResult.rows[0].time}`);
    
    // List all tables in the database
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    const tables = await pool.query(tablesQuery);
    console.log(`\nFound ${tables.rowCount} tables in public schema:`);
    
    for (const table of tables.rows) {
      console.log(`- ${table.table_name}`);
      
      // Get sample data from each table
      try {
        const sampleQuery = `SELECT * FROM "${table.table_name}" LIMIT 1`;
        const sample = await pool.query(sampleQuery);
        
        if (sample.rowCount > 0) {
          console.log(`  * Contains data: ${sample.rowCount} row(s)`);
          console.log(`  * Columns: ${Object.keys(sample.rows[0]).join(', ')}`);
        } else {
          console.log(`  * Table is empty`);
        }
      } catch (error: any) {
        console.error(`  * Error querying table: ${error.message}`);
      }
    }
    
    // Test specific tables mentioned in the screenshot
    const specificTables = [
      'events', 
      'general_stats', 
      'kill_stats', 
      'matches', 
      'player_history', 
      'player_match_summary', 
      'players', 
      'rounds', 
      'teams', 
      'utility_stats'
    ];
    
    console.log('\nTesting specific tables from screenshot:');
    
    for (const tableName of specificTables) {
      try {
        const query = `SELECT COUNT(*) FROM "${tableName}"`;
        const result = await pool.query(query);
        console.log(`- ${tableName}: ${result.rows[0].count} rows`);
        
        // Get column names
        const columnQuery = `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `;
        
        const columns = await pool.query(columnQuery, [tableName]);
        console.log(`  * Columns (${columns.rowCount}):`);
        
        const columnList = columns.rows.map(col => 
          `${col.column_name} (${col.data_type})`
        ).join(', ');
        
        console.log(`  * ${columnList}`);
      } catch (error: any) {
        console.error(`- ${tableName}: Error - ${error.message}`);
      }
    }
    
    // Check for multiple events
    try {
      const eventsQuery = `SELECT * FROM "events"`;
      const events = await pool.query(eventsQuery);
      
      console.log(`\nEvents data (${events.rowCount} rows):`);
      for (const event of events.rows) {
        console.log(`- ${event.event_id}: ${event.event_name}`);
        
        // Count players in this event
        const playerQuery = `
          SELECT COUNT(*) FROM "player_match_summary" 
          WHERE event_id = $1
        `;
        
        const playerCount = await pool.query(playerQuery, [event.event_id]);
        console.log(`  * Contains ${playerCount.rows[0].count} players`);
      }
    } catch (error: any) {
      console.error(`Error querying events: ${error.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error('Database test failed:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the test
testDatabaseTables()
  .then(() => {
    console.log('\nDatabase table test completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error running test:', err);
    process.exit(1);
  });