import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  
  // Serve the built-in HTML dashboard for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CS2 Analytics Platform</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; line-height: 1.6; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: bold; color: #111827; }
            .subtitle { color: #6b7280; font-size: 14px; }
            .nav { display: flex; gap: 16px; }
            .nav a { color: #2563eb; text-decoration: none; font-weight: 500; }
            .nav a:hover { color: #1d4ed8; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
            .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .stat { display: flex; align-items: center; }
            .stat-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 16px; }
            .stat-label { font-size: 14px; color: #6b7280; margin-bottom: 4px; }
            .stat-value { font-size: 24px; font-weight: 600; color: #111827; }
            .loading { text-align: center; padding: 40px; }
            .spinner { width: 40px; height: 40px; border: 3px solid #e5e7eb; border-top: 3px solid #2563eb; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .players-grid, .teams-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; }
            .player-item, .team-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; }
            .player-info, .team-info { flex: 1; }
            .player-name, .team-name { font-weight: 600; color: #111827; }
            .player-details, .team-details { font-size: 12px; color: #6b7280; }
            .player-score, .team-score { text-align: right; font-weight: 600; }
            .piv { color: #2563eb; }
            .tir { color: #059669; }
            .role-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; margin-left: 4px; }
            .role-awper { background: #dbeafe; color: #1e40af; }
            .role-entry { background: #fecaca; color: #dc2626; }
            .role-support { background: #d1fae5; color: #065f46; }
            .role-lurker { background: #e9d5ff; color: #7c2d12; }
            .role-igl { background: #fef3c7; color: #92400e; }
            h2 { color: #111827; margin-bottom: 16px; font-size: 18px; }
            h3 { color: #374151; margin-bottom: 12px; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div>
                <div class="title">CS2 Analytics Platform</div>
                <div class="subtitle">IEM Katowice 2025 Tournament Data</div>
              </div>
              <div class="nav">
                <a href="#" onclick="showPlayers()">Players</a>
                <a href="#" onclick="showTeams()">Teams</a>
                <a href="#" onclick="showDashboard()">Dashboard</a>
              </div>
            </div>
            
            <div id="loading" class="loading">
              <div class="spinner"></div>
              <div>Loading CS2 Analytics...</div>
            </div>

            <div id="dashboard" style="display: none;">
              <div class="grid" id="stats-grid"></div>
              <div class="grid">
                <div class="card">
                  <h2>Top Players by PIV</h2>
                  <div id="top-players"></div>
                </div>
                <div class="card">
                  <h2>Top Teams by TIR</h2>
                  <div id="top-teams"></div>
                </div>
              </div>
              <div class="card">
                <h2>Role Distribution</h2>
                <div id="role-stats"></div>
              </div>
            </div>

            <div id="players-view" style="display: none;">
              <div class="card">
                <h2>All Players (<span id="player-count"></span>)</h2>
                <div id="all-players" class="players-grid"></div>
              </div>
            </div>

            <div id="teams-view" style="display: none;">
              <div class="card">
                <h2>All Teams (<span id="team-count"></span>)</h2>
                <div id="all-teams" class="teams-grid"></div>
              </div>
            </div>
          </div>

          <script>
            let playersData = [];
            let teamsData = [];

            function getRoleBadge(role, isIGL) {
              const badges = [];
              if (role) {
                const className = 'role-' + role.toLowerCase().replace(' ', '').replace('fragger', '');
                badges.push(\`<span class="role-badge \${className}">\${role}</span>\`);
              }
              if (isIGL) {
                badges.push('<span class="role-badge role-igl">IGL</span>');
              }
              return badges.join('');
            }

            function showDashboard() {
              document.getElementById('dashboard').style.display = 'block';
              document.getElementById('players-view').style.display = 'none';
              document.getElementById('teams-view').style.display = 'none';
              renderDashboard();
            }

            function showPlayers() {
              document.getElementById('dashboard').style.display = 'none';
              document.getElementById('players-view').style.display = 'block';
              document.getElementById('teams-view').style.display = 'none';
              renderAllPlayers();
            }

            function showTeams() {
              document.getElementById('dashboard').style.display = 'none';
              document.getElementById('players-view').style.display = 'none';
              document.getElementById('teams-view').style.display = 'block';
              renderAllTeams();
            }

            function renderDashboard() {
              const topPlayers = playersData.sort((a,b) => (b.piv||0) - (a.piv||0)).slice(0,15);
              const topTeams = teamsData.sort((a,b) => (b.tir||0) - (a.tir||0)).slice(0,10);
              
              // Stats
              document.getElementById('stats-grid').innerHTML = \`
                <div class="card">
                  <div class="stat">
                    <div class="stat-icon" style="background: #2563eb;">P</div>
                    <div>
                      <div class="stat-label">Total Players</div>
                      <div class="stat-value">\${playersData.length}</div>
                    </div>
                  </div>
                </div>
                <div class="card">
                  <div class="stat">
                    <div class="stat-icon" style="background: #059669;">T</div>
                    <div>
                      <div class="stat-label">Total Teams</div>
                      <div class="stat-value">\${teamsData.length}</div>
                    </div>
                  </div>
                </div>
                <div class="card">
                  <div class="stat">
                    <div class="stat-icon" style="background: #7c3aed;">M</div>
                    <div>
                      <div class="stat-label">Matches</div>
                      <div class="stat-value">148</div>
                    </div>
                  </div>
                </div>
                <div class="card">
                  <div class="stat">
                    <div class="stat-icon" style="background: #dc2626;">R</div>
                    <div>
                      <div class="stat-label">Rounds</div>
                      <div class="stat-value">1,554</div>
                    </div>
                  </div>
                </div>
              \`;

              // Top Players
              document.getElementById('top-players').innerHTML = topPlayers.map((player, i) => \`
                <div class="player-item">
                  <div class="player-info">
                    <div class="player-name">#\${i+1} \${player.name}</div>
                    <div class="player-details">\${player.team} \${getRoleBadge(player.role, player.isIGL)}</div>
                  </div>
                  <div class="player-score">
                    <div class="piv">\${(player.piv||0).toFixed(3)}</div>
                    <div class="player-details">K/D: \${(player.stats?.kdRatio||0).toFixed(2)}</div>
                  </div>
                </div>
              \`).join('');

              // Top Teams
              document.getElementById('top-teams').innerHTML = topTeams.map((team, i) => \`
                <div class="team-item">
                  <div class="team-info">
                    <div class="team-name">#\${i+1} \${team.name}</div>
                    <div class="team-details">\${team.players?.length || 0} players</div>
                  </div>
                  <div class="team-score">
                    <div class="tir">\${(team.tir||0).toFixed(3)}</div>
                    <div class="team-details">Avg PIV: \${(team.averagePIV||0).toFixed(3)}</div>
                  </div>
                </div>
              \`).join('');

              // Role Stats
              const roleStats = {
                awpers: playersData.filter(p => p.role === 'AWPer').length,
                entryFraggers: playersData.filter(p => p.role === 'Entry Fragger').length,
                supports: playersData.filter(p => p.role === 'Support').length,
                lurkers: playersData.filter(p => p.role === 'Lurker').length,
                igls: playersData.filter(p => p.isIGL).length,
              };

              document.getElementById('role-stats').innerHTML = \`
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px;">
                  <div style="text-align: center; padding: 16px; background: #dbeafe; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #1e40af;">\${roleStats.awpers}</div>
                    <div style="font-size: 14px; color: #1e40af;">AWPers</div>
                  </div>
                  <div style="text-align: center; padding: 16px; background: #fecaca; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #dc2626;">\${roleStats.entryFraggers}</div>
                    <div style="font-size: 14px; color: #dc2626;">Entry Fraggers</div>
                  </div>
                  <div style="text-align: center; padding: 16px; background: #d1fae5; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #065f46;">\${roleStats.supports}</div>
                    <div style="font-size: 14px; color: #065f46;">Support</div>
                  </div>
                  <div style="text-align: center; padding: 16px; background: #e9d5ff; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #7c2d12;">\${roleStats.lurkers}</div>
                    <div style="font-size: 14px; color: #7c2d12;">Lurkers</div>
                  </div>
                  <div style="text-align: center; padding: 16px; background: #fef3c7; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #92400e;">\${roleStats.igls}</div>
                    <div style="font-size: 14px; color: #92400e;">IGLs</div>
                  </div>
                </div>
              \`;
            }

            function renderAllPlayers() {
              document.getElementById('player-count').textContent = playersData.length;
              const sortedPlayers = playersData.sort((a,b) => (b.piv||0) - (a.piv||0));
              
              document.getElementById('all-players').innerHTML = sortedPlayers.map((player, i) => \`
                <div class="player-item">
                  <div class="player-info">
                    <div class="player-name">\${player.name}</div>
                    <div class="player-details">\${player.team} \${getRoleBadge(player.role, player.isIGL)}</div>
                  </div>
                  <div class="player-score">
                    <div class="piv">\${(player.piv||0).toFixed(3)}</div>
                    <div class="player-details">K/D: \${(player.stats?.kdRatio||0).toFixed(2)}</div>
                  </div>
                </div>
              \`).join('');
            }

            function renderAllTeams() {
              document.getElementById('team-count').textContent = teamsData.length;
              const sortedTeams = teamsData.sort((a,b) => (b.tir||0) - (a.tir||0));
              
              document.getElementById('all-teams').innerHTML = sortedTeams.map((team, i) => \`
                <div class="card">
                  <h3>\${team.name}</h3>
                  <div style="margin-bottom: 12px;">
                    <span class="tir" style="font-size: 18px; font-weight: bold;">TIR: \${(team.tir||0).toFixed(3)}</span>
                    <span style="margin-left: 16px; color: #6b7280;">Avg PIV: \${(team.averagePIV||0).toFixed(3)}</span>
                  </div>
                  <div>
                    \${(team.players||[]).map(p => \`
                      <div style="padding: 4px 0; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: space-between;">
                        <span>\${p.name} \${getRoleBadge(p.role, p.isIGL)}</span>
                        <span class="piv">\${(p.piv||0).toFixed(3)}</span>
                      </div>
                    \`).join('')}
                  </div>
                </div>
              \`).join('');
            }

            // Load data
            Promise.all([
              fetch('/api/players').then(r => r.json()),
              fetch('/api/teams').then(r => r.json())
            ]).then(([players, teams]) => {
              playersData = players;
              teamsData = teams;
              
              document.getElementById('loading').style.display = 'none';
              showDashboard();
            }).catch(error => {
              console.error('Error loading data:', error);
              document.getElementById('loading').innerHTML = '<div style="color: #dc2626;">Failed to load data. Please refresh the page.</div>';
            });
          </script>
        </body>
        </html>
      `);
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
