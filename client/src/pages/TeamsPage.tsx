import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { TeamWithTIR } from "../../shared/schema";
import { DataTable } from "../components/ui/data-table";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import StatsCard from "../components/stats/StatsCard";
import { Search, BarChart3, Users, Zap, Rocket } from "lucide-react";

export default function TeamsPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch teams data
  const { data: teams, isLoading, isError } = useQuery<TeamWithTIR[]>({
    queryKey: ["/api/teams"],
  });

  // Apply search filter
  const filteredTeams = teams ? teams
    .filter(team => 
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.tir - a.tir) : [];

  // Get top teams for cards
  const topTeams = {
    highest: filteredTeams[0] || null,
    bestSynergy: filteredTeams.length > 0 ? 
      [...filteredTeams].sort((a, b) => b.synergy - a.synergy)[0] : null,
    highestAvg: filteredTeams.length > 0 ? 
      [...filteredTeams].sort((a, b) => b.avgPIV - a.avgPIV)[0] : null,
  };

  // Table columns definition
  const columns = [
    {
      header: "Team",
      accessorKey: "name",
      cell: ({ row }: any) => {
        const team = row.original;
        const initial = team.name.charAt(0).toUpperCase();
        
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center text-xl font-bold">
              {initial}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium">{team.name}</div>
            </div>
          </div>
        );
      }
    },
    {
      header: "TIR",
      accessorKey: "tir",
      cell: ({ row }: any) => (
        <div className="font-medium text-white">{row.original.tir}</div>
      )
    },
    {
      header: "Sum PIV",
      accessorKey: "sumPIV",
      cell: ({ row }: any) => (
        <div className="text-sm">{row.original.sumPIV}</div>
      )
    },
    {
      header: "Synergy Layer",
      accessorKey: "synergy",
      cell: ({ row }: any) => (
        <div className="text-sm">{row.original.synergy}</div>
      )
    },
    {
      header: "Avg PIV",
      accessorKey: "avgPIV",
      cell: ({ row }: any) => (
        <div className="text-sm">{row.original.avgPIV}</div>
      )
    },
    {
      header: "Top Player",
      accessorKey: "topPlayer",
      cell: ({ row }: any) => {
        const { topPlayer } = row.original;
        
        return (
          <div className="flex items-center">
            <span className="text-sm font-medium">{topPlayer.name}</span>
            <span className="ml-2 text-xs rounded-full bg-green-500/20 text-green-400 px-2">
              {topPlayer.piv}
            </span>
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
            className="text-primary hover:text-primary-light"
            onClick={() => setLocation(`/teams/${encodeURIComponent(row.original.name)}`)}
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
          <h2 className="text-2xl font-bold">Teams</h2>
          <p className="text-gray-400 text-sm">Ranked by Team Impact Rating (TIR)</p>
        </div>
        
        <div className="flex space-x-4 mt-4 md:mt-0">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search teams..."
              className="rounded-lg bg-gray-800 border-gray-700 text-sm py-2 pl-10 pr-4 w-full sm:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
        </div>
      </div>
      
      {/* Team Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {topTeams.highest && (
          <StatsCard
            title="Highest TIR"
            value={topTeams.highest.name}
            metric={`${topTeams.highest.tir} TIR`}
            metricColor="text-green-400"
            bgColor="bg-green-500/10"
            icon={<BarChart3 className="h-6 w-6 text-green-500" />}
            subtext={
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total PIV:</span>
                  <span className="font-medium">{Math.round(topTeams.highest.sumPIV * 100)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">Synergy Layer:</span>
                  <span className="font-medium">{topTeams.highest.synergy.toFixed(2)}</span>
                </div>
              </div>
            }
          />
        )}
        
        {topTeams.bestSynergy && (
          <StatsCard
            title="Best Synergy"
            value={topTeams.bestSynergy.name}
            metric={`${topTeams.bestSynergy.synergy.toFixed(2)} TSL`}
            metricColor="text-blue-400"
            bgColor="bg-blue-500/10"
            icon={<Zap className="h-6 w-6 text-blue-500" />}
            subtext={
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Chain-Kill Conv.:</span>
                  <span className="font-medium">High</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">TIR:</span>
                  <span className="font-medium">{topTeams.bestSynergy.tir}</span>
                </div>
              </div>
            }
          />
        )}
        
        {topTeams.highestAvg && (
          <StatsCard
            title="Highest Avg PIV"
            value={topTeams.highestAvg.name}
            metric={`${Math.round(topTeams.highestAvg.avgPIV * 100)} Avg PIV`}
            metricColor="text-amber-400"
            bgColor="bg-amber-500/10"
            icon={<Users className="h-6 w-6 text-amber-500" />}
            subtext={
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total PIV:</span>
                  <span className="font-medium">{topTeams.highestAvg.sumPIV}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-400">TIR:</span>
                  <span className="font-medium">{topTeams.highestAvg.tir}</span>
                </div>
              </div>
            }
          />
        )}
      </div>
      
      {/* Teams Table */}
      <Card className="bg-background-light rounded-lg border border-gray-700 overflow-hidden">
        {isLoading ? (
          <CardContent className="p-8 flex justify-center">
            <div className="text-center">
              <Rocket className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="mt-2 text-sm text-gray-400">Loading team data...</p>
            </div>
          </CardContent>
        ) : isError ? (
          <CardContent className="p-8">
            <div className="text-center text-red-400">
              <p>Error loading team data. Please try again.</p>
            </div>
          </CardContent>
        ) : (
          <DataTable
            columns={columns}
            data={filteredTeams}
            pageSize={10}
            defaultSortField="tir"
            defaultSortDir="desc"
          />
        )}
      </Card>
    </div>
  );
}
