import { useQuery } from '@tanstack/react-query';

export default function TestPage() {
  const { data: players, isLoading } = useQuery({
    queryKey: ['/api/players'],
    queryFn: async () => {
      const response = await fetch('/api/players');
      return response.json();
    }
  });

  if (isLoading) {
    return <div className="p-8">Loading CS2 player data...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">CS2 Analytics Platform</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Player Data Status</h2>
        <p className="mb-2">Successfully loaded {players?.length || 0} players</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {players?.slice(0, 6).map((player: any) => (
            <div key={player.playerName} className="border rounded p-3">
              <h3 className="font-medium">{player.playerName}</h3>
              <p className="text-sm text-gray-600">{player.team}</p>
              <p className="text-sm">PIV: {player.piv?.toFixed(2) || 'N/A'}</p>
              <p className="text-sm">Role: {player.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}