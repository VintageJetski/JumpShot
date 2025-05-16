import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle,
  CalendarDays,
  Database,
  Globe,
  Info,
  RefreshCw,
  Users
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

export function TournamentBrowser() {
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

  const renderTournamentList = () => {
    if (tournamentsError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load tournament data. Please try again later.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (isLoadingTournaments) {
      return (
        <>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </>
      );
    }
    
    if (!tournaments || tournaments.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Tournaments</AlertTitle>
          <AlertDescription>
            No tournament data found in the database.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
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
                    variant={tournament.status === 'completed' ? "default" : "outline"}
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
                    View Players
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderTournamentPlayers = () => {
    if (!selectedTournament) return null;
    
    if (isLoadingPlayers) {
      return (
        <>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </>
      );
    }
    
    const players = tournamentPlayers as any[] || [];
    
    if (players.length === 0) {
      return (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Player Data</AlertTitle>
          <AlertDescription>
            No player data available for this tournament.
          </AlertDescription>
        </Alert>
      );
    }
    
    const tournament = tournaments?.find(t => t.id === selectedTournament);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-blue-100">
            Players: {tournament?.name}
          </h3>
          <Badge variant="outline">
            {players.length} players
          </Badge>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>K/D</TableHead>
                <TableHead>HS%</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.slice(0, 15).map((player: any) => (
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
                  <TableCell>{player.kd || (player.kills && player.deaths ? (player.kills / player.deaths).toFixed(2) : 'N/A')}</TableCell>
                  <TableCell>{player.hs || player.HSPercent || player.averageHS || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge 
                      className={`${parseFloat(player.piv || player.pivValue || '0') > 1.5 ? 'bg-gradient-to-r from-amber-500 to-yellow-300 text-black' : ''}`}
                    >
                      {player.piv || player.pivValue || 'N/A'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {players.length > 15 && (
            <div className="p-2 text-center text-sm text-blue-400/70">
              Showing 15 of {players.length} players
            </div>
          )}
        </div>
        
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
    );
  };

  return (
    <Card className="glassmorphism border-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          Tournament Database Browser
        </CardTitle>
        <CardDescription>
          View tournament data available in the Supabase database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className={`text-lg font-medium text-blue-100 ${selectedTournament ? 'hidden' : 'block'}`}>
            Available Tournaments
          </h3>
          {!selectedTournament && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchTournaments()}
              disabled={isLoadingTournaments}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingTournaments ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>
        
        {selectedTournament ? renderTournamentPlayers() : renderTournamentList()}
        
        <Separator className="my-4 bg-blue-900/30" />
        
        <div className="text-xs text-blue-300/50">
          Data sourced from Supabase database. Tournament details may vary based on data availability.
        </div>
      </CardContent>
    </Card>
  );
}