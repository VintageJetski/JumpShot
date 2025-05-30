import { Router } from 'express';
import { supabaseService } from './supabase-service';
import { calculatePIVFromSupabaseData } from './piv-calculator-supabase';

const router = Router();

// Get all players with PIV calculations from Supabase
router.get('/players-supabase', async (req, res) => {
  try {
    console.log('🔍 Fetching player data from Supabase...');
    
    // Test connection first
    const isConnected = await supabaseService.testConnection();
    if (!isConnected) {
      return res.status(500).json({ 
        error: 'Supabase connection failed',
        note: 'Check SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables'
      });
    }

    // Get player performance data
    const playerData = await supabaseService.getAggregatedPlayerData();
    console.log(`📊 Retrieved ${playerData.length} player records from Supabase`);

    if (playerData.length === 0) {
      return res.json({
        players: [],
        count: 0,
        note: 'No player data found in Supabase',
        timestamp: new Date().toISOString()
      });
    }

    // Calculate PIV values
    const playersWithPIV = calculatePIVFromSupabaseData(playerData);
    console.log(`✅ Calculated PIV for ${playersWithPIV.length} players`);

    // Return processed data
    res.json({
      players: playersWithPIV,
      count: playersWithPIV.length,
      note: 'Player data with PIV calculations from Supabase',
      timestamp: new Date().toISOString(),
      events: [...new Set(playersWithPIV.map(p => p.event))],
      teams: [...new Set(playersWithPIV.map(p => p.team))]
    });

  } catch (error) {
    console.error('❌ Error fetching Supabase player data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch player data from Supabase',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;