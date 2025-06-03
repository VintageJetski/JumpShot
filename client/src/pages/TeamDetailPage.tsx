import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { TeamWithTIR, PlayerRole, TeamRoundMetrics } from "../../shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import RoleBadge from "../components/ui/role-badge";
import ProgressMetric from "../components/stats/ProgressMetric";
import RoleDistributionChart from "../components/charts/RoleDistributionChart";
import TeamPIVBarChart from "../components/charts/TeamPIVBarChart";
import { ArrowLeft, Rocket, Users, ShieldCheck, Star, Activity, Zap, BarChart } from "lucide-react";
import { DataTable } from "../components/ui/data-table";
import RoundMetricsCard from "../components/team-detail/RoundMetricsCard";

export default function TeamDetailPage() {
  const { name } = useParams();
  const decodedName = name ? decodeURIComponent(name) : "";
  const [location, setLocation] = useLocation();
  
  const { data: team, isLoading, isError } = useQuery<TeamWithTIR>({
    queryKey: [`/api/teams/${decodedName}`],
  });
  
  const { data: roundMetrics, isLoading: isLoadingRoundMetrics } = useQuery<TeamRoundMetrics>({
    queryKey: [`/api/round-metrics/${decodedName}`],
    enabled: !!decodedName // Only run query if we have a team name
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Rocket className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-gray-400">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (isError || !team) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-400">
          <p>Error loading team data. Please try again.</p>
          <button 
            className="mt-4 text-primary hover:text-primary-dark"
            onClick={() => setLocation('/teams')}
          >
            Back to Teams
          </button>
        </div>
      </div>
    );
  }

  // Get team roles distribution (primary roles only for new system)
  const roleCount = team.players.reduce((acc, player) => {
    acc[player.role] = (acc[player.role] || 0) + 1;
    // Include CT and T roles if available
    if (player.ctRole && player.ctRole !== player.role) {
      acc[player.ctRole] = (acc[player.ctRole] || 0) + 1;
    }
    if (player.tRole && player.tRole !== player.role) {
      acc[player.tRole] = (acc[player.tRole] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Table columns for team players
  const columns = [
    {
      header: "Player",
      accessorKey: "name",
      cell: ({ row }: any) => {
        const player = row.original;
        const teamInitial = player.team.charAt(0).toUpperCase();
        
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-primary">
              {teamInitial}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium">{player.name}</div>
              <div className="text-sm text-gray-400">{player.id}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: ({ row }: any) => {
        // Use simpler role display without secondary roles for the new system
        return (
          <RoleBadge 
            role={row.original.role}
          />
        );
      }
    },
    {
      header: "PIV",
      accessorKey: "piv",
      cell: ({ row }: any) => {
        // Convert decimal PIV (e.g., 0.798) to display format (80)
        const scaledPIV = Math.round(row.original.piv * 100);
        return (
          <div className="font-medium text-white">{scaledPIV}</div>
        );
      }
    },
    {
      header: "K/D",
      accessorKey: "kd",
      cell: ({ row }: any) => {
        const kd = row.original.kd;
        const formattedKD = kd.toFixed(2); // Format to 2 decimal places
        const textColor = kd >= 1.0 ? "text-green-400" : "text-yellow-400";
        
        return (
          <div className={`text-sm font-medium ${textColor}`}>{formattedKD}</div>
        );
      }
    },
    {
      header: "Primary Metric",
      accessorKey: "primaryMetric",
      cell: ({ row }: any) => {
        const { name, value } = row.original.primaryMetric;
        
        return (
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">{name}:</span>
            <span className="text-sm font-medium">{value.toFixed(2)}</span>
          </div>
        );
      }
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <div className="text-right">
          <button 
            onClick={() => setLocation(`/players/${row.original.id}`)}
            className="text-primary hover:text-primary-light"
          >
            Player Details
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          className="text-primary hover:text-primary-dark flex items-center"
          onClick={() => setLocation('/teams')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Teams
        </button>
      </div>
      
      <Card className="bg-background-light rounded-lg border border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center text-3xl font-bold text-primary">
              {team.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold">{team.name}</h2>
              <div className="flex items-center mt-1">
                <span className="text-gray-400">Team Impact Rating</span>
                <span className="mx-2 text-green-400 font-bold">{team.tir}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
            <div className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-sm font-medium">
              Rank #{team.tir} TIR
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {team.players.length} Players
            </div>
          </div>
        </div>
        
        {/* Team Performance Metrics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Team Impact Metrics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center">
                    <Activity className="h-4 w-4 mr-2 text-green-400" />
                    TIR Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Sum PIV</span>
                      <span className="font-medium">{team.sumPIV}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 rounded-full h-2" style={{width: `${(team.sumPIV / team.tir) * 85}%`}} />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Synergy</span>
                      <span className="font-medium">{team.synergy}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 rounded-full h-2" style={{width: `${(team.synergy / team.tir) * 85}%`}} />
                    </div>
                    
                    <div className="flex justify-between text-sm font-medium text-white">
                      <span>Total TIR</span>
                      <span>{team.tir}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Formula: Sum of PIV + Team Synergy Layer
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-400 flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-blue-400" />
                    Synergy Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Role Diversity</span>
                      <span className="font-medium">{Object.keys(roleCount).length} roles</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 rounded-full h-2" style={{width: `${(Object.keys(roleCount).length / 6) * 100}%`}} />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Average PIV</span>
                      <span className="font-medium">{team.avgPIV}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-amber-500 rounded-full h-2" style={{width: `${Math.min(team.avgPIV / 3, 1) * 100}%`}} />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>Top Player</span>
                      <span className="font-medium">{team.topPlayer.name} ({Math.round(team.topPlayer.piv * 100)})</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Players with complementary roles enhance team synergy
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Role Distribution</h3>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-6">
                <RoleDistributionChart players={team.players} />
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="text-sm text-gray-400">Key Team Attributes:</div>
                  <div className="mt-2 space-y-2">
                    {team.players.some(p => p.role === PlayerRole.IGL) && (
                      <div className="flex items-center text-xs bg-gray-700 rounded-full px-3 py-1 text-purple-400 w-fit">
                        <ShieldCheck className="h-3 w-3 mr-1" /> IGL Presence
                      </div>
                    )}
                    {team.players.some(p => p.role === PlayerRole.AWP) && (
                      <div className="flex items-center text-xs bg-gray-700 rounded-full px-3 py-1 text-amber-400 w-fit">
                        <Star className="h-3 w-3 mr-1" /> Main AWPer
                      </div>
                    )}
                    {team.avgPIV > 0.7 && (
                      <div className="flex items-center text-xs bg-gray-700 rounded-full px-3 py-1 text-green-400 w-fit">
                        <Users className="h-3 w-3 mr-1" /> High Avg. Impact
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Player Impact Value Comparison */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Player Impact Value Comparison</h3>
          <Card className="bg-gray-800 border-gray-700 p-4">
            <TeamPIVBarChart players={team.players} />
          </Card>
        </div>
        
        {/* Round-Based Metrics */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <BarChart className="h-5 w-5 mr-2 text-blue-400" />
            Round-Based Performance Metrics
          </h3>
          <RoundMetricsCard metrics={roundMetrics} isLoading={isLoadingRoundMetrics} />
        </div>
        
        {/* Team Players Table */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Team Players</h3>
          <Card className="bg-background-light rounded-lg border border-gray-700 overflow-hidden">
            <DataTable
              columns={columns}
              data={team.players.sort((a, b) => b.piv - a.piv)}
              pageSize={10}
              defaultSortField="piv"
              defaultSortDir="desc"
            />
          </Card>
        </div>
      </Card>
    </div>
  );
}

function getRoleBarColor(role: string): string {
  switch (role) {
    case 'AWPer':
      return "bg-amber-500 rounded-full h-2";
    case 'IGL':
      return "bg-purple-500 rounded-full h-2";
    case 'Spacetaker':
      return "bg-red-500 rounded-full h-2";
    case 'Lurker':
      return "bg-blue-500 rounded-full h-2";
    case 'Anchor':
      return "bg-teal-500 rounded-full h-2";
    case 'Support':
      return "bg-green-500 rounded-full h-2";
    default:
      return "bg-gray-500 rounded-full h-2";
  }
}