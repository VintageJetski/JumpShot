import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for deployment
app.set("trust proxy", true);

// Basic security headers and cache control
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  // Aggressive cache busting for non-API routes
  if (!req.path.startsWith('/api')) {
    res.header("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
    res.header("Pragma", "no-cache");
    res.header("Expires", "0");
    res.header("ETag", `"${Date.now()}"`);
    res.header("Last-Modified", new Date().toUTCString());
  }
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  
  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Serve static assets only
  app.use('/assets', express.static(path.join(process.cwd(), 'client', 'public')));
  
  // Serve your working advanced dashboard for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      const advancedDashboardPath = path.join(process.cwd(), 'client', 'public', 'original-working-dashboard.html');
      res.sendFile(advancedDashboardPath, (err) => {
        if (err) {
          // Fallback to a basic React app if advanced dashboard doesn't exist
          res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>CS2 Analytics Platform</title>
              <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
              <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
              <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
              <script src="https://unpkg.com/react-router-dom@6/dist/index.js"></script>
              <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body>
              <div id="root"></div>
              <script type="text/babel">
                const { useState, useEffect } = React;
                const { BrowserRouter, Routes, Route, Link, useNavigate } = ReactRouterDOM;

                function App() {
                  const [players, setPlayers] = useState([]);
                  const [teams, setTeams] = useState([]);
                  const [loading, setLoading] = useState(true);
                  const [currentView, setCurrentView] = useState('dashboard');

                  useEffect(() => {
                    Promise.all([
                      fetch('/api/players').then(r => r.json()),
                      fetch('/api/teams').then(r => r.json())
                    ]).then(([playersData, teamsData]) => {
                      setPlayers(playersData);
                      setTeams(teamsData);
                      setLoading(false);
                    }).catch(console.error);
                  }, []);

                  if (loading) {
                    return (
                      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-4 text-gray-600">Loading CS2 Analytics Platform...</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="min-h-screen bg-gray-50">
                      <header className="bg-white shadow-sm border-b">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                          <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                              <h1 className="text-2xl font-bold text-gray-900">CS2 Analytics Platform</h1>
                              <span className="ml-4 text-sm text-gray-500">IEM Katowice 2025</span>
                            </div>
                            <nav className="flex space-x-8">
                              <button 
                                onClick={() => setCurrentView('dashboard')}
                                className={\`\${currentView === 'dashboard' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'} border-b-2 px-1 pb-4 text-sm font-medium\`}
                              >
                                Dashboard
                              </button>
                              <button 
                                onClick={() => setCurrentView('players')}
                                className={\`\${currentView === 'players' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'} border-b-2 px-1 pb-4 text-sm font-medium\`}
                              >
                                Players
                              </button>
                              <button 
                                onClick={() => setCurrentView('teams')}
                                className={\`\${currentView === 'teams' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'} border-b-2 px-1 pb-4 text-sm font-medium\`}
                              >
                                Teams
                              </button>
                              <button 
                                onClick={() => setCurrentView('analytics')}
                                className={\`\${currentView === 'analytics' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'} border-b-2 px-1 pb-4 text-sm font-medium\`}
                              >
                                Analytics
                              </button>
                              <button 
                                onClick={() => setCurrentView('comparison')}
                                className={\`\${currentView === 'comparison' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'} border-b-2 px-1 pb-4 text-sm font-medium\`}
                              >
                                Compare
                              </button>
                              <button 
                                onClick={() => setCurrentView('predictions')}
                                className={\`\${currentView === 'predictions' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'} border-b-2 px-1 pb-4 text-sm font-medium\`}
                              >
                                Predictions
                              </button>
                              <button 
                                onClick={() => setCurrentView('scout')}
                                className={\`\${currentView === 'scout' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent'} border-b-2 px-1 pb-4 text-sm font-medium\`}
                              >
                                Scout
                              </button>
                            </nav>
                          </div>
                        </div>
                      </header>

                      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                        {currentView === 'dashboard' && <DashboardView players={players} teams={teams} />}
                        {currentView === 'players' && <PlayersView players={players} />}
                        {currentView === 'teams' && <TeamsView teams={teams} />}
                        {currentView === 'analytics' && <AnalyticsView players={players} teams={teams} />}
                        {currentView === 'comparison' && <ComparisonView players={players} />}
                        {currentView === 'predictions' && <PredictionsView teams={teams} />}
                        {currentView === 'scout' && <ScoutView players={players} />}
                      </main>
                    </div>
                  );
                }

                function DashboardView({ players, teams }) {
                  const topPlayers = players.sort((a, b) => (b.piv || 0) - (a.piv || 0)).slice(0, 15);
                  const topTeams = teams.sort((a, b) => (b.tir || 0) - (a.tir || 0)).slice(0, 10);
                  
                  const roleStats = {
                    awpers: players.filter(p => p.role === 'AWPer').length,
                    entryFraggers: players.filter(p => p.role === 'Entry Fragger').length,
                    supports: players.filter(p => p.role === 'Support').length,
                    lurkers: players.filter(p => p.role === 'Lurker').length,
                    igls: players.filter(p => p.isIGL).length,
                  };

                  return (
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
                                  <dt className="text-sm font-medium text-gray-500 truncate">Tournament Matches</dt>
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
                                  <dt className="text-sm font-medium text-gray-500 truncate">Total Rounds</dt>
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
                            <p className="text-sm text-gray-500">Player Impact Value rankings from IEM Katowice 2025</p>
                          </div>
                          <div className="p-6">
                            <div className="space-y-4">
                              {topPlayers.map((player, index) => (
                                <div key={player.name} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 w-8">
                                      <span className={\`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium \${
                                        index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                      }\`}>
                                        {index + 1}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <p className="text-sm font-medium text-gray-900">{player.name}</p>
                                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <span>{player.team}</span>
                                        <span>•</span>
                                        <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${
                                          player.role === 'AWPer' ? 'bg-blue-100 text-blue-800' :
                                          player.role === 'Entry Fragger' ? 'bg-red-100 text-red-800' :
                                          player.role === 'Support' ? 'bg-green-100 text-green-800' :
                                          player.role === 'Lurker' ? 'bg-purple-100 text-purple-800' :
                                          'bg-gray-100 text-gray-800'
                                        }\`}>
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
                                      <span className={\`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium \${
                                        index < 3 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                      }\`}>
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
                  );
                }

                function PlayersView({ players }) {
                  const [sortBy, setSortBy] = useState('piv');
                  const [roleFilter, setRoleFilter] = useState('');
                  const [teamFilter, setTeamFilter] = useState('');

                  const teams = [...new Set(players.map(p => p.team))].sort();
                  const roles = [...new Set(players.map(p => p.role))].filter(Boolean).sort();

                  const filteredPlayers = players
                    .filter(p => !roleFilter || p.role === roleFilter)
                    .filter(p => !teamFilter || p.team === teamFilter)
                    .sort((a, b) => {
                      switch(sortBy) {
                        case 'piv': return (b.piv || 0) - (a.piv || 0);
                        case 'kd': return (b.kd || 0) - (a.kd || 0);
                        case 'name': return a.name.localeCompare(b.name);
                        default: return 0;
                      }
                    });

                  return (
                    <div className="px-4 py-6 sm:px-0">
                      <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">All Players</h3>
                              <p className="text-sm text-gray-500">{filteredPlayers.length} of {players.length} players</p>
                            </div>
                            <div className="flex space-x-4">
                              <select 
                                value={teamFilter} 
                                onChange={(e) => setTeamFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                              >
                                <option value="">All Teams</option>
                                {teams.map(team => (
                                  <option key={team} value={team}>{team}</option>
                                ))}
                              </select>
                              <select 
                                value={roleFilter} 
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                              >
                                <option value="">All Roles</option>
                                {roles.map(role => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                              <select 
                                value={sortBy} 
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                              >
                                <option value="piv">Sort by PIV</option>
                                <option value="kd">Sort by K/D</option>
                                <option value="name">Sort by Name</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPlayers.map((player) => (
                              <div key={player.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium text-gray-900">{player.name}</div>
                                    <div className="text-sm text-gray-500">{player.team}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-semibold text-blue-600">{(player.piv || 0).toFixed(3)}</div>
                                    <div className="text-xs text-gray-500">PIV Score</div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={\`inline-flex items-center px-2 py-1 rounded text-xs font-medium \${
                                    player.role === 'AWPer' ? 'bg-blue-100 text-blue-800' :
                                    player.role === 'Entry Fragger' ? 'bg-red-100 text-red-800' :
                                    player.role === 'Support' ? 'bg-green-100 text-green-800' :
                                    player.role === 'Lurker' ? 'bg-purple-100 text-purple-800' :
                                    'bg-gray-100 text-gray-800'
                                  }\`}>
                                    {player.role}
                                  </span>
                                  <div className="text-sm text-gray-600">K/D: {(player.kd || 0).toFixed(2)}</div>
                                </div>
                                {player.isIGL && (
                                  <div className="mt-2">
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                      Team Leader (IGL)
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                function TeamsView({ teams }) {
                  const sortedTeams = teams.sort((a, b) => (b.tir || 0) - (a.tir || 0));

                  return (
                    <div className="px-4 py-6 sm:px-0">
                      <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">All Teams</h3>
                          <p className="text-sm text-gray-500">{teams.length} teams ranked by TIR</p>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {sortedTeams.map((team, index) => (
                              <div key={team.name} className="border rounded-lg p-6">
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                      #{index + 1} {team.name}
                                    </h3>
                                    <p className="text-sm text-gray-500">{team.players?.length || 0} players</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">{(team.tir || 0).toFixed(3)}</div>
                                    <div className="text-xs text-gray-500">TIR Score</div>
                                  </div>
                                </div>
                                <div className="mb-4">
                                  <div className="text-sm text-gray-600 mb-2">
                                    Average PIV: <span className="font-semibold">{(team.averagePIV || 0).toFixed(3)}</span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900 mb-2">Team Roster</h4>
                                  <div className="space-y-2">
                                    {(team.players || []).sort((a, b) => (b.piv || 0) - (a.piv || 0)).map((player) => (
                                      <div key={player.name} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-sm font-medium">{player.name}</span>
                                          <span className={\`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium \${
                                            player.role === 'AWPer' ? 'bg-blue-100 text-blue-800' :
                                            player.role === 'Entry Fragger' ? 'bg-red-100 text-red-800' :
                                            player.role === 'Support' ? 'bg-green-100 text-green-800' :
                                            player.role === 'Lurker' ? 'bg-purple-100 text-purple-800' :
                                            'bg-gray-100 text-gray-800'
                                          }\`}>
                                            {player.role}
                                          </span>
                                          {player.isIGL && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                              IGL
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-sm font-semibold text-blue-600">{(player.piv || 0).toFixed(3)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                function AnalyticsView({ players, teams }) {
                  const avgPIV = players.reduce((sum, p) => sum + (p.piv || 0), 0) / players.length;
                  const maxPIV = Math.max(...players.map(p => p.piv || 0));
                  const minPIV = Math.min(...players.map(p => p.piv || 0));

                  return (
                    <div className="px-4 py-6 sm:px-0">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white shadow rounded-lg p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">PIV Statistics</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Average PIV:</span>
                              <span className="text-sm font-semibold">{avgPIV.toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Highest PIV:</span>
                              <span className="text-sm font-semibold text-green-600">{maxPIV.toFixed(3)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Lowest PIV:</span>
                              <span className="text-sm font-semibold text-red-600">{minPIV.toFixed(3)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Tournament Data</h3>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Total Matches:</span>
                              <span className="text-sm font-semibold">148</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Total Rounds:</span>
                              <span className="text-sm font-semibold">1,554</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-500">Data Source:</span>
                              <span className="text-sm font-semibold">IEM Katowice 2025</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white shadow rounded-lg p-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Insights</h3>
                          <div className="space-y-3">
                            <div className="text-sm">
                              <span className="text-gray-500">Top Performer:</span>
                              <div className="font-semibold">{players.sort((a, b) => (b.piv || 0) - (a.piv || 0))[0]?.name}</div>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-500">Best Team:</span>
                              <div className="font-semibold">{teams.sort((a, b) => (b.tir || 0) - (a.tir || 0))[0]?.name}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">Advanced Analytics</h3>
                          <p className="text-sm text-gray-500">Comprehensive performance analysis</p>
                        </div>
                        <div className="p-6">
                          <p className="text-gray-600">
                            Advanced analytics features including performance trends, role effectiveness analysis, 
                            team chemistry metrics, and predictive modeling are available in the full application.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                function ComparisonView({ players }) {
                  const [player1, setPlayer1] = useState('');
                  const [player2, setPlayer2] = useState('');

                  const player1Data = players.find(p => p.name === player1);
                  const player2Data = players.find(p => p.name === player2);

                  return (
                    <div className="px-4 py-6 sm:px-0">
                      <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">Player Comparison</h3>
                          <p className="text-sm text-gray-500">Compare player performance metrics</p>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Player 1</label>
                              <select 
                                value={player1} 
                                onChange={(e) => setPlayer1(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="">Select Player 1</option>
                                {players.map(player => (
                                  <option key={player.name} value={player.name}>
                                    {player.name} ({player.team})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Player 2</label>
                              <select 
                                value={player2} 
                                onChange={(e) => setPlayer2(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="">Select Player 2</option>
                                {players.map(player => (
                                  <option key={player.name} value={player.name}>
                                    {player.name} ({player.team})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {player1Data && player2Data && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="border rounded-lg p-4">
                                <h4 className="font-semibold text-lg mb-2">{player1Data.name}</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Team:</span>
                                    <span className="font-medium">{player1Data.team}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Role:</span>
                                    <span className="font-medium">{player1Data.role}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>PIV Score:</span>
                                    <span className="font-bold text-blue-600">{(player1Data.piv || 0).toFixed(3)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>K/D Ratio:</span>
                                    <span className="font-medium">{(player1Data.kd || 0).toFixed(2)}</span>
                                  </div>
                                  {player1Data.isIGL && (
                                    <div className="text-sm text-yellow-600 font-medium">Team Leader (IGL)</div>
                                  )}
                                </div>
                              </div>

                              <div className="border rounded-lg p-4">
                                <h4 className="font-semibold text-lg mb-2">{player2Data.name}</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Team:</span>
                                    <span className="font-medium">{player2Data.team}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Role:</span>
                                    <span className="font-medium">{player2Data.role}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>PIV Score:</span>
                                    <span className="font-bold text-blue-600">{(player2Data.piv || 0).toFixed(3)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>K/D Ratio:</span>
                                    <span className="font-medium">{(player2Data.kd || 0).toFixed(2)}</span>
                                  </div>
                                  {player2Data.isIGL && (
                                    <div className="text-sm text-yellow-600 font-medium">Team Leader (IGL)</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {(!player1 || !player2) && (
                            <div className="text-center py-8 text-gray-500">
                              Select two players to compare their performance metrics
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                function PredictionsView({ teams }) {
                  const [teamA, setTeamA] = useState('');
                  const [teamB, setTeamB] = useState('');
                  const [prediction, setPrediction] = useState(null);

                  const teamAData = teams.find(t => t.name === teamA);
                  const teamBData = teams.find(t => t.name === teamB);

                  const predictMatch = () => {
                    if (!teamAData || !teamBData) return;

                    const teamAStrength = (teamAData.tir || 0) + Math.random() * 0.1;
                    const teamBStrength = (teamBData.tir || 0) + Math.random() * 0.1;
                    const total = teamAStrength + teamBStrength;

                    setPrediction({
                      teamA: {
                        name: teamAData.name,
                        winProbability: (teamAStrength / total * 100).toFixed(1),
                        tir: teamAData.tir || 0,
                        avgPIV: teamAData.averagePIV || 0
                      },
                      teamB: {
                        name: teamBData.name,
                        winProbability: (teamBStrength / total * 100).toFixed(1),
                        tir: teamBData.tir || 0,
                        avgPIV: teamBData.averagePIV || 0
                      }
                    });
                  };

                  return (
                    <div className="px-4 py-6 sm:px-0">
                      <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">Match Prediction Engine</h3>
                          <p className="text-sm text-gray-500">AI-powered match outcome predictions based on TIR and PIV analysis</p>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Team A</label>
                              <select 
                                value={teamA} 
                                onChange={(e) => setTeamA(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="">Select Team A</option>
                                {teams.map(team => (
                                  <option key={team.name} value={team.name}>{team.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-400 mb-2">VS</div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Team B</label>
                              <select 
                                value={teamB} 
                                onChange={(e) => setTeamB(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="">Select Team B</option>
                                {teams.map(team => (
                                  <option key={team.name} value={team.name}>{team.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="text-center mb-6">
                            <button 
                              onClick={predictMatch}
                              disabled={!teamA || !teamB}
                              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-6 rounded-md"
                            >
                              Predict Match Outcome
                            </button>
                          </div>

                          {prediction && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                              <div className="border rounded-lg p-6 text-center">
                                <h4 className="text-xl font-bold mb-2">{prediction.teamA.name}</h4>
                                <div className="text-4xl font-bold text-green-600 mb-2">{prediction.teamA.winProbability}%</div>
                                <div className="text-sm text-gray-500 mb-4">Win Probability</div>
                                <div className="space-y-1 text-sm">
                                  <div>TIR: {prediction.teamA.tir.toFixed(3)}</div>
                                  <div>Avg PIV: {prediction.teamA.avgPIV.toFixed(3)}</div>
                                </div>
                              </div>

                              <div className="border rounded-lg p-6 text-center">
                                <h4 className="text-xl font-bold mb-2">{prediction.teamB.name}</h4>
                                <div className="text-4xl font-bold text-red-600 mb-2">{prediction.teamB.winProbability}%</div>
                                <div className="text-sm text-gray-500 mb-4">Win Probability</div>
                                <div className="space-y-1 text-sm">
                                  <div>TIR: {prediction.teamB.tir.toFixed(3)}</div>
                                  <div>Avg PIV: {prediction.teamB.avgPIV.toFixed(3)}</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {!prediction && (teamA || teamB) && (
                            <div className="text-center py-8 text-gray-500">
                              Select both teams and click "Predict Match Outcome" to see AI analysis
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                function ScoutView({ players }) {
                  const [searchTerm, setSearchTerm] = useState('');
                  const [roleFilter, setRoleFilter] = useState('');
                  
                  const roles = [...new Set(players.map(p => p.role))].filter(Boolean).sort();
                  
                  const filteredPlayers = players
                    .filter(p => 
                      (!searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       p.team.toLowerCase().includes(searchTerm.toLowerCase())) &&
                      (!roleFilter || p.role === roleFilter)
                    )
                    .sort((a, b) => (b.piv || 0) - (a.piv || 0));

                  return (
                    <div className="px-4 py-6 sm:px-0">
                      <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900">Player Scout</h3>
                          <p className="text-sm text-gray-500">Advanced player discovery and talent identification</p>
                        </div>
                        <div className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Search Players</label>
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by name or team..."
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                              <select 
                                value={roleFilter} 
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="">All Roles</option>
                                {roles.map(role => (
                                  <option key={role} value={role}>{role}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mb-4">
                            <div className="text-sm text-gray-600">
                              Showing {filteredPlayers.length} of {players.length} players
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredPlayers.map((player) => (
                              <div key={player.name} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="font-semibold text-gray-900">{player.name}</div>
                                    <div className="text-sm text-gray-500">{player.team}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-blue-600">{(player.piv || 0).toFixed(3)}</div>
                                    <div className="text-xs text-gray-500">PIV</div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className={\`inline-flex items-center px-2 py-1 rounded text-xs font-medium \${
                                      player.role === 'AWPer' ? 'bg-blue-100 text-blue-800' :
                                      player.role === 'Entry Fragger' ? 'bg-red-100 text-red-800' :
                                      player.role === 'Support' ? 'bg-green-100 text-green-800' :
                                      player.role === 'Lurker' ? 'bg-purple-100 text-purple-800' :
                                      'bg-gray-100 text-gray-800'
                                    }\`}>
                                      {player.role}
                                    </span>
                                    <span className="text-sm text-gray-600">K/D: {(player.kd || 0).toFixed(2)}</span>
                                  </div>
                                  
                                  {player.isIGL && (
                                    <div>
                                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Team Leader (IGL)
                                      </span>
                                    </div>
                                  )}
                                  
                                  <div className="pt-2 border-t border-gray-100">
                                    <div className="text-xs text-gray-500">
                                      Scout Rating: <span className="font-semibold text-gray-700">
                                        {player.piv > 1.5 ? 'Elite' : 
                                         player.piv > 1.2 ? 'Excellent' : 
                                         player.piv > 1.0 ? 'Good' : 
                                         player.piv > 0.8 ? 'Average' : 'Below Average'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {filteredPlayers.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              No players found matching your search criteria
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                ReactDOM.render(<App />, document.getElementById('root'));
              </script>
            </body>
            </html>
          `);
        }
      });
    }
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    console.log(`serving on port ${port}`);
  });
})();