import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from '@/components/players/PlayerCard';
import { processRawPlayersData, type RawPlayerData, type PlayerWithPIV } from '@/lib/piv-calculator';
import { User2, Users, Target, Lightbulb } from 'lucide-react';

export default function PlayersPageFixed() {
  const [viewMode, setViewMode] = useState<'all' | 'team'>('all');
  const [filteredPlayers, setFilteredPlayers] = useState<PlayerWithPIV[]>([]);
  const [teamGroups, setTeamGroups] = useState<{[key: string]: PlayerWithPIV[]}>({});

  // Fetch raw data from API and calculate PIV client-side
  const { data: apiResponse, isLoading, error } = useQuery({
    queryKey: ['/api/players'],
    queryFn: async () => {
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    },
  });

  // Process raw data and calculate PIV when data arrives
  const players = React.useMemo(() => {
    if (!apiResponse?.players || !Array.isArray(apiResponse.players)) {
      return [];
    }
    
    console.log('🔄 Processing raw player data client-side...');
    const processedPlayers = processRawPlayersData(apiResponse.players as RawPlayerData[]);
    console.log(`✅ Calculated PIV for ${processedPlayers.length} players`);
    
    return processedPlayers;
  }, [apiResponse]);

  useEffect(() => {
    if (players.length > 0) {
      // Group players by team
      const teamGroups: {[key: string]: PlayerWithPIV[]} = {};
      players.forEach(player => {
        if (!teamGroups[player.team]) {
          teamGroups[player.team] = [];
        }
        teamGroups[player.team].push(player);
      });

      // Sort teams by average PIV
      Object.keys(teamGroups).forEach(team => {
        teamGroups[team].sort((a, b) => b.piv - a.piv);
      });

      setTeamGroups(teamGroups);
      setFilteredPlayers(players);
      
      console.log(`📊 CLIENT-SIDE PIV CALCULATION COMPLETE:`, {
        totalPlayers: players.length,
        teams: Object.keys(teamGroups).length,
        avgPIV: players.reduce((sum, p) => sum + p.piv, 0) / players.length
      });
    }
  }, [players]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading raw player data...</p>
          <p className="text-sm text-gray-500">PIV calculations will happen client-side</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <p>Error loading player data</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!players || players.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">No player data available</p>
          <p className="text-sm text-gray-500">Check Supabase connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Player Performance Analytics
        </h1>
        <p className="text-gray-600">
          Real-time PIV calculations from raw Supabase data • {players.length} players analyzed
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Players
          </button>
          <button
            onClick={() => setViewMode('team')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'team' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            By Team
          </button>
        </div>
      </div>

      {/* Players Display */}
      <AnimatePresence mode="wait">
        {viewMode === 'all' ? (
          <motion.div
            key="all-players"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredPlayers.map((player, index) => (
              <PlayerCard 
                key={player.steamId} 
                player={player} 
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="team-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {Object.entries(teamGroups).map(([teamName, teamPlayers]) => (
              <div key={teamName}>
                <h2 className="text-2xl font-bold mb-4 text-blue-600">
                  {teamName} ({teamPlayers.length} players)
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {teamPlayers.map((player, index) => (
                    <PlayerCard 
                      key={player.steamId} 
                      player={player} 
                      index={index}
                    />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Debug Info */}
      {apiResponse && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
          <p><strong>API Response:</strong> {apiResponse.note}</p>
          <p><strong>Data Timestamp:</strong> {apiResponse.timestamp}</p>
          <p><strong>Client-side PIV Calculation:</strong> ✅ Active</p>
        </div>
      )}
    </div>
  );
}