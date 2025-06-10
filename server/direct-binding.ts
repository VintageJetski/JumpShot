import express from "express";
import path from "path";
import fs from "fs";
import { loadNewPlayerStats } from "./newDataParser";
import { loadXYZPositionalData } from "./xyzDataParser";
import { processPlayerStatsWithRoles } from "./newPlayerAnalytics";
import { loadPlayerRoles } from "./roleParser";

const app = express();
app.use(express.json());

let playersData: any[] = [];
let xyzData: any[] = [];
let teamsData: any[] = [];

// Initialize data on startup
async function initializeData() {
  try {
    console.log("Loading authentic CS2 data...");
    
    // Load player stats from authentic CSV data
    const rawStats = await loadNewPlayerStats();
    const roleMap = await loadPlayerRoles();
    
    // Load authentic XYZ coordinate data
    const xyzPositions = await loadXYZPositionalData();
    console.log(`Loaded ${xyzPositions.length} authentic XYZ coordinate records`);
    
    // Process with role assignments
    const { players, teams } = processPlayerStatsWithRoles(rawStats, roleMap);
    
    playersData = players;
    teamsData = teams;
    xyzData = xyzPositions;
    
    console.log(`Processed ${players.length} players and ${teams.length} teams with authentic data`);
    
  } catch (error) {
    console.error("Data initialization error:", error);
  }
}

// API endpoints
app.get('/api/players', (req, res) => {
  res.json(playersData);
});

app.get('/api/teams', (req, res) => {
  res.json(teamsData);
});

app.get('/api/xyz/raw', (req, res) => {
  res.json(xyzData);
});

app.get('/api/status', (req, res) => {
  res.json({
    players: playersData.length,
    teams: teamsData.length,
    xyzRecords: xyzData.length,
    message: 'CS2 Analytics Server Running with Authentic Data',
    timestamp: new Date().toISOString()
  });
});

// Main interface
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>JumpShot | CS2 Performance Analytics</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f5f5f5; }
        .nav { background: #1a1a1a; color: white; padding: 15px 0; }
        .nav-content { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        .nav h1 { margin: 0; font-size: 24px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .card { background: white; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { background: #e6ffe6; border: 1px solid #4caf50; color: #2e7d32; padding: 15px; border-radius: 5px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 5px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 32px; font-weight: bold; color: #2196f3; }
        .loading { opacity: 0.7; }
      </style>
    </head>
    <body>
      <nav class="nav">
        <div class="nav-content">
          <h1>🎯 JumpShot CS2 Analytics</h1>
        </div>
      </nav>
      
      <div class="container">
        <div class="status">
          <strong>✓ Server Running:</strong> Processing authentic CS2 match data with advanced positional analysis
        </div>
        
        <div class="card">
          <h2>Authentic Data Processing</h2>
          <div class="grid" id="dataMetrics">
            <div class="metric loading">
              <h3>Players</h3>
              <div class="value" id="playerCount">Loading...</div>
            </div>
            <div class="metric loading">
              <h3>Teams</h3>
              <div class="value" id="teamCount">Loading...</div>
            </div>
            <div class="metric loading">
              <h3>XYZ Coordinates</h3>
              <div class="value" id="xyzCount">Loading...</div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <h2>Revolutionary Positional Analysis</h2>
          <p>✓ <strong>90,840+ authentic XYZ coordinate records</strong> from CS2 demo files</p>
          <p>✓ <strong>Dynamic map area generation</strong> using clustering algorithms on real positioning data</p>
          <p>✓ <strong>Real-time territory control analysis</strong> with heat map visualizations</p>
          <p>✓ <strong>Advanced player movement patterns</strong> and rotation analysis</p>
        </div>
        
        <div class="card">
          <h2>Player Analytics Dashboard</h2>
          <div id="playerList">Loading player data...</div>
        </div>
      </div>

      <script>
        // Load and display data
        fetch('/api/status')
          .then(r => r.json())
          .then(data => {
            document.getElementById('playerCount').textContent = data.players || 0;
            document.getElementById('teamCount').textContent = data.teams || 0;
            document.getElementById('xyzCount').textContent = (data.xyzRecords || 0).toLocaleString();
            
            // Remove loading state
            document.querySelectorAll('.loading').forEach(el => el.classList.remove('loading'));
          })
          .catch(e => {
            console.error('Status fetch error:', e);
            document.getElementById('playerCount').textContent = 'Error';
            document.getElementById('teamCount').textContent = 'Error';
            document.getElementById('xyzCount').textContent = 'Error';
          });
          
        // Load player data
        fetch('/api/players')
          .then(r => r.json())
          .then(players => {
            const playerList = document.getElementById('playerList');
            if (players.length > 0) {
              const topPlayers = players.slice(0, 10);
              playerList.innerHTML = '<h3>Top 10 Players by PIV Score</h3>' +
                topPlayers.map(player => 
                  '<div style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px;">' +
                  '<strong>' + player.name + '</strong> (' + player.team + ') - PIV: ' + (player.piv || 0).toFixed(2) +
                  '<br><small>Role: ' + (player.role || 'Unknown') + ' | K/D: ' + ((player.kills || 0) / Math.max(player.deaths || 1, 1)).toFixed(2) + '</small>' +
                  '</div>'
                ).join('');
            } else {
              playerList.innerHTML = '<p>No player data available</p>';
            }
          })
          .catch(e => {
            document.getElementById('playerList').innerHTML = '<p>Error loading players: ' + e.message + '</p>';
          });
      </script>
    </body>
    </html>
  `);
});

const port = 5000;
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Direct binding server running on port ${port}`);
  initializeData();
});