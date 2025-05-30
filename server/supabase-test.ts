import { createClient } from '@supabase/supabase-js';

// Simple test to verify Supabase connection and data structure
export async function testSupabaseConnection() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic connection
    console.log('🔍 Testing Supabase connection...');
    
    // Get events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .limit(5);
    
    if (eventsError) throw eventsError;
    console.log('✅ Events table accessible:', events?.length || 0, 'records');

    // Get sample player data with joined stats
    const { data: samplePlayers, error: playersError } = await supabase
      .from('players')
      .select(`
        steam_id,
        user_name,
        general_stats (
          kd,
          adr_total,
          event_id
        ),
        kill_stats (
          kills,
          headshots,
          event_id
        )
      `)
      .limit(3);
    
    if (playersError) throw playersError;
    console.log('✅ Player data accessible:', samplePlayers?.length || 0, 'records');

    return {
      success: true,
      events: events || [],
      samplePlayers: samplePlayers || []
    };
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}