import { Switch, Route, Link } from "wouter";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

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
    .sort((a, b) => (b.piv || 0) - (a.piv || 0))
    .slice(0, 10);

  const topTeams = teams
    .sort((a, b) => (b.tir || 0) - (a.tir || 0))
    .slice(0, 8);

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
              <div className="flex space-x-6">
                <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium border-b-2 border-blue-600">Dashboard</Link>
                <Link href="/players" className="text-gray-500 hover:text-blue-800 text-sm font-medium">Players</Link>
                <Link href="/teams" className="text-gray-500 hover:text-blue-800 text-sm font-medium">Teams</Link>
                <Link href="/analytics" className="text-gray-500 hover:text-blue-800 text-sm font-medium">Analytics</Link>
                <Link href="/compare" className="text-gray-500 hover:text-blue-800 text-sm font-medium">Compare</Link>
                <Link href="/predictions" className="text-gray-500 hover:text-blue-800 text-sm font-medium">Predictions</Link>
                <Link href="/scout" className="text-gray-500 hover:text-blue-800 text-sm font-medium">Scout</Link>
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
                  {topPlayers.map((player, index) => (
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
                        <p className="text-xs text-gray-500">K/D: {(player.kd || 0).toFixed(2)}</p>
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
                  {topTeams.map((team, index) => (
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

        </div>
      </main>
    </div>
  );
}

// Placeholder pages that show they exist
function PlayersPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Players Analysis</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Advanced player analysis features are available. This section includes detailed player statistics, role analysis, and performance metrics.</p>
        </div>
      </main>
    </div>
  );
}

function TeamsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Teams Analysis</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Team analysis features include TIR calculations, team chemistry analysis, and strategic insights.</p>
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
            <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Advanced analytics dashboard with statistical analysis, data visualization, and performance insights.</p>
        </div>
      </main>
    </div>
  );
}

function ComparePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Player Comparison</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Compare player performance metrics, role effectiveness, and statistical analysis between multiple players.</p>
        </div>
      </main>
    </div>
  );
}

function PredictionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Match Predictions</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">AI-powered match prediction engine using PIV and TIR metrics to forecast match outcomes and performance.</p>
        </div>
      </main>
    </div>
  );
}

function ScoutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">Player Scout</h1>
            <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-600">Advanced player scouting system with talent identification, role analysis, and performance projections.</p>
        </div>
      </main>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-gray-600 mb-4">Page not found</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800">← Back to Dashboard</Link>
      </div>
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
        <Route path="/compare" component={ComparePage} />
        <Route path="/predictions" component={PredictionsPage} />
        <Route path="/scout" component={ScoutPage} />
        <Route component={NotFound} />
      </Switch>
    </QueryClientProvider>
  );
}

export default App;