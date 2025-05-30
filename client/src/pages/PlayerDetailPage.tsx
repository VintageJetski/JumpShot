import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { PlayerWithPIV, PlayerRole } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RoleBadge from "@/components/ui/role-badge";
import ProgressMetric from "@/components/stats/ProgressMetric";
import PlayerStatsRadarChart from "@/components/charts/PlayerStatsRadarChart";
import PlayerHistoryTab from "@/components/player-history/PlayerHistoryTab";
import { ArrowLeft, Rocket, Shield, Skull, History } from "lucide-react";
import { useState } from "react";

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overall");
  
  const { data: player, isLoading, isError } = useQuery<PlayerWithPIV>({
    queryKey: [`/api/players/${id}`],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Rocket className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-gray-400">Loading player data...</p>
        </div>
      </div>
    );
  }

  if (isError || !player) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-400">
          <p>Error loading player data. Please try again.</p>
          <button 
            className="mt-4 text-primary hover:text-primary-dark"
            onClick={() => setLocation('/players')}
          >
            Back to Players
          </button>
        </div>
      </div>
    );
  }

  // Get the available metrics from the tournament data
  const availableMetrics = player.metrics ? Object.keys(player.metrics) : [];
  
  // Create metric display data from the real tournament stats
  const displayMetrics = {
    'K/D': player.metrics?.kd || 0,
    'ADR': player.metrics?.adr || 0,
    'KAST': player.metrics?.kast || 0,
    'First Kills': player.metrics?.firstKills || 0,
    'Headshots': player.metrics?.headshots || 0,
    'Utility Damage': player.metrics?.utilityDamage || 0
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          className="text-primary hover:text-primary-dark flex items-center"
          onClick={() => setLocation('/players')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Players
        </button>
      </div>
      
      <Card className="bg-background-light rounded-lg border border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-primary">
              {player.team.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold">{player.name}</h2>
              <div className="flex items-center mt-1">
                <span className="text-gray-400">{player.team}</span>
                <span className="mx-2 text-gray-600">•</span>
                <RoleBadge 
                  role={player.role} 
                  isIGL={player.isIGL}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
            <div className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-sm font-medium">
              {Math.round(player.piv * 100)} PIV
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Steam ID: {player.id}
            </div>
          </div>
        </div>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Role Core Score (RCS)</h3>
              <div className="mt-4 space-y-4">
                {overallMetricsKeys.slice(0, 5).map((metric: string) => (
                  <ProgressMetric
                    key={metric}
                    label={metric}
                    value={player.metrics.rcs.metrics[metric]}
                    color="bg-primary"
                    description={getMetricDescription(metric, player)}
                  />
                ))}
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">RCS Total</span>
                    <span className="text-sm font-medium">{player.metrics.rcs.value.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-amber-500 rounded-full h-2" 
                      style={{width: `${player.metrics.rcs.value * 100}%`}}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Formula: Weighted average of role metrics
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Individual Consistency Factor (ICF)</h3>
              <div className="mt-4 space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Standard Deviation (σ)</span>
                    <span className="text-sm font-medium">{player.metrics.icf.sigma.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Measures consistency across rounds
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">ICF</span>
                    <span className="text-sm font-medium">{player.metrics.icf.value.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-500 rounded-full h-2" 
                      style={{width: `${player.metrics.icf.value * 100}%`}}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Formula: 1 / (1 + σ)
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">Synergy Contribution (SC)</h3>
              <div className="mt-4 space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">{player.metrics.sc.metric}</span>
                    <span className="text-sm font-medium">{player.metrics.sc.value.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-500 rounded-full h-2" 
                      style={{width: `${player.metrics.sc.value * 100}%`}}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    {getSCDescription(player.metrics.sc.metric)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Opponent Strength Multiplier (OSM)</h3>
              <div className="mt-4 space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">Average Opponent Rating</span>
                    <span className="text-sm font-medium">{player.metrics.osm.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Based on opponent HLTV rating
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-400">OSM Value</span>
                    <span className="text-sm font-medium">{player.metrics.osm.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-500 rounded-full h-2" 
                      style={{width: `${player.metrics.osm / 2 * 100}%`}}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Formula: Opponent Rating / League Average
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium">PIV Calculation</h3>
              <div className="mt-4 space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-sm text-gray-400">PIV = [(RCS × ICF) + SC] × OSM</div>
                  <div className="text-sm font-mono text-white mt-2">
                    = [({player.metrics.rcs.value.toFixed(2)} × {player.metrics.icf.value.toFixed(2)}) + {player.metrics.sc.value.toFixed(2)}] × {player.metrics.osm.toFixed(2)}
                  </div>
                  <div className="text-lg font-bold text-green-400 mt-2">
                    = {Math.round(player.piv * 100)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <Tabs defaultValue="overall" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full mb-4">
              <TabsTrigger value="overall" className="flex items-center">
                <Rocket className="h-4 w-4 mr-2" />
                Overall
              </TabsTrigger>
              <TabsTrigger value="t-side" className="flex items-center">
                <Skull className="h-4 w-4 mr-2" />
                T Side
              </TabsTrigger>
              <TabsTrigger value="ct-side" className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                CT Side
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overall" className="space-y-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-4">Overall Performance</h3>
                  <PlayerStatsRadarChart player={player} />
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="font-semibold">Primary Role:</span>
                      <RoleBadge role={player.role} />
                    </div>
                    <div className="mt-2 bg-gray-700 p-2 rounded text-sm">
                      <span className="font-semibold text-green-400">{Math.round(player.piv * 100)}</span> PIV Rating (Overall)
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-medium mb-2">Overall Role Metrics</h3>
                  <div className="mt-4 space-y-3">
                    {overallMetricsKeys.slice(0, 6).map(metric => (
                      <ProgressMetric
                        key={metric}
                        label={metric}
                        value={player.metrics.rcs.metrics[metric]}
                        color="bg-primary"
                        description={getMetricDescription(metric, player)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="t-side" className="space-y-4">
              {player.tMetrics && player.tRole ? (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">T-Side Performance</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Skull className="h-5 w-5 text-yellow-500" />
                      <span className="font-semibold text-sm text-gray-300">T-Side Role:</span>
                      <RoleBadge role={player.tRole} />
                    </div>
                    
                    <div className="p-4 bg-gray-700 rounded-lg mt-4">
                      <div className="text-center mb-2 text-sm text-gray-400">T-Side PIV Rating</div>
                      <div className="text-center text-3xl font-bold text-yellow-500">{Math.round((player.tPIV || 0) * 100)}</div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Opening Duels</span>
                          <span className="font-medium">{player.rawStats.tFirstKills} / {player.rawStats.tFirstDeaths}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">T Rounds Won</span>
                          <span className="font-medium">{player.rawStats.tRoundsWon}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">T-Side Role Metrics</h3>
                    <div className="mt-4 space-y-3">
                      {tMetricsKeys.map((metric: string) => (
                        <ProgressMetric
                          key={metric}
                          label={metric}
                          value={player.tMetrics!.roleMetrics[metric as keyof typeof player.tMetrics.roleMetrics] as number}
                          color="bg-yellow-500"
                          description={`${metric} - T-side performance metric`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 p-8">
                  No T-side specific data available for this player.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="ct-side" className="space-y-4">
              {player.ctMetrics && player.ctRole ? (
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">CT-Side Performance</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold text-sm text-gray-300">CT-Side Role:</span>
                      <RoleBadge role={player.ctRole} />
                    </div>
                    
                    <div className="p-4 bg-gray-700 rounded-lg mt-4">
                      <div className="text-center mb-2 text-sm text-gray-400">CT-Side PIV Rating</div>
                      <div className="text-center text-3xl font-bold text-blue-500">{Math.round((player.ctPIV || 0) * 100)}</div>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Opening Duels</span>
                          <span className="font-medium">{player.rawStats.ctFirstKills} / {player.rawStats.ctFirstDeaths}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">CT Rounds Won</span>
                          <span className="font-medium">{player.rawStats.ctRoundsWon}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-2">CT-Side Role Metrics</h3>
                    <div className="mt-4 space-y-3">
                      {ctMetricsKeys.map((metric: string) => (
                        <ProgressMetric
                          key={metric}
                          label={metric}
                          value={player.ctMetrics!.roleMetrics[metric as keyof typeof player.ctMetrics.roleMetrics] as number}
                          color="bg-blue-500"
                          description={`${metric} - CT-side performance metric`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 p-8">
                  No CT-side specific data available for this player.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <PlayerHistoryTab player={player} />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-medium">Raw Statistics</h3>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">K/D</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.kd.toFixed(2)}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Kills</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.kills}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Deaths</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.deaths}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Assists</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.assists}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Headshots</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.headshots}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Flash Assists</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.assistedFlashes}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">First Kills</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.firstKills}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">First Deaths</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.firstDeaths}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Utility Thrown</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.totalUtilityThrown}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">No Scope Kills</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.noScope}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Smoke Kills</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.throughSmoke}</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-400">Blind Kills</div>
              <div className="text-lg font-medium mt-1">{player.rawStats.blindKills}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function getMetricDescription(metric: string, player: PlayerWithPIV): string {
  switch (metric) {
    case 'OPSR':
      return `${player.rawStats.firstKills} first kills / ${player.rawStats.firstKills + player.rawStats.firstDeaths} opening duels`;
    case 'MKC':
      return 'High conversion of entry picks into multi-kills';
    case 'ODSR':
      return `Success rate in opening duels`;
    case 'AEI':
      return `${player.rawStats.kills} kills / ${player.rawStats.deaths} deaths balanced with aggression`;
    case 'FSR':
      return `Through smoke kill success rate`;
    case 'SHSR':
      return `CT-side round win success`;
    case 'OEDR':
      return `CT-side entry denial efficiency`;
    case 'FAS':
      return `${player.rawStats.assistedFlashes} assisted flashes / kills`;
    case 'USE':
      return `Utility to assist teammates and objectives`;
    case 'USO':
      return `Utility effectiveness in tactical setups`;
    default:
      return `Role-specific performance metric`;
  }
}

function getSCDescription(metric: string): string {
  switch (metric) {
    case 'FAS':
      return 'Flash assist synergy with teammates';
    case 'IIR':
      return 'In-game leadership and information relay';
    case 'UES':
      return 'Utility to enable spacetaking';
    case 'IRS':
      return 'Information retrieval as lurker';
    case 'SHE':
      return 'Site holding efficiency';
    case 'UCS':
      return 'Utility coordination for support';
    default:
      return 'Team synergy contribution';
  }
}
