import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Search, Users, GitMerge, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";
import TeamChemistrySimulator from "../components/scout/TeamChemistrySimulator";

// Define the tabs for the Scout page
enum ScoutTab {
  TeamSelector = "team-selector",
  PlayerSearch = "player-search"
}

export default function ScoutPage() {
  const [activeTab, setActiveTab] = useState<ScoutTab>(ScoutTab.TeamSelector);
  const [location, setLocation] = useLocation();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Parse URL parameters when the component mounts or location changes
  useEffect(() => {
    // Extract the selectedPlayer parameter from the URL if it exists
    const params = new URLSearchParams(location.split('?')[1]);
    const playerParam = params.get('selectedPlayer');
    
    if (playerParam) {
      setSelectedPlayerId(playerParam);
      // Ensure we're on the team chemistry tab
      setActiveTab(ScoutTab.TeamSelector);
    }
  }, [location]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Move Scout 2.0 header to full width at the top */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Scout 2.0</h1>
        <p className="text-muted-foreground mt-1">
          Build, optimize, and analyze CS2 team compositions
        </p>
      </div>

      <div className="flex justify-end mb-6">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as ScoutTab)}
          className="w-full md:w-auto"
        >
          <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
            <TabsTrigger value={ScoutTab.TeamSelector} className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Team Chemistry</span>
            </TabsTrigger>
            <TabsTrigger value={ScoutTab.PlayerSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Player Search</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={ScoutTab.TeamSelector} className="mt-6">
            <TeamChemistrySimulator selectedPlayerId={selectedPlayerId} />
          </TabsContent>
          
          <TabsContent value={ScoutTab.PlayerSearch} className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Player Scout</CardTitle>
                <CardDescription>
                  Search for players that match specific role requirements and team synergy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Search className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Find Players</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Our enhanced player search lets you filter by role, stats, and more.
                    Find the perfect player for your team based on performance metrics and team fit.
                  </p>
                  <Button 
                    onClick={() => setLocation('/scout/search-players')}
                    className="gap-2"
                  >
                    Go to Player Search
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}