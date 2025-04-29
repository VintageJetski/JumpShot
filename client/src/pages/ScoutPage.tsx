import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, Users, GitMerge } from "lucide-react";
import TeamChemistrySimulator from "@/components/scout/TeamChemistrySimulator";

// Define the tabs for the Scout page
enum ScoutTab {
  TeamSelector = "team-selector",
  PlayerSearch = "player-search"
}

export default function ScoutPage() {
  const [activeTab, setActiveTab] = useState<ScoutTab>(ScoutTab.TeamSelector);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Scout 2.0</h1>
          <p className="text-muted-foreground mt-1">
            Build, optimize, and analyze CS2 team compositions
          </p>
        </div>
        
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
            <TeamChemistrySimulator />
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
                  <GitMerge className="h-12 w-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Switch to Team Chemistry Simulator</h3>
                  <p className="text-muted-foreground max-w-md">
                    Our enhanced Team Chemistry Simulator now includes all player scouting functionality.
                    Use the Team Chemistry tab to search for players, build teams, and analyze synergy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}