import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CalendarDays,
  Database,
  Globe,
  Info,
  Map,
  RefreshCw,
  Shield,
  TrendingUp,
  Trophy,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface Tournament {
  id: string;
  name: string;
  location: string;
  start_date: string;
  end_date: string;
  teams_count: number | string;
  matches_count: number | string;
  source: string;
  status: string;
}

interface PGLBucharestData {
  available: boolean;
  data?: {
    tournament?: Tournament;
    event?: any;
    matches?: any[];
    playerStats?: any[];
    source: string;
  };
}

export function TournamentOverview() {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  
  const {
    data: tournaments,
    isLoading: isLoadingTournaments,
    error: tournamentsError,
    refetch: refetchTournaments,
  } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });
  
  const {
    data: pglBucharestData,
    isLoading: isLoadingPGL,
    error: pglError,
  } = useQuery<PGLBucharestData>({
    queryKey: ['/api/tournaments/pgl-bucharest'],
  });
  
  const {
    data: tournamentPlayers,
    isLoading: isLoadingPlayers,
  } = useQuery({
    queryKey: ['/api/tournaments', selectedTournament, 'players'],
    enabled: !!selectedTournament,
  });
  
  const handleSelectTournament = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return dateString || 'N/A';
    }
  };

  return (
    <Card className="glassmorphism border-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          Tournament Data Explorer
        </CardTitle>
        <CardDescription>
          Explore and analyze data from various CS2 tournaments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Tournaments</TabsTrigger>
            <TabsTrigger value="pgl">PGL Bucharest</TabsTrigger>
            <TabsTrigger value="tournament-details">Tournament Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-blue-100">Available Tournaments</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => refetchTournaments()}
                disabled={isLoadingTournaments}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTournaments ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {tournamentsError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load tournament data. Please try again later.
                </AlertDescription>
              </Alert>
            ) : isLoadingTournaments ? (
              <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </>
            ) : tournaments && tournaments.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tournament</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Teams</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tournaments.map((tournament) => (
                      <TableRow key={tournament.id} className="hover:bg-blue-950/30">
                        <TableCell className="font-medium">
                          {tournament.name}
                          <Badge 
                            variant={tournament.status === 'completed' ? "success" : "outline"}
                            className="ml-2"
                          >
                            {tournament.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <Globe className="h-3 w-3 text-blue-400" />
                          {tournament.location || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-blue-400" />
                            {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-blue-400" />
                            {tournament.teams_count || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {tournament.source === 'csv' ? (
                              <>CSV</>
                            ) : (
                              <>
                                <Database className="h-3 w-3 mr-1" />
                                {tournament.source}
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectTournament(tournament.id)}
                          >
                            Explore
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Tournaments</AlertTitle>
                <AlertDescription>
                  No tournament data found in the database.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="pgl" className="space-y-4 pt-4">
            <h3 className="text-lg font-medium text-blue-100">PGL Bucharest Data</h3>
            
            {pglError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load PGL Bucharest data. Please try again later.
                </AlertDescription>
              </Alert>
            ) : isLoadingPGL ? (
              <>
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </>
            ) : pglBucharestData?.available ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">Tournament Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-blue-300/70">Name:</dt>
                        <dd className="font-medium text-blue-100">
                          {pglBucharestData.data?.tournament?.name || 
                           pglBucharestData.data?.event?.name || 'PGL Bucharest'}
                        </dd>
                        
                        <dt className="text-blue-300/70">Location:</dt>
                        <dd>
                          {pglBucharestData.data?.tournament?.location || 
                           pglBucharestData.data?.event?.location || 'Bucharest, Romania'}
                        </dd>
                        
                        <dt className="text-blue-300/70">Dates:</dt>
                        <dd>
                          {formatDate(pglBucharestData.data?.tournament?.start_date || 
                                     pglBucharestData.data?.event?.start_date || '')} - 
                          {formatDate(pglBucharestData.data?.tournament?.end_date || 
                                     pglBucharestData.data?.event?.end_date || '')}
                        </dd>
                        
                        <dt className="text-blue-300/70">Data Source:</dt>
                        <dd className="capitalize">{pglBucharestData.data?.source || 'Supabase'}</dd>
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">Statistics Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <dt className="text-blue-300/70">Teams:</dt>
                        <dd className="font-medium text-blue-100">
                          {pglBucharestData.data?.tournament?.teams_count || 
                          (pglBucharestData.data?.matches && new Set(
                            pglBucharestData.data.matches.flatMap(m => [m.team1, m.team2].filter(Boolean))
                          ).size) || 'N/A'}
                        </dd>
                        
                        <dt className="text-blue-300/70">Matches:</dt>
                        <dd>
                          {pglBucharestData.data?.tournament?.matches_count || 
                           pglBucharestData.data?.matches?.length || 'N/A'}
                        </dd>
                        
                        <dt className="text-blue-300/70">Players:</dt>
                        <dd>
                          {pglBucharestData.data?.playerStats?.length || 'N/A'}
                        </dd>
                        
                        <dt className="text-blue-300/70">Status:</dt>
                        <dd>
                          <Badge 
                            variant={pglBucharestData.data?.tournament?.status === 'completed' ? "success" : "outline"}
                          >
                            {pglBucharestData.data?.tournament?.status || 'Completed'}
                          </Badge>
                        </dd>
                      </dl>
                    </CardContent>
                  </Card>
                </div>
                
                {pglBucharestData.data?.matches && pglBucharestData.data.matches.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-100 mb-2">Recent Matches</h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Teams</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Map</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pglBucharestData.data.matches.slice(0, 5).map((match, index) => (
                            <TableRow key={match.id || index}>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className={match.winner === match.team1 ? 'font-bold text-green-400' : ''}>
                                    {match.team1}
                                  </span>
                                  <span className={match.winner === match.team2 ? 'font-bold text-green-400' : ''}>
                                    {match.team2}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-bold">
                                {match.score || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Map className="h-3 w-3 text-blue-400" />
                                  {match.map || 'Unknown map'}
                                </div>
                              </TableCell>
                              <TableCell>
                                {match.matchDate ? formatDate(match.matchDate) : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>No PGL Bucharest Data</AlertTitle>
                <AlertDescription>
                  PGL Bucharest tournament data is not available in the current database.
                  This data needs to be added to the Supabase database to be accessible here.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="tournament-details" className="space-y-4 pt-4">
            {selectedTournament ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-blue-100">
                    Tournament Players: {tournaments?.find(t => t.id === selectedTournament)?.name}
                  </h3>
                  <Badge variant="outline">
                    {isLoadingPlayers ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    )}
                    {isLoadingPlayers ? 'Loading data...' : `${tournamentPlayers?.length || 0} players`}
                  </Badge>
                </div>
                
                {isLoadingPlayers ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : tournamentPlayers && tournamentPlayers.length > 0 ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Player</TableHead>
                          <TableHead>Team</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>K/D</TableHead>
                          <TableHead>HS%</TableHead>
                          <TableHead>Rating</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tournamentPlayers.slice(0, 15).map((player: any) => (
                          <TableRow key={player.id}>
                            <TableCell className="font-medium">
                              {player.name}
                              {player.isIGL && (
                                <Badge className="ml-2 bg-amber-500/50 hover:bg-amber-500/60">
                                  IGL
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{player.team || player.teamName || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {player.role || player.ctRole || player.tRole || 'Support'}
                              </Badge>
                            </TableCell>
                            <TableCell>{player.kd || (player.kills && player.deaths ? (player.kills / player.deaths).toFixed(2) : 'N/A')}</TableCell>
                            <TableCell>{player.hs || player.HSPercent || player.averageHS || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge 
                                className={`${parseFloat(player.piv || player.pivValue || '0') > 1.5 ? 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black' : 'bg-blue-800'}`}
                              >
                                {player.piv || player.pivValue || 'N/A'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {tournamentPlayers.length > 15 && (
                      <div className="p-2 text-center text-sm text-blue-400/70">
                        Showing 15 of {tournamentPlayers.length} players
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Player Data</AlertTitle>
                    <AlertDescription>
                      No player data available for this tournament.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTournament(null)}
                  >
                    Back to Tournaments
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Trophy className="h-12 w-12 text-blue-400/40 mb-4" />
                <h3 className="text-lg font-medium text-blue-100 mb-2">No Tournament Selected</h3>
                <p className="text-blue-300/70 mb-4 max-w-md">
                  Select a tournament from the "All Tournaments" tab to view detailed player statistics
                  and performance data.
                </p>
                <Button
                  variant="outline"
                  onClick={() => document.querySelector('[data-value="all"]')?.dispatchEvent(
                    new MouseEvent('click', { bubbles: true })
                  )}
                >
                  Browse Tournaments
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        <Separator className="my-4 bg-blue-900/30" />
        
        <div className="text-xs text-blue-300/50">
          Data sourced from Supabase database. Tournament details may vary based on data availability.
        </div>
      </CardContent>
    </Card>
  );
}