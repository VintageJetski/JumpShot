import { PlayerWithPIV } from '../../../../shared/schema';

interface PlayerPerformanceProps {
  player: PlayerWithPIV;
}

export default function PlayerPerformance({ player }: PlayerPerformanceProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Performance Metrics</h3>
      <p className="text-xs text-gray-400">
        This widget will display detailed performance metrics for {player.name}.
      </p>
    </div>
  );
}