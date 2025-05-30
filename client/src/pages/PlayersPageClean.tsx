import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ClientPlayer } from '@/types/player';
import { motion, AnimatePresence } from 'framer-motion';
import { calculatePIV, RawPlayerData } from '@/lib/metrics-calculator';
import { useLocation } from 'wouter';

interface ApiResponse {
  players: ClientPlayer[];
  count: number;
  timestamp: string;
}

// Simple player card component
function PlayerCard({ player, setLocation }: { player: ClientPlayer, setLocation: (path: string) => void }) {
  const { name, team, isIGL, tRole, ctRole, kills, deaths, adr, kast, rating, assists, entryKills, entryDeaths, multiKills, clutchWins, clutchAttempts, flashAssists, rounds, maps, teamRounds, eventId, steamId } = player;
  const initials = name.split(' ').map((n: string) => n[0]).join('');
  
  // Convert ClientPlayer to RawPlayerData for PIV calculation
  const rawPlayerData: RawPlayerData = {
    steamId,
    userName: name,
    teamName: team,
    kills: kills || 0,
    deaths: deaths || 1,
    assists: assists || 0,
    adr: adr || 0,
    kast: kast || 0,
    rating: rating || 0,
    entryKills: entryKills || 0,
    entryDeaths: entryDeaths || 0,
    multiKills: multiKills || 0,
    clutchWins: clutchWins || 0,
    clutchAttempts: clutchAttempts || 0,
    flashAssists: flashAssists || 0,
    rounds: rounds || 1,
    maps: maps || 1,
    teamRounds: teamRounds || 1,
    isIGL,
    tRole,
    ctRole,
    eventId
  };
  
  // Calculate proper PIV using the official formula
  const piv = calculatePIV(rawPlayerData);
  const kd = deaths > 0 ? kills / deaths : kills;
  const primaryRole = isIGL ? 'IGL' : tRole;

  const roleColors: Record<string, string> = {
    'IGL': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    'AWP': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    'Lurker': 'bg-green-500/20 text-green-300 border-green-500/50',
    'Support': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    'Spacetaker': 'bg-red-500/20 text-red-300 border-red-500/50',
    'Anchor': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    'Rotator': 'bg-teal-500/20 text-teal-300 border-teal-500/50',
    'Entry': 'bg-pink-500/20 text-pink-300 border-pink-500/50',
  };

  return (
    <motion.div
      key={`${player.steamId}-${player.eventId}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="overflow-hidden cursor-pointer hover:bg-gray-800/30 transition-colors"
        onClick={() => setLocation(`/players/${player.steamId}`)}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-blue-900/40 text-blue-100">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground">{team}</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs px-2 py-0.5 rounded border ${roleColors[primaryRole] || 'bg-gray-500/20 text-gray-300 border-gray-500/50'}`}>
              {primaryRole}
            </span>
            {ctRole !== tRole && (
              <span className={`text-xs px-2 py-0.5 rounded border ${roleColors[ctRole] || 'bg-gray-500/20 text-gray-300 border-gray-500/50'}`}>
                {ctRole}
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">PIV Rating</span>
              <span className="font-medium text-cyan-400">{piv.toFixed(1)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">K/D</span>
                <span>{kd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ADR</span>
                <span>{adr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">KAST</span>
                <span>{kast}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rating</span>
                <span>{rating.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function PlayersPageClean() {
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [outlierFilter, setOutlierFilter] = useState<string>('All Players');
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['/api/players'],
    refetchOnWindowFocus: false,
  });

  const filteredPlayers = useMemo(() => {
    if (!data?.players) return [];

    let filtered = data.players;

    // Role filtering
    if (selectedRole !== 'All') {
      filtered = filtered.filter(player => {
        if (selectedRole === 'IGL') return player.isIGL;
        return player.tRole === selectedRole || player.ctRole === selectedRole;
      });
    }

    // Statistical outlier filtering
    if (outlierFilter !== 'All Players') {
      const pivValues = filtered.map(p => {
        const rawPlayerData: RawPlayerData = {
          steamId: p.steamId,
          userName: p.name,
          teamName: p.team,
          kills: p.kills || 0,
          deaths: p.deaths || 1,
          assists: p.assists || 0,
          adr: p.adr || 0,
          kast: p.kast || 0,
          rating: p.rating || 0,
          entryKills: p.entryKills || 0,
          entryDeaths: p.entryDeaths || 0,
          multiKills: p.multiKills || 0,
          clutchWins: p.clutchWins || 0,
          clutchAttempts: p.clutchAttempts || 0,
          flashAssists: p.flashAssists || 0,
          rounds: p.rounds || 1,
          maps: p.maps || 1,
          teamRounds: p.teamRounds || 1,
          isIGL: p.isIGL,
          tRole: p.tRole,
          ctRole: p.ctRole,
          eventId: p.eventId
        };
        return calculatePIV(rawPlayerData);
      });
      
      const sorted = pivValues.slice().sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      
      if (outlierFilter === 'Top Outliers') {
        filtered = filtered.filter((_, i) => pivValues[i] > q3);
      } else if (outlierFilter === 'Bottom Outliers') {
        filtered = filtered.filter((_, i) => pivValues[i] < q1);
      }
    }

    return filtered;
  }, [data?.players, selectedRole, outlierFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading player data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500">Error loading player data</p>
        </div>
      </div>
    );
  }

  const roleOptions = ['All', 'IGL', 'AWP', 'Entry', 'Support', 'Lurker', 'Spacetaker', 'Anchor', 'Rotator'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Player Performance Analytics</h1>
        <p className="text-muted-foreground">
          Real-time PIV calculations from raw Supabase data • {data?.count || 0} players analyzed
        </p>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant={selectedRole === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setSelectedRole('All')}>
          All Players
        </Button>
        <Button variant="outline" size="sm">
          By Team
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Statistical Outliers:</span>
          <Button 
            variant={outlierFilter === 'All Players' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setOutlierFilter('All Players')}
          >
            All Players
          </Button>
          <Button 
            variant={outlierFilter === 'Top Outliers' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setOutlierFilter('Top Outliers')}
          >
            Top Outliers
          </Button>
          <Button 
            variant={outlierFilter === 'Bottom Outliers' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setOutlierFilter('Bottom Outliers')}
          >
            Bottom Outliers
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {selectedRole !== 'All' && (
          <Badge variant="secondary">
            Role: {selectedRole}
            <button
              onClick={() => setSelectedRole('All')}
              className="ml-2 text-xs hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filteredPlayers.length} of {data?.count || 0} players
        {selectedRole !== 'All' && ` • Filtered by role: ${selectedRole}`}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredPlayers.map((player) => (
            <PlayerCard 
              key={`${player.steamId}-${player.eventId}`} 
              player={player} 
              setLocation={setLocation}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}