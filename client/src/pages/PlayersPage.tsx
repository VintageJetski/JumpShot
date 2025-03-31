import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { PlayerWithPIV, PlayerRole } from "@shared/schema";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import StatsCard from "@/components/stats/StatsCard";
import RoleBadge from "@/components/ui/role-badge";
import { Search, User2, Target, Shield, Lightbulb, Rocket } from "lucide-react";

export default function PlayersPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All Roles");

  // Fetch players data
  const { data: players, isLoading, isError } = useQuery<PlayerWithPIV[]>({
    queryKey: [roleFilter === "All Roles" ? "/api/players" : `/api/players?role=${roleFilter}`],
  });

  // Apply search filter
  const filteredPlayers = players ? players
    .filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.piv - a.piv) : [];

  // Extract top players by role
  const topPlayersByRole = {
    highest: filteredPlayers[0] || null,
    awper: filteredPlayers.find(p => p.role === PlayerRole.AWPer) || null,
    lurker: filteredPlayers.find(p => p.role === PlayerRole.Lurker) || null,
    igl: filteredPlayers.find(p => p.role === PlayerRole.IGL) || null,
  };

  // Table columns definition
  const columns = [
    {
      header: "Player",
      accessorKey: "name",
      cell: ({ row }: any) => {
        const player = row.original;
        const initial = player.name.charAt(0).toUpperCase();
        
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold text-primary">
              {initial}
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
      header: "Team",
      accessorKey: "team",
      cell: ({ row }: any) => (
        <div className="text-sm font-medium">{row.original.team}</div>
      )
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: ({ row }: any) => (
        <RoleBadge role={row.original.role} />
      )
    },
    {
      header: "PIV",
      accessorKey: "piv",
      cell: ({ row }: any) => (
        <div className="font-medium text-white">{row.original.piv}</div>
      )
    },
    {
      header: "K/D",
      accessorKey: "kd",
      cell: ({ row }: any) => {
        const kd = row.original.kd;
        const textColor = kd >= 1.0 ? "text-green-400" : "text-yellow-400";
        
        return (
          <div className={`text-sm font-medium ${textColor}`}>{kd}</div>
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
            Details
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold">Players</h2>
          <p className="text-gray-400 text-sm">Ranked by Player Impact Value (PIV)</p>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4 md:mt-0">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search players..."
              className="rounded-lg bg-gray-800 border-gray-700 text-sm py-2 pl-10 pr-4 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          
          <div className="inline-flex items-center space-x-2">
            <span className="text-sm text-gray-400">Role:</span>
            <Select
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <SelectTrigger className="rounded-lg bg-gray-800 border-gray-700 text-sm py-2 px-3 w-[140px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Roles">All Roles</SelectItem>
                <SelectItem value={PlayerRole.IGL}>IGL</SelectItem>
                <SelectItem value={PlayerRole.AWPer}>AWPer</SelectItem>
                <SelectItem value={PlayerRole.Spacetaker}>Spacetaker</SelectItem>
                <SelectItem value={PlayerRole.Lurker}>Lurker</SelectItem>
                <SelectItem value={PlayerRole.Anchor}>Anchor</SelectItem>
                <SelectItem value={PlayerRole.Support}>Support</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {topPlayersByRole.highest && (
          <StatsCard
            title="Highest PIV"
            value={topPlayersByRole.highest.name}
            metric={`${topPlayersByRole.highest.piv} PIV`}
            metricColor="text-green-400"
            bgColor="bg-green-500/10"
            icon={<User2 className="h-6 w-6 text-green-500" />}
            subtext={`Team: ${topPlayersByRole.highest.team}`}
          />
        )}
        
        {topPlayersByRole.lurker && (
          <StatsCard
            title="Best Lurker"
            value={topPlayersByRole.lurker.name}
            metric={`${topPlayersByRole.lurker.piv} PIV`}
            metricColor="text-blue-400"
            bgColor="bg-blue-500/10"
            icon={<Shield className="h-6 w-6 text-blue-500" />}
            subtext={`${topPlayersByRole.lurker.primaryMetric.name}: ${topPlayersByRole.lurker.primaryMetric.value.toFixed(2)}`}
          />
        )}
        
        {topPlayersByRole.awper && (
          <StatsCard
            title="Best AWPer"
            value={topPlayersByRole.awper.name}
            metric={`${topPlayersByRole.awper.piv} PIV`}
            metricColor="text-amber-400"
            bgColor="bg-amber-500/10"
            icon={<Target className="h-6 w-6 text-amber-500" />}
            subtext={`${topPlayersByRole.awper.primaryMetric.name}: ${topPlayersByRole.awper.primaryMetric.value.toFixed(2)}`}
          />
        )}
        
        {topPlayersByRole.igl && (
          <StatsCard
            title="Best IGL"
            value={topPlayersByRole.igl.name}
            metric={`${topPlayersByRole.igl.piv} PIV`}
            metricColor="text-purple-400"
            bgColor="bg-purple-500/10"
            icon={<Lightbulb className="h-6 w-6 text-purple-500" />}
            subtext={`${topPlayersByRole.igl.primaryMetric.name}: ${topPlayersByRole.igl.primaryMetric.value.toFixed(2)}`}
          />
        )}
      </div>
      
      {/* Players Table */}
      <Card className="bg-background-light rounded-lg border border-gray-700 overflow-hidden">
        {isLoading ? (
          <CardContent className="p-8 flex justify-center">
            <div className="text-center">
              <Rocket className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-sm text-gray-400">Loading player data...</p>
            </div>
          </CardContent>
        ) : isError ? (
          <CardContent className="p-8">
            <div className="text-center text-red-400">
              <p>Error loading player data. Please try again.</p>
            </div>
          </CardContent>
        ) : (
          <DataTable
            columns={columns}
            data={filteredPlayers}
            pageSize={10}
            defaultSortField="piv"
            defaultSortDir="desc"
          />
        )}
      </Card>
    </div>
  );
}
