import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PlayerWithPIV, PlayerRole } from '@shared/schema';
import { BarChart2, Award, Shield, Target, Zap } from 'lucide-react';

interface PlayerImpactCardProps {
  player: PlayerWithPIV;
}

// Function to get role color
const getRoleColor = (role: string): string => {
  switch (role) {
    case PlayerRole.IGL: return 'bg-purple-500';
    case PlayerRole.AWP: return 'bg-amber-500';
    case PlayerRole.Spacetaker: return 'bg-orange-500';
    case PlayerRole.Lurker: return 'bg-blue-500';
    case PlayerRole.Anchor: return 'bg-teal-500';
    case PlayerRole.Support: return 'bg-green-500';
    case PlayerRole.Rotator: return 'bg-pink-500';
    default: return 'bg-gray-500';
  }
};

// Function to get role icon
const getRoleIcon = (role: string) => {
  switch (role) {
    case PlayerRole.IGL: return <Shield className="h-5 w-5 text-white" />;
    case PlayerRole.AWP: return <Target className="h-5 w-5 text-white" />;
    case PlayerRole.Spacetaker: return <Zap className="h-5 w-5 text-white" />;
    case PlayerRole.Lurker: return <Target className="h-5 w-5 text-white" />;
    case PlayerRole.Anchor: return <Shield className="h-5 w-5 text-white" />;
    case PlayerRole.Support: return <Shield className="h-5 w-5 text-white" />;
    case PlayerRole.Rotator: return <Shield className="h-5 w-5 text-white" />;
    default: return <Award className="h-5 w-5 text-white" />;
  }
};

const PlayerImpactCard: React.FC<PlayerImpactCardProps> = ({ player }) => {
  // Format PIV value (decimal to integer)
  const formattedPIV = Math.round(player.piv * 100);
  
  // Get role color and icon
  const roleColor = getRoleColor(player.role);
  const roleIcon = getRoleIcon(player.role);
  
  // Format K/D ratio
  const formattedKD = player.kd.toFixed(2);
  const kdColor = player.kd >= 1.0 ? 'text-green-400' : 'text-yellow-400';
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-primary">
            {player.team.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-medium">{player.name}</h3>
            <div className="flex items-center">
              <span className={`${roleColor} text-white text-xs px-2 py-0.5 rounded-full`}>
                {player.role}
              </span>
              {player.isIGL && (
                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
                  IGL
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">PIV</p>
                <p className="text-2xl font-bold mt-1">{formattedPIV}</p>
              </div>
              <div className={`w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center`}>
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">K/D</p>
                <p className={`text-2xl font-bold mt-1 ${kdColor}`}>{formattedKD}</p>
              </div>
              <div className={`w-10 h-10 rounded-full ${roleColor} flex items-center justify-center`}>
                {roleIcon}
              </div>
            </div>
          </div>
        </div>

        {/* Primary metric display */}
        <div className="mt-3 bg-gray-900 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-400">{player.primaryMetric.name}</p>
              <p className="text-lg font-medium mt-1">{player.primaryMetric.value.toFixed(2)}</p>
            </div>
            <div className="text-sm text-gray-400">Primary Metric</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerImpactCard;