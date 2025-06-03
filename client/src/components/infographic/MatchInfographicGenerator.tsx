import React, { useRef } from 'react';
import { TeamWithTIR, TeamRoundMetrics, PlayerWithPIV, PlayerRole } from '../../../shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import RoleBadge from '@/components/ui/role-badge';
import { 
  Trophy, 
  TrendingUp, 
  Zap, 
  Target, 
  DollarSign, 
  User,
  Percent,
  Map
} from 'lucide-react';

interface MatchInfographicGeneratorProps {
  team1: TeamWithTIR;
  team2: TeamWithTIR;
  team1RoundMetrics: TeamRoundMetrics;
  team2RoundMetrics: TeamRoundMetrics;
}

/**
 * Component to generate a visual infographic for a match comparison
 */
const MatchInfographicGenerator: React.FC<MatchInfographicGeneratorProps> = ({
  team1,
  team2,
  team1RoundMetrics,
  team2RoundMetrics
}) => {
  const infographicRef = useRef<HTMLDivElement>(null);
  
  // Find top performers from each team
  const team1TopPlayer = team1.players.sort((a, b) => b.piv - a.piv)[0];
  const team2TopPlayer = team2.players.sort((a, b) => b.piv - a.piv)[0];
  
  // Find all AWPers and IGLs
  const team1AWPer = team1.players.find(p => p.role === PlayerRole.AWP);
  const team2AWPer = team2.players.find(p => p.role === PlayerRole.AWP);
  const team1IGL = team1.players.find(p => p.role === PlayerRole.IGL);
  const team2IGL = team2.players.find(p => p.role === PlayerRole.IGL);
  
  // Find common maps played by both teams
  const commonMaps = Object.keys(team1RoundMetrics.mapPerformance)
    .filter(map => team2RoundMetrics.mapPerformance[map] !== undefined)
    .map(map => ({
      name: map,
      team1: team1RoundMetrics.mapPerformance[map],
      team2: team2RoundMetrics.mapPerformance[map]
    }));
  
  // Find the map with the highest performance difference
  const mapWithHighestDiff = commonMaps.length > 0 
    ? commonMaps.reduce((prev, current) => {
        const prevDiff = Math.abs(
          (prev.team1.ctWinRate + prev.team1.tWinRate) / 2 - 
          (prev.team2.ctWinRate + prev.team2.tWinRate) / 2
        );
        const currentDiff = Math.abs(
          (current.team1.ctWinRate + current.team1.tWinRate) / 2 - 
          (current.team2.ctWinRate + current.team2.tWinRate) / 2
        );
        return currentDiff > prevDiff ? current : prev;
      })
    : null;
  
  // Find key advantages for each team
  const team1Advantages = [];
  const team2Advantages = [];
  
  // Pistol rounds
  if (team1RoundMetrics.pistolRoundWinRate > team2RoundMetrics.pistolRoundWinRate) {
    team1Advantages.push('Pistol Round Win Rate');
  } else {
    team2Advantages.push('Pistol Round Win Rate');
  }
  
  // Economy efficiency
  if (team1RoundMetrics.econEfficiencyRatio > team2RoundMetrics.econEfficiencyRatio) {
    team1Advantages.push('Economy Efficiency');
  } else {
    team2Advantages.push('Economy Efficiency');
  }
  
  // Full buy win rate
  if (team1RoundMetrics.fullBuyWinRate > team2RoundMetrics.fullBuyWinRate) {
    team1Advantages.push('Full Buy Success');
  } else {
    team2Advantages.push('Full Buy Success');
  }
  
  // Force buy success
  if (team1RoundMetrics.forceRoundWinRate > team2RoundMetrics.forceRoundWinRate) {
    team1Advantages.push('Force Buy Success');
  } else {
    team2Advantages.push('Force Buy Success');
  }
  
  // Comeback ability
  if (team1RoundMetrics.comebackFactor > team2RoundMetrics.comebackFactor) {
    team1Advantages.push('Comeback Ability');
  } else {
    team2Advantages.push('Comeback Ability');
  }
  
  return (
    <div ref={infographicRef} className="w-full rounded-md overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Infographic Header */}
      <div className="bg-gradient-to-r from-blue-900 via-purple-900 to-red-900 p-6 text-center">
        <h2 className="text-3xl font-bold text-white">CS2 MATCH ANALYSIS</h2>
        <div className="mt-3 text-lg text-gray-200">Powered by CS2 Analytics Platform</div>
        
        {/* Team Matchup */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-center">
            <div className="h-20 w-20 mx-auto rounded-full bg-blue-800 flex items-center justify-center text-4xl font-bold">
              {team1.name.charAt(0).toUpperCase()}
            </div>
            <div className="mt-2 text-xl font-bold">{team1.name}</div>
            <div className="text-sm text-blue-300">TIR: {team1.tir}</div>
          </div>
          
          <div className="text-3xl font-bold text-white">VS</div>
          
          <div className="text-center">
            <div className="h-20 w-20 mx-auto rounded-full bg-red-800 flex items-center justify-center text-4xl font-bold">
              {team2.name.charAt(0).toUpperCase()}
            </div>
            <div className="mt-2 text-xl font-bold">{team2.name}</div>
            <div className="text-sm text-red-300">TIR: {team2.tir}</div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Strength Comparison */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
              Team Strengths
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-400">{team1.name}</span>
                  <span className="text-red-400">{team2.name}</span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-700">
                    <div
                      style={{ width: `${(team1.tir / (team1.tir + team2.tir)) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    />
                    <div
                      style={{ width: `${(team2.tir / (team1.tir + team2.tir)) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Top Advantages</h4>
                  <div className="space-y-1">
                    {team1Advantages.map((advantage, i) => (
                      <Badge key={i} variant="outline" className="bg-blue-900/30 text-blue-300 mr-1 mb-1">
                        {advantage}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Top Advantages</h4>
                  <div className="space-y-1">
                    {team2Advantages.map((advantage, i) => (
                      <Badge key={i} variant="outline" className="bg-red-900/30 text-red-300 mr-1 mb-1">
                        {advantage}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Key Players */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-purple-500" />
              Key Players
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Team 1 Key Players */}
              <div>
                <h4 className="text-sm text-blue-400 mb-2">{team1.name}</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{team1TopPlayer.name}</div>
                      <div className="flex items-center text-xs">
                        <RoleBadge role={team1TopPlayer.role} size="sm" />
                        <span className="ml-1 text-gray-400">Top Performer</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-blue-400">
                      {Math.round(team1TopPlayer.piv * 100)}
                    </div>
                  </div>
                  
                  {team1AWPer && team1AWPer !== team1TopPlayer && (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{team1AWPer.name}</div>
                        <div className="flex items-center text-xs">
                          <RoleBadge role={team1AWPer.role} size="sm" />
                          <span className="ml-1 text-gray-400">AWPer</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {Math.round(team1AWPer.piv * 100)}
                      </div>
                    </div>
                  )}
                  
                  {team1IGL && team1IGL !== team1TopPlayer && team1IGL !== team1AWPer && (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{team1IGL.name}</div>
                        <div className="flex items-center text-xs">
                          <RoleBadge role={team1IGL.role} size="sm" />
                          <span className="ml-1 text-gray-400">IGL</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-blue-400">
                        {Math.round(team1IGL.piv * 100)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Team 2 Key Players */}
              <div>
                <h4 className="text-sm text-red-400 mb-2">{team2.name}</h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{team2TopPlayer.name}</div>
                      <div className="flex items-center text-xs">
                        <RoleBadge role={team2TopPlayer.role} size="sm" />
                        <span className="ml-1 text-gray-400">Top Performer</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-red-400">
                      {Math.round(team2TopPlayer.piv * 100)}
                    </div>
                  </div>
                  
                  {team2AWPer && team2AWPer !== team2TopPlayer && (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{team2AWPer.name}</div>
                        <div className="flex items-center text-xs">
                          <RoleBadge role={team2AWPer.role} size="sm" />
                          <span className="ml-1 text-gray-400">AWPer</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-red-400">
                        {Math.round(team2AWPer.piv * 100)}
                      </div>
                    </div>
                  )}
                  
                  {team2IGL && team2IGL !== team2TopPlayer && team2IGL !== team2AWPer && (
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{team2IGL.name}</div>
                        <div className="flex items-center text-xs">
                          <RoleBadge role={team2IGL.role} size="sm" />
                          <span className="ml-1 text-gray-400">IGL</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-red-400">
                        {Math.round(team2IGL.piv * 100)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Round Metrics Comparison */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Percent className="w-5 h-5 mr-2 text-green-500" />
              Round Performance
            </h3>
            
            <div className="space-y-3">
              {/* Pistol Rounds */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Pistol Win Rate</span>
                  <div className="flex space-x-3">
                    <span className="text-blue-400">{Math.round(team1RoundMetrics.pistolRoundWinRate * 100)}%</span>
                    <span className="text-red-400">{Math.round(team2RoundMetrics.pistolRoundWinRate * 100)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-l-full" style={{ width: `${team1RoundMetrics.pistolRoundWinRate * 100}%` }}></div>
                </div>
              </div>
              
              {/* Economy Efficiency */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Economy Efficiency</span>
                  <div className="flex space-x-3">
                    <span className="text-blue-400">{team1RoundMetrics.econEfficiencyRatio.toFixed(1)}</span>
                    <span className="text-red-400">{team2RoundMetrics.econEfficiencyRatio.toFixed(1)}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-l-full" 
                    style={{ 
                      width: `${(team1RoundMetrics.econEfficiencyRatio / (team1RoundMetrics.econEfficiencyRatio + team2RoundMetrics.econEfficiencyRatio)) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Force Buy Success */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Force Buy Success</span>
                  <div className="flex space-x-3">
                    <span className="text-blue-400">{Math.round(team1RoundMetrics.forceRoundWinRate * 100)}%</span>
                    <span className="text-red-400">{Math.round(team2RoundMetrics.forceRoundWinRate * 100)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-l-full" style={{ width: `${team1RoundMetrics.forceRoundWinRate * 100}%` }}></div>
                </div>
              </div>
              
              {/* Comeback Factor */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Comeback Factor</span>
                  <div className="flex space-x-3">
                    <span className="text-blue-400">{Math.round(team1RoundMetrics.comebackFactor * 100)}%</span>
                    <span className="text-red-400">{Math.round(team2RoundMetrics.comebackFactor * 100)}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-500 h-2.5 rounded-l-full" style={{ width: `${team1RoundMetrics.comebackFactor * 100}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Map Analysis */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Map className="w-5 h-5 mr-2 text-amber-500" />
              Map Analysis
            </h3>
            
            {commonMaps.length > 0 ? (
              <div className="space-y-4">
                {mapWithHighestDiff && (
                  <div>
                    <h4 className="text-sm text-gray-400 mb-2">Key Map Advantage</h4>
                    <div className="p-3 rounded-md bg-gray-900 flex justify-between">
                      <div>
                        <div className="font-medium capitalize">{mapWithHighestDiff.name}</div>
                        <div className="text-xs text-gray-400">
                          {((mapWithHighestDiff.team1.ctWinRate + mapWithHighestDiff.team1.tWinRate) / 2) > 
                           ((mapWithHighestDiff.team2.ctWinRate + mapWithHighestDiff.team2.tWinRate) / 2) 
                            ? `Advantage: ${team1.name}` 
                            : `Advantage: ${team2.name}`}
                        </div>
                      </div>
                      <div className="flex items-end space-x-3">
                        <div className="text-center">
                          <div className="text-xs text-gray-400">{team1.name}</div>
                          <div className="text-lg font-bold text-blue-400">
                            {Math.round(((mapWithHighestDiff.team1.ctWinRate + mapWithHighestDiff.team1.tWinRate) / 2) * 100)}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400">{team2.name}</div>
                          <div className="text-lg font-bold text-red-400">
                            {Math.round(((mapWithHighestDiff.team2.ctWinRate + mapWithHighestDiff.team2.tWinRate) / 2) * 100)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Map Pool Overview</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {commonMaps.slice(0, 4).map((map) => (
                      <div key={map.name} className="text-xs p-2 rounded bg-gray-900">
                        <div className="font-medium capitalize mb-1">{map.name}</div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">CT</span>
                          <div>
                            <span className="text-blue-400">{Math.round(map.team1.ctWinRate * 100)}%</span>
                            <span className="text-gray-500 mx-1">vs</span>
                            <span className="text-red-400">{Math.round(map.team2.ctWinRate * 100)}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">T</span>
                          <div>
                            <span className="text-blue-400">{Math.round(map.team1.tWinRate * 100)}%</span>
                            <span className="text-gray-500 mx-1">vs</span>
                            <span className="text-red-400">{Math.round(map.team2.tWinRate * 100)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-center py-4">
                No common maps found between teams
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Footer */}
      <div className="bg-black p-4 text-center text-sm text-gray-500">
        Generated by CS2 Analytics Platform • {new Date().toLocaleDateString()}
      </div>
    </div>
  );
};

export default MatchInfographicGenerator;