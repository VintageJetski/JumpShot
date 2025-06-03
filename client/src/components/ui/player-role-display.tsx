import { PlayerWithPIV } from "../../../shared/schema";

interface PlayerRoleDisplayProps {
  player: PlayerWithPIV;
}

export function PlayerRoleDisplay({ player }: PlayerRoleDisplayProps) {
  return (
    <div className="text-gray-400 text-[10px] flex items-center gap-1">
      <span className="bg-primary/10 text-primary px-1 rounded">{player.role}</span>
      <span className="bg-orange-500/20 text-orange-500 px-1 rounded">T: {player.tRole}</span>
      <span className="bg-blue-500/20 text-blue-500 px-1 rounded">CT: {player.ctRole}</span>
      {player.isIGL && <span className="bg-purple-500/20 text-purple-400 px-1 rounded">IGL</span>}
    </div>
  );
}

export function PlayerStatsDisplay({ player }: PlayerRoleDisplayProps) {
  return (
    <div className="text-gray-400 text-[10px]">
      KD: {player.kd.toFixed(2)}
    </div>
  );
}