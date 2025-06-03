import { useState, useEffect } from 'react';

interface Player {
  playerName: string;
  team: string;
  piv: number;
  role: string;
  stats: any;
}

interface Team {
  name: string;
  tir: number;
  averagePIV: number;
  players: Player[];
}

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/players').then(res => res.json()),
      fetch('/api/teams').then(res => res.json())
    ])
    .then(([playersData, teamsData]) => {
      setPlayers(playersData);
      setTeams(teamsData);
      setLoading(false);
    })
    .catch(err => {
      setError(err.message);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>CS2 Analytics Platform</h1>
        <p>Loading tournament data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>CS2 Analytics Platform</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header style={{ marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
        <h1 style={{ margin: 0, color: '#333' }}>CS2 Analytics Platform</h1>
        <p style={{ margin: '10px 0 0 0', color: '#666' }}>IEM Katowice 2025 Tournament Analysis</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Tournament Overview</h2>
          <p><strong>Players Analyzed:</strong> {players.length}</p>
          <p><strong>Teams:</strong> {teams.length}</p>
          <p><strong>Analytics:</strong> PIV (Player Impact Value)</p>
        </div>

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
          <h2 style={{ marginTop: 0 }}>Data Status</h2>
          <p><strong>Source:</strong> CSV Files</p>
          <p><strong>Tournament:</strong> IEM Katowice 2025</p>
          <p><strong>Metrics:</strong> TIR (Team Impact Rating)</p>
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Top Players by PIV</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
          {players.slice(0, 12).map((player, index) => (
            <div key={player.playerName} style={{ 
              background: 'white', 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>{player.playerName}</h3>
                <span style={{ 
                  background: '#007bff', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px' 
                }}>
                  #{index + 1}
                </span>
              </div>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Team:</strong> {player.team}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                <strong>PIV:</strong> {player.piv?.toFixed(3) || 'N/A'}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                <strong>Role:</strong> {player.role}
              </p>
              <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                <strong>K/D:</strong> {player.stats?.kd?.toFixed(2) || 'N/A'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2>Team Rankings</h2>
        <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
          {teams.slice(0, 10).map((team, index) => (
            <div key={team.name} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '15px 20px',
              borderBottom: index < 9 ? '1px solid #eee' : 'none',
              background: index % 2 === 0 ? '#f8f9fa' : 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#666', minWidth: '30px' }}>
                  #{index + 1}
                </span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>{team.name}</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#666' }}>
                    {team.players?.length || 0} players
                  </p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#007bff' }}>
                  TIR: {team.tir?.toFixed(3) || 'N/A'}
                </p>
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#666' }}>
                  Avg PIV: {team.averagePIV?.toFixed(3) || 'N/A'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;