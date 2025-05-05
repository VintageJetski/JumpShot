import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TeamWithTIR, PlayerWithPIV, PlayerRole } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Trophy, ArrowLeft } from "lucide-react";
import RoleBadge from "@/components/ui/role-badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function TeamsRolesPage() {
  const [, setLocation] = useLocation();
  
  // Fetch all teams data
  const { data: teams, isLoading, isError } = useQuery<TeamWithTIR[]>({
    queryKey: ["/api/teams"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Trophy className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-sm text-gray-400">Loading teams data...</p>
        </div>
      </div>
    );
  }

  if (isError || !teams) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-400">
          <p>Error loading teams data. Please try again.</p>
        </div>
      </div>
    );
  }

  // Role mappings for icons
  const getRoleColor = (role: PlayerRole): string => {
    switch (role) {
      case PlayerRole.IGL: return "border-purple-500";
      case PlayerRole.AWP: return "border-yellow-500";
      case PlayerRole.Lurker: return "border-blue-500";
      case PlayerRole.Spacetaker: return "border-green-500";
      case PlayerRole.Support: return "border-indigo-500";
      case PlayerRole.Anchor: return "border-blue-700";
      case PlayerRole.Rotator: return "border-sky-500";
      default: return "border-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button 
          className="text-primary hover:text-primary-dark flex items-center"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Dashboard
        </button>
        <h1 className="text-2xl font-bold">Teams & Assigned Roles</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {teams.map((team) => (
          <Card key={team.id} className="bg-background-light rounded-lg border border-gray-700 overflow-hidden">
            <CardHeader className="bg-blue-900/20 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-400" />
                  {team.name}
                </CardTitle>
                <div className="text-sm font-medium">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="bg-green-500/20 text-green-400 rounded-full px-3 py-1 text-sm font-medium">
                          {team.tir.toFixed(2)} TIR
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Team Impact Rating</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {team.players.map((player) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-2 bg-blue-900/10 border border-blue-800/20 rounded-lg hover:bg-blue-900/20 transition-colors"
                    onClick={() => setLocation(`/players/${player.id}`)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-gray-800 border-2 ${getRoleColor(player.role)}`}>
                        {player.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">{player.name}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          {player.tRole && player.ctRole ? (
                            <>
                              <RoleBadge role={player.tRole} size="xs" />
                              <span className="text-gray-500 text-xs">/</span>
                              <RoleBadge role={player.ctRole} size="xs" />
                              {player.isIGL && (
                                <span className="ml-1 bg-purple-500/30 text-purple-300 text-[10px] px-1 rounded">IGL</span>
                              )}
                            </>
                          ) : (
                            <RoleBadge role={player.role} size="xs" isIGL={player.isIGL} />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-green-500">
                      {Math.round(player.piv * 100)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
