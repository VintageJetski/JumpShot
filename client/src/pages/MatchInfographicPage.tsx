import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamWithTIR, TeamRoundMetrics, PlayerWithPIV } from '../../shared/schema';
import { Loader2, Download, Share2, Check } from 'lucide-react';
import TeamSelect from '@/components/infographic/TeamSelect';
import MatchInfographicGenerator from '@/components/infographic/MatchInfographicGenerator';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

/**
 * MatchInfographicPage - A page for generating shareable match infographics
 * 
 * This page allows users to:
 * 1. Select two teams for comparison
 * 2. Generate an infographic with their match statistics
 * 3. Download or share the infographic on social media
 */
export default function MatchInfographicPage() {
  // Team selection state
  const [team1Name, setTeam1Name] = useState<string>('');
  const [team2Name, setTeam2Name] = useState<string>('');
  
  // Track if the infographic has been generated
  const [isGenerated, setIsGenerated] = useState(false);

  // Track download/share status
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Reference to the infographic container
  const infographicRef = useRef<HTMLDivElement>(null);
  
  // Toast for notifications
  const { toast } = useToast();
  
  // Fetch teams for selection
  const { data: teams, isLoading: isLoadingTeams } = useQuery<TeamWithTIR[]>({
    queryKey: ['/api/teams'],
  });
  
  // Fetch team data for the selected teams
  const { data: team1, isLoading: isLoadingTeam1 } = useQuery<TeamWithTIR>({
    queryKey: [`/api/teams/${team1Name}`],
    enabled: !!team1Name,
  });
  
  const { data: team2, isLoading: isLoadingTeam2 } = useQuery<TeamWithTIR>({
    queryKey: [`/api/teams/${team2Name}`],
    enabled: !!team2Name,
  });
  
  // Fetch round metrics for selected teams
  const { data: team1RoundMetrics, isLoading: isLoadingTeam1Metrics } = useQuery<TeamRoundMetrics>({
    queryKey: [`/api/round-metrics/${team1Name}`],
    enabled: !!team1Name,
  });
  
  const { data: team2RoundMetrics, isLoading: isLoadingTeam2Metrics } = useQuery<TeamRoundMetrics>({
    queryKey: [`/api/round-metrics/${team2Name}`],
    enabled: !!team2Name,
  });
  
  // Calculate if all required data is loaded
  const isDataLoading = isLoadingTeam1 || isLoadingTeam2 || isLoadingTeam1Metrics || isLoadingTeam2Metrics;
  const hasSelectedTeams = !!team1Name && !!team2Name;
  const hasCompleteData = hasSelectedTeams && team1 && team2 && team1RoundMetrics && team2RoundMetrics;
  
  // Handle generation of infographic
  const handleGenerateInfographic = () => {
    if (hasCompleteData) {
      setIsGenerated(true);
    }
  };
  
  // Reset selections and regenerate
  const handleReset = () => {
    setIsGenerated(false);
  };
  
  // Download infographic as PNG
  const handleDownload = async () => {
    if (!infographicRef.current) return;
    
    try {
      setIsDownloading(true);
      const dataUrl = await toPng(infographicRef.current, { 
        quality: 0.95,
        backgroundColor: '#000000',
        canvasWidth: 1200,
        width: 1200
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `${team1?.name}_vs_${team2?.name}_match_infographic.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Download successful",
        description: "Your infographic has been saved as a PNG image",
        variant: "default",
      });
    } catch (err) {
      console.error('Error generating image:', err);
      toast({
        title: "Download failed",
        description: "There was an error generating the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Share infographic (copy to clipboard or open native share if available)
  const handleShare = async () => {
    if (!infographicRef.current) return;
    
    try {
      setIsSharing(true);
      
      // Generate image
      const dataUrl = await toPng(infographicRef.current, { 
        quality: 0.95,
        backgroundColor: '#000000',
        canvasWidth: 1200,
        width: 1200
      });
      
      // Use native sharing if available
      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${team1?.name}_vs_${team2?.name}_match_infographic.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `CS2 Match Analysis: ${team1?.name} vs ${team2?.name}`,
          text: 'Check out this CS2 match analysis infographic!',
          files: [file]
        });
        
        toast({
          title: "Shared successfully",
          description: "Your infographic has been shared",
          variant: "default",
        });
      } else {
        // Fallback to clipboard copy
        await navigator.clipboard.writeText(
          `CS2 Match Analysis: ${team1?.name} vs ${team2?.name} | Generated by CS2 Analytics Platform`
        );
        
        toast({
          title: "Link copied to clipboard",
          description: "Share link has been copied to your clipboard",
          variant: "default",
        });
      }
    } catch (err) {
      console.error('Error sharing image:', err);
      toast({
        title: "Share failed",
        description: "There was an error sharing the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Match Infographic Generator</h1>
        <p className="text-gray-400">
          Create shareable infographics with match statistics and player highlights
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Teams</CardTitle>
          <CardDescription>
            Choose two teams to generate a match infographic comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TeamSelect 
              label="Team 1"
              teams={teams || []}
              selectedTeam={team1Name}
              onSelectTeam={setTeam1Name}
              disabled={isGenerated}
              isLoading={isLoadingTeams}
            />
            
            <TeamSelect 
              label="Team 2"
              teams={teams || []}
              selectedTeam={team2Name}
              onSelectTeam={setTeam2Name}
              disabled={isGenerated}
              isLoading={isLoadingTeams}
            />
          </div>
          
          <div className="mt-6 flex gap-2 justify-end">
            {!isGenerated ? (
              <Button 
                onClick={handleGenerateInfographic}
                disabled={!hasCompleteData || isDataLoading}
              >
                {isDataLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Generate Infographic
              </Button>
            ) : (
              <Button variant="outline" onClick={handleReset}>
                Reset & Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {isGenerated && hasCompleteData && (
        <Card>
          <CardHeader>
            <CardTitle>Match Infographic</CardTitle>
            <CardDescription>
              Your custom match infographic is ready to download or share
            </CardDescription>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isDownloading ? "Downloading..." : "Download PNG"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4" />
                )}
                {isSharing ? "Sharing..." : "Share"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              id="infographic-container" 
              ref={infographicRef}
              className="border border-gray-700 rounded-md p-6 bg-black"
            >
              <MatchInfographicGenerator 
                team1={team1}
                team2={team2}
                team1RoundMetrics={team1RoundMetrics}
                team2RoundMetrics={team2RoundMetrics}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}