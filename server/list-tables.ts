import { Pool } from '@neondatabase/serverless';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon for serverless environment
neonConfig.webSocketConstructor = ws;

async function listDatabaseTables() {
  console.log('Listing all tables in the database...');
  
  // Make sure we have a database URL
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL environment variable found');
    return false;
  }
  
  // Create a database pool
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as time');
    console.log(`Database connection successful. Server time: ${result.rows[0].time}`);
    
    // Query for all tables in the public schema
    const tableQuery = `
      SELECT 
        table_name, 
        table_schema
      FROM 
        information_schema.tables
      WHERE 
        table_schema = 'public'
      ORDER BY 
        table_name;
    `;
    
    const tablesResult = await pool.query(tableQuery);
    
    if (tablesResult.rows.length === 0) {
      console.log('No tables found in the public schema.');
    } else {
      console.log(`\nFound ${tablesResult.rows.length} tables in the database:`);
      for (const table of tablesResult.rows) {
        console.log(`- ${table.table_schema}.${table.table_name}`);
        
        // Get column information for this table
        const columnQuery = `
          SELECT 
            column_name, 
            data_type, 
            is_nullable
          FROM 
            information_schema.columns
          WHERE 
            table_schema = $1 AND 
            table_name = $2
          ORDER BY 
            ordinal_position;
        `;
        
        const columnsResult = await pool.query(columnQuery, [table.table_schema, table.table_name]);
        
        console.log(`  * Columns (${columnsResult.rows.length}):`);
        for (const column of columnsResult.rows) {
          console.log(`    - ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        }
        
        // Check for sample data (first row)
        try {
          const sampleQuery = `SELECT * FROM ${table.table_schema}.${table.table_name} LIMIT 1`;
          const sampleResult = await pool.query(sampleQuery);
          
          if (sampleResult.rows.length > 0) {
            console.log(`  * Sample data available: ${sampleResult.rows.length} row(s)`);
          } else {
            console.log(`  * No data in this table`);
          }
        } catch (error) {
          console.error(`  * Error fetching sample data: ${error.message}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Database inspection failed:', error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the test
listDatabaseTables()
  .then(() => {
    console.log('\nDatabase inspection completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error inspecting database:', err);
    process.exit(1);
  });