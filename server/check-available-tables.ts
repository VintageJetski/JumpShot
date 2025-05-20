import { db } from './supabase-db';

/**
 * Script to check available tables in the connected Supabase database
 */
async function checkAvailableTables() {
  console.log('Checking available tables in the Supabase database...');
  
  try {
    // Test the database connection
    console.log('Testing database connection...');
    const testResult = await db.execute('SELECT 1 as test');
    console.log(`Connection test: ${testResult.rows.length > 0 ? 'Success ✅' : 'Failed ❌'}`);
    
    // List available tables
    console.log('\nListing available tables:');
    const tablesQuery = `
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    const tablesResult = await db.execute(tablesQuery);
    const tables = tablesResult.rows as { tablename: string }[];
    
    if (tables.length === 0) {
      console.log('No tables found in the public schema.');
    } else {
      console.log(`Found ${tables.length} tables:`);
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename}`);
      });
      
      // For each table, get count and sample data
      console.log('\nTable details:');
      for (const table of tables) {
        const countQuery = `SELECT COUNT(*) as count FROM ${table.tablename}`;
        const countResult = await db.execute(countQuery);
        const count = parseInt((countResult.rows[0] as { count: string }).count, 10);
        
        console.log(`\n${table.tablename}: ${count} rows`);
        
        if (count > 0) {
          // Get column information
          const columnsQuery = `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table.tablename}'
            ORDER BY ordinal_position
          `;
          
          const columnsResult = await db.execute(columnsQuery);
          const columns = columnsResult.rows as { column_name: string, data_type: string }[];
          
          console.log('Columns:');
          columns.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
          });
          
          // Get sample data
          const sampleQuery = `SELECT * FROM ${table.tablename} LIMIT 1`;
          const sampleResult = await db.execute(sampleQuery);
          
          if (sampleResult.rows.length > 0) {
            console.log('Sample data:');
            console.log(sampleResult.rows[0]);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking available tables:', error);
  }
}

// Run the check
checkAvailableTables()
  .then(() => {
    console.log('\nCheck completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nError during check:', error);
    process.exit(1);
  });