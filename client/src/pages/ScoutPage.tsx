import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TeamReplacementRecommender from '@/components/scouting/TeamReplacementRecommender';
import LineupSynergyMatrix from '@/components/scouting/LineupSynergyMatrix';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, UserCheck, UserSearch, Loader2 } from 'lucide-react';

export default function ScoutPage() {
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("replacement");
  
  // Define team type
  type Team = {
    id: string;
    name: string;
    avg_piv: number;
  };

  // Fetch teams for dropdown
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });
  
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CS2 Scouting System</h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-3xl">
          Use advanced analytics to find optimal player replacements and analyze potential lineups for your team.
        </p>
      </div>
      
      <Tabs defaultValue="replacement" onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <TabsList className="mb-4 md:mb-0">
            <TabsTrigger value="replacement" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Replacement Scout
            </TabsTrigger>
            <TabsTrigger value="synergy" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Lineup Synergy
            </TabsTrigger>
          </TabsList>
          
          {activeTab === "replacement" && (
            <div className="w-full md:w-64">
              <Select
                value={selectedTeam}
                onValueChange={setSelectedTeam}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a team" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Loading teams...</span>
                    </div>
                  ) : (
                    teams?.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        
        <TabsContent value="replacement" className="space-y-4">
          {selectedTeam ? (
            <TeamReplacementRecommender teamId={selectedTeam} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Player Replacement Scout</CardTitle>
                <CardDescription>
                  Select a team to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserSearch className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-center text-muted-foreground max-w-md">
                  Please select a team from the dropdown above to see player replacement recommendations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="synergy" className="space-y-4">
          <LineupSynergyMatrix />
        </TabsContent>
      </Tabs>
    </div>
  );
}
