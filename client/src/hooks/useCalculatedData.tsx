import { useQuery } from '@tanstack/react-query';
import { processAllPlayerData, PlayerRawStats, PlayerRoleInfo, RoundData, PlayerWithPIV, TeamWithTIR } from '@/lib/calculations';

/**
 * Custom hook that fetches raw data and performs all calculations client-side
 */
export function useCalculatedData() {
  // Fetch raw player data
  const { data: rawPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/raw/players'],
    queryFn: async () => {
      const response = await fetch('/api/raw/players');
      if (!response.ok) throw new Error('Failed to fetch raw player data');
      return response.json() as Promise<PlayerRawStats[]>;
    }
  });

  // Fetch role data
  const { data: rawRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/raw/roles'],
    queryFn: async () => {
      const response = await fetch('/api/raw/roles');
      if (!response.ok) throw new Error('Failed to fetch role data');
      const rolesArray = await response.json() as Array<{ playerName: string } & PlayerRoleInfo>;
      
      // Convert array back to Map
      const roleMap = new Map<string, PlayerRoleInfo>();
      rolesArray.forEach(({ playerName, ...roleInfo }) => {
        roleMap.set(playerName, roleInfo);
      });
      return roleMap;
    }
  });

  // Fetch rounds data
  const { data: rawRounds, isLoading: roundsLoading } = useQuery({
    queryKey: ['/api/raw/rounds'],
    queryFn: async () => {
      const response = await fetch('/api/raw/rounds');
      if (!response.ok) throw new Error('Failed to fetch rounds data');
      return response.json() as Promise<RoundData[]>;
    }
  });

  // Calculate processed data when all raw data is available
  const { data: calculatedData, isLoading: calculatingData } = useQuery({
    queryKey: ['calculated-data', rawPlayers, rawRoles, rawRounds],
    queryFn: () => {
      if (!rawPlayers || !rawRoles || !rawRounds) {
        throw new Error('Raw data not available');
      }
      
      console.log('Processing data with authentic calculations...');
      console.log(`Raw players: ${rawPlayers.length}, Roles: ${rawRoles.size}, Rounds: ${rawRounds.length}`);
      
      return processAllPlayerData(rawPlayers, rawRoles, rawRounds);
    },
    enabled: !!rawPlayers && !!rawRoles && !!rawRounds
  });

  const isLoading = playersLoading || rolesLoading || roundsLoading || calculatingData;

  return {
    players: calculatedData?.players || [],
    teams: calculatedData?.teams || [],
    rawData: {
      players: rawPlayers || [],
      roles: rawRoles || new Map(),
      rounds: rawRounds || []
    },
    isLoading,
    error: null
  };
}

/**
 * Hook for getting calculated players with role filtering
 */
export function useCalculatedPlayers(role?: string) {
  const { players, isLoading } = useCalculatedData();
  
  const filteredPlayers = role && role !== 'All Roles' 
    ? players.filter(player => player.role === role)
    : players;

  return {
    data: filteredPlayers,
    isLoading
  };
}

/**
 * Hook for getting calculated teams
 */
export function useCalculatedTeams() {
  const { teams, isLoading } = useCalculatedData();
  
  return {
    data: teams,
    isLoading
  };
}

/**
 * Hook for getting a specific calculated player by ID
 */
export function useCalculatedPlayer(id: string) {
  const { players, isLoading } = useCalculatedData();
  
  const player = players.find(p => p.id === id);
  
  return {
    data: player,
    isLoading
  };
}

/**
 * Hook for getting a specific calculated team by name
 */
export function useCalculatedTeam(name: string) {
  const { teams, isLoading } = useCalculatedData();
  
  const team = teams.find(t => t.name === name);
  
  return {
    data: team,
    isLoading
  };
}