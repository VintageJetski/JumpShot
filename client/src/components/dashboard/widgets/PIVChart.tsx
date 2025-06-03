import { PlayerWithPIV } from '../../../../shared/schema';

interface PIVChartProps {
  players: PlayerWithPIV[];
}

export default function PIVChart({ players }: PIVChartProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">PIV Comparison Chart</h3>
      <p className="text-xs text-gray-400">
        This widget will display a chart comparing PIV values between selected players.
      </p>
    </div>
  );
}