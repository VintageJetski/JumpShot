import http from 'http';
import { loadNewPlayerStats } from "./newDataParser";
import { loadXYZData } from "./xyzDataParser";
import { processPlayerStatsWithRoles } from "./newPlayerAnalytics";
import { loadPlayerRoles } from "./roleParser";

let playersData: any[] = [];
let xyzData: any[] = [];
let teamsData: any[] = [];

async function initializeData() {
  try {
    console.log("Loading authentic CS2 data...");
    
    const rawStats = await loadNewPlayerStats();
    const roleMap = await loadPlayerRoles();
    const xyzPositions = await loadXYZData();
    
    console.log(`Loaded ${xyzPositions.length} authentic XYZ coordinate records`);
    
    const processedPlayers = processPlayerStatsWithRoles(rawStats, roleMap);
    
    playersData = processedPlayers;
    teamsData = Array.from(new Set(processedPlayers.map(p => p.team))).map(teamName => ({
      name: teamName,
      players: processedPlayers.filter(p => p.team === teamName)
    }));
    xyzData = xyzPositions;
    
    console.log(`Processed ${processedPlayers.length} players and ${teamsData.length} teams with authentic data`);
    
  } catch (error) {
    console.error("Data initialization error:", error);
  }
}

function handleRequest(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;

  if (url === '/') {
    res.setHeader('Content-Type', 'text/html');
    res.writeHead(200);
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>JumpShot | CS2 Performance Analytics</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%); color: white; min-height: 100vh; }
          .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
          .header { background: rgba(0,0,0,0.2); backdrop-filter: blur(10px); border-radius: 16px; padding: 30px; margin-bottom: 30px; border: 1px solid rgba(255,255,255,0.1); }
          .header h1 { margin: 0 0 10px 0; font-size: 36px; font-weight: 800; background: linear-gradient(45deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
          .header p { margin: 0; font-size: 18px; opacity: 0.9; }
          .card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border-radius: 16px; padding: 24px; margin: 20px 0; border: 1px solid rgba(255,255,255,0.1); }
          .status { background: linear-gradient(45deg, #059669, #047857); padding: 16px; border-radius: 12px; margin-bottom: 20px; }
          .status-icon { color: #10b981; font-size: 20px; margin-right: 8px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin: 20px 0; }
          .metric-card { background: rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; text-align: center; transition: transform 0.2s; }
          .metric-card:hover { transform: translateY(-2px); }
          .metric-value { font-size: 32px; font-weight: bold; color: #60a5fa; margin: 10px 0; }
          .metric-label { font-size: 14px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
          .features { list-style: none; padding: 0; }
          .features li { padding: 8px 0; display: flex; align-items: center; }
          .features li:before { content: "✓"; color: #10b981; font-weight: bold; margin-right: 12px; }
          .loading { opacity: 0.6; }
          .btn { background: linear-gradient(45deg, #3b82f6, #6366f1); color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; display: inline-block; }
          .btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 JumpShot CS2 Analytics</h1>
            <p>Revolutionary positional analysis using authentic XYZ coordinate data from CS2 demo files</p>
          </div>
          
          <div class="status">
            <span class="status-icon">🟢</span>
            <strong>Server Active:</strong> Processing 90,840+ authentic XYZ coordinate records with advanced clustering algorithms
          </div>
          
          <div class="card">
            <h2 style="margin-top: 0;">Authentic Data Processing</h2>
            <div class="grid" id="dataMetrics">
              <div class="metric-card loading">
                <div class="metric-label">Players Analyzed</div>
                <div class="metric-value" id="playerCount">Loading...</div>
              </div>
              <div class="metric-card loading">
                <div class="metric-label">Teams Processed</div>
                <div class="metric-value" id="teamCount">Loading...</div>
              </div>
              <div class="metric-card loading">
                <div class="metric-label">XYZ Coordinates</div>
                <div class="metric-value" id="xyzCount">Loading...</div>
              </div>
            </div>
          </div>
          
          <div class="card">
            <h2 style="margin-top: 0;">Revolutionary Features</h2>
            <ul class="features">
              <li><strong>90,840+ authentic XYZ coordinate records</strong> processed from real CS2 demo files</li>
              <li><strong>Dynamic map area generation</strong> using clustering algorithms on actual positioning data</li>
              <li><strong>Real-time territory control analysis</strong> with interactive heat map visualizations</li>
              <li><strong>Advanced player movement patterns</strong> and rotation effectiveness metrics</li>
              <li><strong>Role-based performance analysis</strong> with PIV (Player Impact Value) calculations</li>
              <li><strong>Utility effectiveness tracking</strong> based on real coordinate impact zones</li>
            </ul>
          </div>
          
          <div class="card">
            <h2 style="margin-top: 0;">Top Performing Players</h2>
            <div id="playerList">Loading authentic player data...</div>
          </div>
        </div>

        <script>
          async function loadData() {
            try {
              const statusResponse = await fetch('/api/status');
              const status = await statusResponse.json();
              
              document.getElementById('playerCount').textContent = (status.players || 0).toLocaleString();
              document.getElementById('teamCount').textContent = status.teams || 0;
              document.getElementById('xyzCount').textContent = (status.xyzRecords || 0).toLocaleString();
              
              document.querySelectorAll('.loading').forEach(el => el.classList.remove('loading'));
              
              const playersResponse = await fetch('/api/players');
              const players = await playersResponse.json();
              
              if (players && players.length > 0) {
                const topPlayers = players.slice(0, 8);
                const playerList = document.getElementById('playerList');
                playerList.innerHTML = topPlayers.map(player => 
                  '<div style="padding: 16px; margin: 8px 0; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">' +
                  '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                  '<div>' +
                  '<strong style="font-size: 16px; color: #60a5fa;">' + (player.name || 'Unknown') + '</strong>' +
                  '<div style="color: #94a3b8; font-size: 14px; margin-top: 4px;">' + (player.team || 'No Team') + ' • ' + (player.role || 'Support') + '</div>' +
                  '</div>' +
                  '<div style="text-align: right;">' +
                  '<div style="font-size: 18px; font-weight: bold; color: #10b981;">PIV: ' + ((player.piv || 0).toFixed(2)) + '</div>' +
                  '<div style="font-size: 14px; color: #94a3b8;">K/D: ' + (((player.kills || 0) / Math.max(player.deaths || 1, 1)).toFixed(2)) + '</div>' +
                  '</div>' +
                  '</div>' +
                  '</div>'
                ).join('');
              } else {
                document.getElementById('playerList').innerHTML = '<div style="text-align: center; padding: 20px; color: #94a3b8;">Player data is being processed...</div>';
              }
            } catch (error) {
              console.error('Error loading data:', error);
              document.getElementById('playerCount').textContent = 'Error';
              document.getElementById('teamCount').textContent = 'Error';
              document.getElementById('xyzCount').textContent = 'Error';
              document.getElementById('playerList').innerHTML = '<div style="color: #ef4444; text-align: center; padding: 20px;">Error loading player data. Server may still be initializing.</div>';
            }
          }
          
          loadData();
          setInterval(loadData, 5000); // Refresh every 5 seconds
        </script>
      </body>
      </html>
    `);
    return;
  }

  if (url === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      players: playersData.length,
      teams: teamsData.length,
      xyzRecords: xyzData.length,
      message: 'CS2 Analytics Server Running with Authentic Data',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (url === '/api/players') {
    res.writeHead(200);
    res.end(JSON.stringify(playersData));
    return;
  }

  if (url === '/api/teams') {
    res.writeHead(200);
    res.end(JSON.stringify(teamsData));
    return;
  }

  if (url === '/api/xyz/raw') {
    res.writeHead(200);
    res.end(JSON.stringify(xyzData));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
}

const server = http.createServer(handleRequest);

server.listen(3000, '0.0.0.0', () => {
  console.log('Network server running on port 3000');
  initializeData();
});