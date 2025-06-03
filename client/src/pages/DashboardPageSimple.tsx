import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface PlayerWithPIV {
  name: string;
  team: string;
  role: string;
  piv: number;
  kd: number;
  isIGL?: boolean;
}

interface TeamWithTIR {
  name: string;
  tir: number;
  averagePIV: number;
  players?: PlayerWithPIV[];
}

export default function DashboardPageSimple() {
  const { data: players = [], isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    }
  });

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    }
  });

  if (playersLoading || teamsLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading CS2 Analytics...</p>
        </div>
      </div>
    );
  }

  const topPlayers = players
    .sort((a: PlayerWithPIV, b: PlayerWithPIV) => (b.piv || 0) - (a.piv || 0))
    .slice(0, 10);

  const topTeams = teams
    .sort((a: TeamWithTIR, b: TeamWithTIR) => (b.tir || 0) - (a.tir || 0))
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Dark Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">CS2 Analytics Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-400">IEM Katowice 2025 Data</span>
              <div className="flex space-x-6">
                <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm font-medium border-b-2 border-blue-400">Dashboard</Link>
                <Link href="/players" className="text-slate-400 hover:text-blue-300 text-sm font-medium">Players</Link>
                <Link href="/teams" className="text-slate-400 hover:text-blue-300 text-sm font-medium">Teams</Link>
                <Link href="/analytics" className="text-slate-400 hover:text-blue-300 text-sm font-medium">Analytics</Link>
                <Link href="/compare" className="text-slate-400 hover:text-blue-300 text-sm font-medium">Compare</Link>
                <Link href="/predictions" className="text-slate-400 hover:text-blue-300 text-sm font-medium">Predictions</Link>
                <Link href="/scout" className="text-slate-400 hover:text-blue-300 text-sm font-medium">Scout</Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Dark Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">P</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Total Players</p>
                  <p className="text-3xl font-bold text-white">{players.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">T</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Total Teams</p>
                  <p className="text-3xl font-bold text-white">{teams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">M</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Matches</p>
                  <p className="text-3xl font-bold text-white">148</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">R</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-400">Rounds</p>
                  <p className="text-3xl font-bold text-white">1,554</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dark Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Dark Top Players */}
            <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg">
              <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="text-lg font-medium text-white">Top Players by PIV Score</h3>
                <p className="text-sm text-slate-400">Player Impact Value rankings from tournament</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topPlayers.map((player: PlayerWithPIV, index: number) => (
                    <div key={player.name} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                            index < 3 ? 'bg-yellow-600 text-yellow-100' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-white">{player.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-slate-400">
                            <span>{player.team}</span>
                            <span>•</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              player.role === 'AWP' ? 'bg-blue-800 text-blue-200' :
                              player.role === 'Entry Fragger' ? 'bg-red-800 text-red-200' :
                              player.role === 'Support' ? 'bg-green-800 text-green-200' :
                              player.role === 'Lurker' ? 'bg-purple-800 text-purple-200' :
                              'bg-slate-700 text-slate-300'
                            }`}>
                              {player.role}
                            </span>
                            {player.isIGL && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-800 text-yellow-200">
                                IGL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-400">{(player.piv || 0).toFixed(3)}</p>
                        <p className="text-xs text-slate-400">K/D: {(player.kd || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dark Top Teams */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg">
              <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="text-lg font-medium text-white">Top Teams by TIR</h3>
                <p className="text-sm text-slate-400">Team Impact Rating</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topTeams.map((team: TeamWithTIR, index: number) => (
                    <div key={team.name} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                            index < 3 ? 'bg-green-600 text-green-100' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-white">{team.name}</p>
                          <p className="text-xs text-slate-400">{team.players?.length || 0} players</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-400">{(team.tir || 0).toFixed(3)}</p>
                        <p className="text-xs text-slate-400">Avg PIV: {(team.averagePIV || 0).toFixed(3)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recovery Notice */}
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">ℹ</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-200">
                  System Recovery Mode
                </h3>
                <div className="mt-2 text-sm text-blue-300">
                  <p>Your complete CS2 analytics platform is preserved with all data intact. This is a simplified view while advanced components are being restored. All navigation tabs (Compare, Predictions, Scout) link to your full features.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}