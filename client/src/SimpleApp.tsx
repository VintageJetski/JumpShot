import { useState, useEffect } from "react";

export default function SimpleApp() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const playersResponse = await fetch('/api/players');
        const teamsResponse = await fetch('/api/teams');
        
        if (!playersResponse.ok || !teamsResponse.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const players = await playersResponse.json();
        const teams = await teamsResponse.json();
        
        setData({ players, teams });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid #e5e7eb',
            borderTop: '3px solid #2563eb',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280' }}>Loading CS2 Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '8px' }}>Error Loading Data</h1>
          <p style={{ color: '#6b7280' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { players, teams } = data;
  const topPlayers = players.sort((a: any, b: any) => (b.piv || 0) - (a.piv || 0)).slice(0, 10);
  const topTeams = teams.sort((a: any, b: any) => (b.tir || 0) - (a.tir || 0)).slice(0, 8);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '0 16px'
      }}>
        <div style={{ 
          maxWidth: '1280px', 
          margin: '0 auto', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          height: '64px'
        }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            CS2 Analytics Platform
          </h1>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            IEM Katowice 2025 Data
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#2563eb',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                marginRight: '16px'
              }}>
                P
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Total Players
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  {players.length}
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#059669',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                marginRight: '16px'
              }}>
                T
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Total Teams
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  {teams.length}
                </div>
              </div>
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '20px', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#7c3aed',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                marginRight: '16px'
              }}>
                M
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                  Tournament Matches
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  148
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '24px'
        }}>
          {/* Top Players */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '24px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '16px',
              marginTop: 0
            }}>
              Top Players by PIV
            </h3>
            <div>
              {topPlayers.map((player: any, index: number) => (
                <div key={player.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < topPlayers.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      width: '24px'
                    }}>
                      #{index + 1}
                    </span>
                    <div style={{ marginLeft: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {player.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {player.team} • {player.role}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb' }}>
                      {(player.piv || 0).toFixed(3)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      K/D: {(player.stats?.kdRatio || 0).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Teams */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '24px'
          }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: '#111827',
              marginBottom: '16px',
              marginTop: 0
            }}>
              Top Teams by TIR
            </h3>
            <div>
              {topTeams.map((team: any, index: number) => (
                <div key={team.name} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < topTeams.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '500', 
                      color: '#6b7280',
                      width: '24px'
                    }}>
                      #{index + 1}
                    </span>
                    <div style={{ marginLeft: '12px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                        {team.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        {team.players?.length || 0} players
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#059669' }}>
                      {(team.tir || 0).toFixed(3)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Avg PIV: {(team.averagePIV || 0).toFixed(3)}
                    </div>
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