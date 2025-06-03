import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

// Dashboard Component
function DashboardPage() {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading CS2 Analytics...</p>
        </div>
      </div>
    );
  }

  const topPlayers = players
    .sort((a: any, b: any) => (b.piv || 0) - (a.piv || 0))
    .slice(0, 15);

  const topTeams = teams
    .sort((a: any, b: any) => (b.tir || 0) - (a.tir || 0))
    .slice(0, 10);

  const roleStats = {
    awpers: players.filter((p: any) => p.role === 'AWPer').length,
    entryFraggers: players.filter((p: any) => p.role === 'Entry Fragger').length,
    igls: players.filter((p: any) => p.isIGL).length,
    supports: players.filter((p: any) => p.role === 'Support').length,
    lurkers: players.filter((p: any) => p.role === 'Lurker').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">CS2 Analytics Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">IEM Katowice 2025 Data</span>
              <div className="flex space-x-2">
                <a href="/players" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Players</a>
                <a href="/teams" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Teams</a>
                <a href="/analytics" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Analytics</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">P</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Players</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{players.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">T</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Teams</dt>
                      <dd className="text-2xl font-semibold text-gray-900">{teams.length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Matches</dt>
                      <dd className="text-2xl font-semibold text-gray-900">148</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">R</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Rounds</dt>
                      <dd className="text-2xl font-semibold text-gray-900">1,554</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Top Players */}
            <div className="lg:col-span-2 bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Players by PIV Score</h3>
                <p className="text-sm text-gray-500">Player Impact Value rankings from tournament</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topPlayers.map((player: any, index: number) => (
                    <div key={player.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{player.name}</p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{player.team}</span>
                            <span>•</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              player.role === 'AWPer' ? 'bg-blue-100 text-blue-800' :
                              player.role === 'Entry Fragger' ? 'bg-red-100 text-red-800' :
                              player.role === 'Support' ? 'bg-green-100 text-green-800' :
                              player.role === 'Lurker' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {player.role}
                            </span>
                            {player.isIGL && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                IGL
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">{(player.piv || 0).toFixed(3)}</p>
                        <p className="text-xs text-gray-500">K/D: {(player.stats?.kdRatio || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Teams */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Teams by TIR</h3>
                <p className="text-sm text-gray-500">Team Impact Rating</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topTeams.map((team: any, index: number) => (
                    <div key={team.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            index < 3 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{team.name}</p>
                          <p className="text-xs text-gray-500">{team.players?.length || 0} players</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">{(team.tir || 0).toFixed(3)}</p>
                        <p className="text-xs text-gray-500">Avg PIV: {(team.averagePIV || 0).toFixed(3)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Role Distribution Analysis</h3>
              <p className="text-sm text-gray-500">Player roles across all teams in the tournament</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{roleStats.awpers}</div>
                  <div className="text-sm text-blue-800 font-medium">AWPers</div>
                  <div className="text-xs text-blue-600 mt-1">Primary snipers</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{roleStats.entryFraggers}</div>
                  <div className="text-sm text-red-800 font-medium">Entry Fraggers</div>
                  <div className="text-xs text-red-600 mt-1">First contact</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{roleStats.supports}</div>
                  <div className="text-sm text-green-800 font-medium">Support</div>
                  <div className="text-xs text-green-600 mt-1">Utility & trades</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{roleStats.lurkers}</div>
                  <div className="text-sm text-purple-800 font-medium">Lurkers</div>
                  <div className="text-xs text-purple-600 mt-1">Solo plays</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{roleStats.igls}</div>
                  <div className="text-sm text-yellow-800 font-medium">IGLs</div>
                  <div className="text-xs text-yellow-600 mt-1">Team leaders</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

// Simple Pages for Navigation
function PlayersPage() {
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">All Players</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium">Tournament Players ({players.length})</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map((player: any) => (
                <div key={player.name} className="border rounded-lg p-4">
                  <div className="font-medium text-gray-900">{player.name}</div>
                  <div className="text-sm text-gray-500">{player.team}</div>
                  <div className="text-sm text-gray-600 mt-1">{player.role}</div>
                  <div className="text-sm font-semibold text-blue-600 mt-2">PIV: {(player.piv || 0).toFixed(3)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function TeamsPage() {
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">All Teams</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-medium">Tournament Teams ({teams.length})</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teams.map((team: any) => (
                <div key={team.name} className="border rounded-lg p-6">
                  <div className="font-medium text-lg text-gray-900">{team.name}</div>
                  <div className="text-sm text-gray-500 mb-3">{team.players?.length || 0} players</div>
                  <div className="text-sm font-semibold text-green-600 mb-3">TIR: {(team.tir || 0).toFixed(3)}</div>
                  <div className="space-y-1">
                    {team.players?.slice(0, 5).map((player: any) => (
                      <div key={player.name} className="text-sm text-gray-600">
                        {player.name} - {player.role} ({(player.piv || 0).toFixed(3)})
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
            <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</a>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Advanced Analytics Features</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded">
              <h3 className="font-medium">PIV Calculation System</h3>
              <p className="text-sm text-gray-600">Player Impact Value combines role performance, consistency, and team synergy metrics</p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-medium">TIR Methodology</h3>
              <p className="text-sm text-gray-600">Team Impact Rating aggregates individual player PIV scores with team coordination factors</p>
            </div>
            <div className="p-4 border rounded">
              <h3 className="font-medium">Role-Based Analysis</h3>
              <p className="text-sm text-gray-600">Specialized metrics for AWPers, Entry Fraggers, Support players, Lurkers, and IGLs</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/players" component={PlayersPage} />
        <Route path="/teams" component={TeamsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
              <a href="/" className="text-blue-600 hover:text-blue-800">Return to Dashboard</a>
            </div>
          </div>
        </Route>
      </Switch>
    </QueryClientProvider>
  );
}

export default App;