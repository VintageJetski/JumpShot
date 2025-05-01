import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PlayerWithPIV, PlayerRole } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User2, Target, Shield, Lightbulb, CircleDot, Users, Medal, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import EnhancedStatsCard from "@/components/stats/EnhancedStatsCard";
import PlayerCard from "@/components/players/PlayerCard";
import RoleFilterChips from "@/components/players/RoleFilterChips";
import TeamGroup from "@/components/players/TeamGroup";

export default function PlayersPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");
  const [viewMode, setViewMode] = useState<"cards" | "table" | "teams">("cards");
  
  // Fetch all players data (we'll filter client-side for more flexibility)
  const { data: players, isLoading, isError } = useQuery<PlayerWithPIV[]>({
    queryKey: ["/api/players"],
  });

  // Generate teams data from players
  const [teams, setTeams] = useState<{[key: string]: PlayerWithPIV[]}>({}); 
  
  useEffect(() => {
    if (players) {
      // Group players by team
      const teamGroups: {[key: string]: PlayerWithPIV[]} = {};
      players.forEach(player => {
        if (!teamGroups[player.team]) {
          teamGroups[player.team] = [];
        }
        teamGroups[player.team].push(player);
      });
      setTeams(teamGroups);
    }
  }, [players]);

  // Helper function to check if a player has a specific role
  const hasRole = (player: PlayerWithPIV, role: string): boolean => {
    if (role === "All Roles") return true;
    
    return (
      player.role === role ||
      player.ctRole === role ||
      player.tRole === role ||
      (role === PlayerRole.IGL && player.isIGL === true)
    );
  };
  
  // Apply search and role filters
  const filteredPlayers = players ? players
    .filter(player => {
      // Text search filter
      const matchesSearch = 
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        player.team.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Role filter
      const matchesRole = hasRole(player, roleFilter);
      
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => b.piv - a.piv) : [];

  // Extract top players by role with comprehensive role checking
  const findTopPlayerByRole = (role: PlayerRole) => {
    return filteredPlayers.find(p => 
      p.role === role || 
      p.ctRole === role || 
      p.tRole === role
    ) || null;
  };
  
  const topPlayersByRole = {
    highest: filteredPlayers[0] || null,
    awper: findTopPlayerByRole(PlayerRole.AWP),
    lurker: findTopPlayerByRole(PlayerRole.Lurker),
    igl: findTopPlayerByRole(PlayerRole.IGL),
    spacetaker: findTopPlayerByRole(PlayerRole.Spacetaker),
    anchor: findTopPlayerByRole(PlayerRole.Anchor),
    support: findTopPlayerByRole(PlayerRole.Support),
    rotator: findTopPlayerByRole(PlayerRole.Rotator),
  };

  // Table columns definition
  const columns = [
    {
      header: "Player",
      accessorKey: "name",
      cell: ({ row }: any) => {
        const player = row.original;
        // Use team's initial instead of player's initial
        const teamInitial = player.team.charAt(0).toUpperCase();
        
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center text-xl font-bold text-white">
              {teamInitial}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium">{player.name}</div>
              <div className="text-sm text-blue-300/60">{player.id}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: "Team",
      accessorKey: "team",
      cell: ({ row }: any) => (
        <div className="text-sm font-medium">{row.original.team}</div>
      )
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: ({ row }: any) => {
        const player = row.original;
        
        // For players with CT and T roles
        if (player.ctRole && player.tRole) {
          // Collect all unique roles to display
          const rolesToDisplay = new Set<PlayerRole>();
          
          // If player is IGL, add it first (will be shown only once)
          if (player.isIGL) {
            rolesToDisplay.add(PlayerRole.IGL);
          }
          
          // Add primary role if it's not IGL
          if (player.role !== PlayerRole.IGL) {
            rolesToDisplay.add(player.role);
          }
          
          // Add T role if it's not already included and not the same as primary role
          if (player.tRole && player.tRole !== player.role && player.tRole !== PlayerRole.IGL) {
            rolesToDisplay.add(player.tRole);
          }
          
          // Add CT role if it's not already included and not the same as primary role or T role
          if (player.ctRole && player.ctRole !== player.role && player.ctRole !== player.tRole && player.ctRole !== PlayerRole.IGL) {
            rolesToDisplay.add(player.ctRole);
          }
          
          return (
            <div className="flex flex-wrap gap-1">
              {Array.from(rolesToDisplay).map((role, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-blue-900/20 border border-blue-500/20 text-white text-xs px-2 py-0.5 rounded-full"
                >
                  {role}
                </div>
              ))}
            </div>
          );
        }
        
        // Fallback to simple display
        return (
          <div className="flex items-center bg-blue-900/20 border border-blue-500/20 text-white text-xs px-2 py-0.5 rounded-full">
            {player.role}
          </div>
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
            <span className="text-sm text-blue-300/60 mr-2">{name}:</span>
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
          <Button
            onClick={() => setLocation(`/players/${row.original.id}`)}
            variant="ghost"
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
            size="sm"
          >
            Details
          </Button>
        </div>
      )
    }
  ];

  return (
    <motion.div 
      className="space-y-6 page-transition"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-gradient">Players</h1>
          <p className="text-blue-300/80 text-sm">Ranked by Player Impact Value (PIV)</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-4 md:mt-0">
          {/* Search Input */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search players..."
              className="rounded-lg bg-blue-900/20 border-blue-500/30 text-sm py-2 pl-10 pr-4 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="h-5 w-5 text-blue-400 absolute left-3 top-2.5" />
          </div>
          
          {/* View Mode Selector */}
          <div className="glassmorphism rounded-lg flex p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              className={`px-3 ${viewMode === "cards" ? "bg-blue-600" : "bg-transparent text-blue-300 hover:text-blue-100"}`}
              onClick={() => setViewMode("cards")}
            >
              <Filter className="h-4 w-4 mr-1" /> Cards
            </Button>
            <Button
              variant={viewMode === "teams" ? "default" : "ghost"}
              size="sm"
              className={`px-3 ${viewMode === "teams" ? "bg-blue-600" : "bg-transparent text-blue-300 hover:text-blue-100"}`}
              onClick={() => setViewMode("teams")}
            >
              <Users className="h-4 w-4 mr-1" /> Teams
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className={`px-3 ${viewMode === "table" ? "bg-blue-600" : "bg-transparent text-blue-300 hover:text-blue-100"}`}
              onClick={() => setViewMode("table")}
            >
              <Medal className="h-4 w-4 mr-1" /> Table
            </Button>
          </div>
        </div>
      </div>
      
      {/* Role Filter */}
      <RoleFilterChips 
        selectedRole={roleFilter}
        onSelectRole={setRoleFilter}
      />

      {/* Stats Overview Cards (Top Players) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-8">
        {topPlayersByRole.highest && (
          <EnhancedStatsCard
            title="Highest PIV"
            value={topPlayersByRole.highest.name}
            metric={`${Math.round(topPlayersByRole.highest.piv * 100)} PIV`}
            metricColor="text-green-400"
            bgGradient="from-green-700 to-green-500"
            icon={<User2 className="h-6 w-6 text-green-400" />}
            subtext={`Team: ${topPlayersByRole.highest.team}`}
            index={0}
          />
        )}
        
        {topPlayersByRole.igl && (
          <EnhancedStatsCard
            title="Best IGL"
            value={topPlayersByRole.igl.name}
            metric={`${Math.round(topPlayersByRole.igl.piv * 100)} PIV`}
            metricColor="text-purple-400"
            bgGradient="from-purple-700 to-purple-500"
            icon={<Lightbulb className="h-6 w-6 text-purple-400" />}
            subtext={`${topPlayersByRole.igl.primaryMetric.name}: ${topPlayersByRole.igl.primaryMetric.value.toFixed(2)}`}
            index={1}
          />
        )}
        
        {topPlayersByRole.awper && (
          <EnhancedStatsCard
            title="Best AWPer"
            value={topPlayersByRole.awper.name}
            metric={`${Math.round(topPlayersByRole.awper.piv * 100)} PIV`}
            metricColor="text-amber-400"
            bgGradient="from-amber-700 to-amber-500"
            icon={<Target className="h-6 w-6 text-amber-400" />}
            subtext={`${topPlayersByRole.awper.primaryMetric.name}: ${topPlayersByRole.awper.primaryMetric.value.toFixed(2)}`}
            index={2}
          />
        )}
        
        {topPlayersByRole.spacetaker && (
          <EnhancedStatsCard
            title="Best Spacetaker"
            value={topPlayersByRole.spacetaker.name}
            metric={`${Math.round(topPlayersByRole.spacetaker.piv * 100)} PIV`}
            metricColor="text-orange-400"
            bgGradient="from-orange-700 to-orange-500"
            icon={<User2 className="h-6 w-6 text-orange-400" />}
            subtext={`${topPlayersByRole.spacetaker.primaryMetric.name}: ${topPlayersByRole.spacetaker.primaryMetric.value.toFixed(2)}`}
            index={3}
          />
        )}
      </div>
      
      {/* Display filtered players based on view mode */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              className="flex items-center justify-center h-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-r-blue-500 border-b-blue-500/20 border-l-blue-500/20 animate-spin mx-auto"></div>
                <p className="mt-4 text-blue-300">Loading player data...</p>
              </div>
            </motion.div>
          ) : isError ? (
            <motion.div 
              key="error"
              className="flex items-center justify-center h-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center text-red-400">
                <p>Error loading player data. Please try again.</p>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Card View */}
              {viewMode === "cards" && (
                <motion.div 
                  key="cards"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredPlayers.map((player, index) => (
                    <PlayerCard key={player.id} player={player} index={index} />
                  ))}
                </motion.div>
              )}
              
              {/* Team View */}
              {viewMode === "teams" && teams && (
                <motion.div 
                  key="teams"
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {Object.entries(teams)
                    .filter(([teamName]) => 
                      teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      teams[teamName].some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .sort((a, b) => {
                      // Calculate average PIV for each team
                      const avgPivA = a[1].reduce((sum, p) => sum + p.piv, 0) / a[1].length;
                      const avgPivB = b[1].reduce((sum, p) => sum + p.piv, 0) / b[1].length;
                      return avgPivB - avgPivA; // Sort by highest average PIV
                    })
                    .map(([teamName, players], idx) => (
                      <TeamGroup 
                        key={teamName} 
                        teamName={teamName} 
                        players={players.filter(p => hasRole(p, roleFilter))} 
                        expanded={idx === 0} // First team starts expanded
                      />
                    ))
                  }
                </motion.div>
              )}
              
              {/* Table View */}
              {viewMode === "table" && (
                <motion.div 
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="glassmorphism border-glow overflow-hidden">
                    <DataTable
                      columns={columns}
                      data={filteredPlayers}
                      pageSize={15}
                      defaultSortField="piv"
                      defaultSortDir="desc"
                    />
                  </Card>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
