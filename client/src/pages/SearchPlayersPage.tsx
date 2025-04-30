import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { PlayerWithPIV, PlayerRole } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import RoleBadge from '@/components/ui/role-badge';
import { BadgeInfo, Search, SlidersHorizontal, ArrowLeft, ArrowUpRight, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useLocation, Link } from 'wouter';

export default function SearchPlayersPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Player search state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<PlayerRole | 'ANY'>('ANY');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  
  // Advanced filters
  const [minPIV, setMinPIV] = useState(0.5);
  const [minKD, setMinKD] = useState(0.8);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [mustBeIGL, setMustBeIGL] = useState(false);
  
  // Fetch players data
  const { data: players = [], isLoading, error } = useQuery<PlayerWithPIV[]>({
    queryKey: ['/api/players'],
  });
  
  // Filter players based on search criteria and advanced filters
  const filteredPlayers = (players || []).filter((player: PlayerWithPIV) => {
    // Basic search
    const matchesSearch = searchQuery === '' || 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase());
      
    // Role filter
    const matchesRole = roleFilter === 'ANY' || 
      player.role === roleFilter || 
      player.tRole === roleFilter || 
      player.ctRole === roleFilter;
      
    // Advanced filters
    const meetsPIV = player.piv >= minPIV;
    const meetsKD = player.kd >= minKD;
    const meetsIGLRequirement = !mustBeIGL || player.isIGL;
    const meetsAvailabilityRequirement = !showOnlyAvailable || player.team === 'Free Agent';
    
    return matchesSearch && matchesRole && meetsPIV && meetsKD && 
      meetsIGLRequirement && meetsAvailabilityRequirement;
  }).sort((a: PlayerWithPIV, b: PlayerWithPIV) => b.piv - a.piv);

  // Handle displaying an error
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading players",
        description: "Unable to fetch player data. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Navigate to player profile
  const viewPlayerProfile = (playerId: string) => {
    setLocation(`/players/${playerId}`);
  };
  
  return (
    <div className="container px-4 py-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation('/scout')}
            className="mr-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Scout
          </Button>
          <h1 className="text-2xl font-bold">Find Players</h1>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="compare">Compare</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>
        
        <TabsContent value="search" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players by name or team..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={roleFilter === "ANY" ? "default" : "outline"}
              size="sm"
              onClick={() => setRoleFilter("ANY")}
            >
              Any Role
            </Button>
            {Object.values(PlayerRole).map(role => (
              <Button 
                key={role}
                variant={roleFilter === role ? "default" : "outline"}
                size="sm"
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </Button>
            ))}
          </div>
          
          {showFilters && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Advanced Filters</CardTitle>
                <CardDescription>Refine your search with specific criteria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="piv-filter">Minimum PIV: {minPIV.toFixed(2)}</Label>
                    </div>
                    <Slider 
                      id="piv-filter"
                      min={0} 
                      max={2} 
                      step={0.1} 
                      value={[minPIV]} 
                      onValueChange={(val) => setMinPIV(val[0])} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="kd-filter">Minimum K/D: {minKD.toFixed(2)}</Label>
                    </div>
                    <Slider 
                      id="kd-filter"
                      min={0.5} 
                      max={2} 
                      step={0.1} 
                      value={[minKD]} 
                      onValueChange={(val) => setMinKD(val[0])} 
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="igl-filter"
                        checked={mustBeIGL}
                        onCheckedChange={setMustBeIGL}
                      />
                      <Label htmlFor="igl-filter">Must be an IGL</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="available-filter"
                        checked={showOnlyAvailable}
                        onCheckedChange={setShowOnlyAvailable}
                      />
                      <Label htmlFor="available-filter">Show only available players</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse text-center">
                <div className="h-6 w-32 bg-gray-200 rounded mx-auto"></div>
                <div className="mt-2 text-sm text-muted-foreground">Loading players...</div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-2">
                Found {filteredPlayers.length} players
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player: PlayerWithPIV) => (
                  <Card key={player.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-bold flex items-center gap-1">
                            {player.name}
                            {player.isIGL && <Badge variant="secondary" className="text-xs ml-1">IGL</Badge>}
                          </CardTitle>
                          <CardDescription>{player.team}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-muted-foreground">PIV</span>
                          <span className="text-xl font-bold">{player.piv.toFixed(2)}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">K/D</span>
                            <span className="font-medium">{player.kd.toFixed(2)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground">Top Metric</span>
                            <span className="font-medium">{player.primaryMetric?.name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="text-xs font-medium mb-1">Roles</div>
                        <div className="flex flex-wrap gap-1">
                          <div className="flex items-center">
                            <span className="text-amber-500 mr-1 text-xs">T:</span>
                            <RoleBadge role={player.tRole} size="sm" />
                          </div>
                          <div className="flex items-center">
                            <span className="text-blue-500 mr-1 text-xs">CT:</span>
                            <RoleBadge role={player.ctRole} size="sm" />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium mb-1">Key Performance</div>
                        <div className="grid grid-cols-3 gap-1">
                          {player.metrics?.roleMetrics && Object.entries(player.metrics.roleMetrics).slice(0, 3).map(([metricName, value], idx: number) => (
                            <div key={idx} className="flex flex-col">
                              <span className="text-xs text-muted-foreground truncate" title={metricName}>
                                {metricName.length > 14 
                                  ? `${metricName.substring(0, 12)}...` 
                                  : metricName}
                              </span>
                              <span className="font-medium">
                                {typeof value === 'number' 
                                  ? value.toFixed(2) 
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="bg-gray-50">
                      <div className="flex justify-between w-full">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => viewPlayerProfile(player.id)}
                        >
                          <BadgeInfo className="w-3.5 h-3.5 mr-1" />
                          Profile
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => {
                            // Navigate to comparison page
                            setLocation(`/compare?player1=${player.id}`);
                          }}
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                          Compare
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {filteredPlayers.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">No players found matching your criteria</div>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setSearchQuery('');
                      setRoleFilter('ANY');
                      setMinPIV(0.5);
                      setMinKD(0.8);
                      setMustBeIGL(false);
                      setShowOnlyAvailable(false);
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="recommended" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Recommended Players</CardTitle>
              <CardDescription>
                Players that match your team composition and needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-4">
                Select a team or build a team in the Scout page to see recommendations
                <div className="mt-3">
                  <Button variant="outline" onClick={() => setLocation('/scout')}>
                    Go to Team Builder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Compare Players</CardTitle>
              <CardDescription>
                Select two players to compare their stats side by side
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-4">
                Select a player from the search results to start a comparison
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}