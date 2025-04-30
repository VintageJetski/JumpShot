import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerRole } from '@shared/schema';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { RotateCcw as ResetIcon, Save as SaveIcon, FileDown } from 'lucide-react';
import exportToPDF from '@/lib/pdfExport';

export default function RoleWeightingsPage() {
  const [activeTab, setActiveTab] = useState<string>(PlayerRole.AWP);
  const [activeChart, setActiveChart] = useState<'radar' | 'bar'>('radar');
  const [weightsModified, setWeightsModified] = useState<boolean>(false);
  const [showBasicMetrics, setShowBasicMetrics] = useState<boolean>(true);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(true);
  
  // Local state for adjustable weights
  const [customWeights, setCustomWeights] = useState<{[role: string]: {[metric: string]: number}}>({});
  
  // Handle PDF export
  const handleExportToPDF = () => {
    const filename = `CS2_Role_Weightings_${roleInfo[activeTab as PlayerRole].title.replace(/\s+/g, '_')}.pdf`;
    exportToPDF("weightings-content", filename);
  };
  
  // Get all players for statistical analysis
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['/api/players'],
  });
  
  // Basic Consistency Metrics from CSV
  const basicConsistencyMetrics = {
    [PlayerRole.IGL]: [
      { name: "Flash Assists", weight: 0.2, description: "Consistency in providing flash assists" },
      { name: "Smokes thrown", weight: 0.2, description: "Consistency in smoke utility usage" },
      { name: "Rounds won after time out", weight: 0.1, description: "Effectiveness of strategy after timeouts" },
      { name: "Pistol rounds won", weight: 0.1, description: "Success in pistol rounds (team metric)" },
      { name: "T Rounds won", weight: 0.3, description: "Success on T-side (team metric)" },
      { name: "KAST", weight: 0.1, description: "Consistency in Kill, Assist, Survive, Trade" }
    ],
    [PlayerRole.AWP]: [
      { name: "KAST", weight: 0.3, description: "Consistency in overall round contribution" },
      { name: "Opening duels", weight: 0.2, description: "Consistency in first engagements" },
      { name: "ADR", weight: 0.2, description: "Consistency in damage per round" },
      { name: "Trade %", weight: 0.1, description: "Consistency in trading kills" },
      { name: "Clutch rounds won", weight: 0.1, description: "Consistency in clutch situations" },
      { name: "Flash Assists", weight: 0.1, description: "Consistency in utility support" }
    ],
    [PlayerRole.Support]: [
      { name: "KAST", weight: 0.5, description: "Consistency in overall round contribution" },
      { name: "Trade %", weight: 0.2, description: "Consistency in trading kills" },
      { name: "Flash Assists", weight: 0.1, description: "Consistency in flash support" },
      { name: "Clutch rounds won", weight: 0.1, description: "Consistency in clutch situations" },
      { name: "Smokes thrown", weight: 0.1, description: "Consistency in utility usage" }
    ],
    [PlayerRole.Spacetaker]: [
      { name: "Opening duels", weight: 0.3, description: "Consistency in entry engagements" },
      { name: "Multi-kill rounds", weight: 0.2, description: "Consistency in securing multiple kills" },
      { name: "Traded %", weight: 0.1, description: "Consistency in being traded by teammates" },
      { name: "Kills", weight: 0.1, description: "Consistency in frag output" },
      { name: "ADR", weight: 0.2, description: "Consistency in damage per round" },
      { name: "KAST", weight: 0.1, description: "Consistency in overall round contribution" }
    ],
    [PlayerRole.Lurker]: [
      { name: "Kills", weight: 0.3, description: "Consistency in frag output" },
      { name: "Opening duels", weight: 0.2, description: "Consistency in first engagements" },
      { name: "Clutch rounds won", weight: 0.2, description: "Consistency in clutch situations" },
      { name: "ADR", weight: 0.1, description: "Consistency in damage per round" },
      { name: "KAST", weight: 0.2, description: "Consistency in overall round contribution" }
    ],
    [PlayerRole.Anchor]: [
      { name: "Multi-kill rounds", weight: 0.3, description: "Consistency in securing multiple kills on defense" },
      { name: "Utility damage", weight: 0.2, description: "Consistency in utility impact" },
      { name: "Clutch rounds won", weight: 0.2, description: "Consistency in clutch situations" },
      { name: "KAST", weight: 0.3, description: "Consistency in overall round contribution" }
    ],
    [PlayerRole.Rotator]: [
      { name: "Flash Assists", weight: 0.2, description: "Consistency in flash support" },
      { name: "Trade %", weight: 0.2, description: "Consistency in trading kills" },
      { name: "Smokes thrown", weight: 0.1, description: "Consistency in utility usage" },
      { name: "ADR", weight: 0.2, description: "Consistency in damage per round" },
      { name: "KAST", weight: 0.3, description: "Consistency in overall round contribution" }
    ],
  };

  // Basic Metrics from CSV - with 50% weighting
  const basicRoleMetrics = {
    [PlayerRole.IGL]: [
      { name: "Round Win Rate in Rifle Rounds", weight: 0.245 * 0.5, description: "Reflects macro calling in even-firepower rounds" },
      { name: "Utility Usage Efficiency", weight: 0.21 * 0.5, description: "Measures strategic impact of utility usage" },
      { name: "Timeout Conversion Rate", weight: 0.14 * 0.5, description: "Rounds won after team timeouts" },
      { name: "Basic Consistency", weight: 0.105 * 0.5, description: "Consistency in IGL metrics across maps" },
      { name: "Eco/Force Round Conversion", weight: 0.15 * 0.5, description: "Gauges low-econ strategy success" },
      { name: "5v4 Conversion Rate", weight: 0.15 * 0.5, description: "Shows mid-round calling with man advantage" }
    ],
    [PlayerRole.AWP]: [
      { name: "Opening Kill Ratio", weight: 0.28 * 0.5, description: "Key opening-duel measure with AWP" },
      { name: "Basic Consistency", weight: 0.205 * 0.5, description: "Consistency in AWP performance" },
      { name: "AWP Kill Share", weight: 0.175 * 0.5, description: "AWP kills as percentage of total kills" },
      { name: "Multi-Kill Conversion", weight: 0.14 * 0.5, description: "Multiple kills with AWP in a round" },
      { name: "Save + Rebuy Efficiency", weight: 0.15 * 0.5, description: "Economy handling and weapon preservation" },
      { name: "Weapon Survival Rate", weight: 0.05 * 0.5, description: "Surviving rounds with AWP" }
    ],
    [PlayerRole.Spacetaker]: [
      { name: "Opening Duel Success Rate", weight: 0.28 * 0.5, description: "Success in T-side entry frags" },
      { name: "Trade Kill Involvement", weight: 0.175 * 0.5, description: "Involvement in team's trades" },
      { name: "Average Damage per Round", weight: 0.14 * 0.5, description: "Damage output per round" },
      { name: "Basic Consistency", weight: 0.105 * 0.5, description: "Consistency in entry performance" },
      { name: "Headshot Percentage", weight: 0.15 * 0.5, description: "Percentage of kills as headshots" },
      { name: "T-Side KAST", weight: 0.15 * 0.5, description: "Kill, Assist, Survive, Trade on T-side" }
    ],
    [PlayerRole.Lurker]: [
      { name: "1vX Conversion Rate", weight: 0.21 * 0.5, description: "Success in clutch situations" },
      { name: "Late-Round Survival Rate", weight: 0.21 * 0.5, description: "Surviving late in rounds" },
      { name: "KAST", weight: 0.175 * 0.5, description: "Kill, Assist, Survive, Trade overall" },
      { name: "Basic Consistency", weight: 0.105 * 0.5, description: "Consistency in lurker metrics" },
      { name: "Clutch Rounds Entered", weight: 0.15 * 0.5, description: "Frequency of being last alive" },
      { name: "T-Side K/D Ratio", weight: 0.15 * 0.5, description: "Kill-to-death ratio on T-side" }
    ],
    [PlayerRole.Anchor]: [
      { name: "Site Hold Success Rate", weight: 0.245 * 0.5, description: "Successful bombsite defense" },
      { name: "Multi-Kills on CT", weight: 0.175 * 0.5, description: "Multiple kills in CT rounds" },
      { name: "CT-Side ADR", weight: 0.175 * 0.5, description: "Damage per round on CT side" },
      { name: "Basic Consistency", weight: 0.105 * 0.5, description: "Consistency in CT performance" },
      { name: "CT-Side KAST", weight: 0.15 * 0.5, description: "KAST on CT side only" },
      { name: "CT Utility Efficiency", weight: 0.15 * 0.5, description: "Effectiveness of defensive utility" }
    ],
    [PlayerRole.Support]: [
      { name: "Flash Assist Ratio", weight: 0.21 * 0.5, description: "Flash assists relative to flashes thrown" },
      { name: "Save Rounds / Economy Preservation", weight: 0.175 * 0.5, description: "Preserving weapons on lost rounds" },
      { name: "Bomb Plant/Defuse Count", weight: 0.175 * 0.5, description: "Direct objective involvement" },
      { name: "Basic Consistency", weight: 0.14 * 0.5, description: "Consistency in support metrics" },
      { name: "Non-Flash Utility Impact", weight: 0.15 * 0.5, description: "Impact of HE/molotov utility" },
      { name: "T-Side Plant Conversion", weight: 0.15 * 0.5, description: "Bomb plants on T-side rounds" }
    ],
    [PlayerRole.Rotator]: [
      { name: "Rotation Speed", weight: 0.25 * 0.5, description: "Quickness in rotating between sites" },
      { name: "CT-Side ADR", weight: 0.20 * 0.5, description: "Damage per round on CT side" },
      { name: "Multi-Kills After Rotation", weight: 0.15 * 0.5, description: "Multiple kills after rotating" },
      { name: "Basic Consistency", weight: 0.15 * 0.5, description: "Consistency in rotation performance" },
      { name: "Flash Assist Ratio", weight: 0.15 * 0.5, description: "Flash assists relative to flashes thrown" },
      { name: "CT-Side KAST", weight: 0.10 * 0.5, description: "KAST on CT side only" }
    ]
  };

  // Advanced metrics - with 50% weighting
  const advancedRoleMetrics = {
    [PlayerRole.AWP]: [
      { name: "Opening Pick Success Rate", weight: 0.25 * 0.5, description: "The AWPer's effectiveness in securing opening kills." },
      { name: "Angle Hold Success", weight: 0.20 * 0.5, description: "Ability to maintain control over key angles and positions." },
      { name: "Multi Kill Conversion", weight: 0.15 * 0.5, description: "Converting AWP shots into multiple frags in a round." },
      { name: "Retake Contribution Index", weight: 0.10 * 0.5, description: "Impact of AWP during retake situations." },
      { name: "K/D Ratio", weight: 0.15 * 0.5, description: "Direct impact of K/D on AWPer PIV calculation." },
    ],
    [PlayerRole.IGL]: [
      { name: "Tactical Timeout Success", weight: 0.20 * 0.5, description: "Effectiveness of tactics after timeouts." },
      { name: "Team Economy Preservation", weight: 0.20 * 0.5, description: "Ability to manage team economy efficiently." },
      { name: "Opening Play Success Rate", weight: 0.15 * 0.5, description: "Success of initial strategies in rounds." },
      { name: "Kill Participation Index", weight: 0.10 * 0.5, description: "Direct involvement in team's kills." },
      { name: "K/D Ratio", weight: 0.10 * 0.5, description: "Direct impact of K/D on IGL PIV calculation, reduced by 25%." },
    ],
    [PlayerRole.Spacetaker]: [
      { name: "Opening Duel Success Rate", weight: 0.25 * 0.5, description: "Success rate in first engagements." },
      { name: "Aggression Efficiency Index", weight: 0.20 * 0.5, description: "Balance of aggressive plays and survival." },
      { name: "Trade Conversion Rate", weight: 0.15 * 0.5, description: "Ability to trade kills effectively." },
      { name: "First Blood Impact", weight: 0.15 * 0.5, description: "Impact of securing the first kill in rounds." },
      { name: "K/D Ratio", weight: 0.20 * 0.5, description: "Direct impact of K/D on Entry Fragger PIV calculation." },
    ],
    [PlayerRole.Lurker]: [
      { name: "Zone Influence Stability", weight: 0.20 * 0.5, description: "Ability to control areas of the map alone." },
      { name: "Rotation Disruption Impact", weight: 0.20 * 0.5, description: "Success in disrupting enemy rotations." },
      { name: "Flank Success Rate", weight: 0.20 * 0.5, description: "Success of flank attempts." },
      { name: "Clutch Conversion Rate", weight: 0.15 * 0.5, description: "Performance in late-round 1vX situations." },
      { name: "K/D Ratio", weight: 0.15 * 0.5, description: "Direct impact of K/D on Lurker PIV calculation." },
    ],
    [PlayerRole.Anchor]: [
      { name: "Site Hold Success Rate", weight: 0.25 * 0.5, description: "Effectiveness in defending a bombsite." },
      { name: "Survival Rate Post-Engagement", weight: 0.20 * 0.5, description: "Ability to survive after initial engagements." },
      { name: "Multi-Kill Defense Ratio", weight: 0.15 * 0.5, description: "Securing multiple kills while defending." },
      { name: "Opponent Entry Denial Rate", weight: 0.15 * 0.5, description: "Success in preventing T-side entry." },
      { name: "K/D Ratio", weight: 0.15 * 0.5, description: "Direct impact of K/D on Anchor PIV calculation." },
    ],
    [PlayerRole.Support]: [
      { name: "Utility Setup Efficiency", weight: 0.25 * 0.5, description: "Effectiveness of utility usage." },
      { name: "Support Flash Assist", weight: 0.20 * 0.5, description: "Enabling teammates with flash assists." },
      { name: "Anti-Exec Utility Success", weight: 0.15 * 0.5, description: "Disrupting enemy executes with utility." },
      { name: "Retake Utility Coordination", weight: 0.15 * 0.5, description: "Effectiveness of utility during retakes." },
      { name: "K/D Ratio", weight: 0.10 * 0.5, description: "Direct impact of K/D on Support PIV calculation." },
    ],
    [PlayerRole.Rotator]: [
      { name: "Rotation Efficiency Index", weight: 0.25 * 0.5, description: "Speed and effectiveness of rotations." },
      { name: "Adaptive Defense Score", weight: 0.20 * 0.5, description: "Ability to adapt to different situations." },
      { name: "Site Lockdown Rate", weight: 0.15 * 0.5, description: "Success in locking down areas after rotation." },
      { name: "Entry Denial Efficiency", weight: 0.15 * 0.5, description: "Preventing entries after rotating." },
      { name: "K/D Ratio", weight: 0.15 * 0.5, description: "Direct impact of K/D on Rotator PIV calculation." },
    ],
  };

  // Define initial role info
  const roleInfo = {
    [PlayerRole.AWP]: {
      title: "AWPer",
      description: "Specialists who excel with the AWP sniper rifle, controlling key areas of the map.",
      basicMetrics: basicRoleMetrics[PlayerRole.AWP],
      advancedMetrics: advancedRoleMetrics[PlayerRole.AWP],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.AWP],
      synergy: { 
        name: "Flash Assist Synergy", 
        description: "AWPers' synergy with teammates through flash assists and tactical coordination.",
        formula: "Assisted Flashes / Total Utility + K/D Factor (30%)" 
      }
    },
    [PlayerRole.IGL]: {
      title: "In-Game Leader",
      description: "Team leaders who coordinate strategies and make mid-round calls.",
      basicMetrics: basicRoleMetrics[PlayerRole.IGL],
      advancedMetrics: advancedRoleMetrics[PlayerRole.IGL],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.IGL],
      synergy: { 
        name: "In-game Impact Rating", 
        description: "IGLs' ability to enable teammates and create space for plays.",
        formula: "Assists / Kills Ratio (40%) + K/D Factor (20%)" 
      }
    },
    [PlayerRole.Spacetaker]: {
      title: "Entry Fragger / Spacetaker",
      description: "Aggressive players who create space and take map control.",
      basicMetrics: basicRoleMetrics[PlayerRole.Spacetaker],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Spacetaker],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Spacetaker],
      synergy: { 
        name: "Utility Effectiveness Score", 
        description: "Entry fraggers' effectiveness with utility to create space.",
        formula: "Assisted Flashes / Kills (50%) + K/D Factor (35%)" 
      }
    },
    [PlayerRole.Lurker]: {
      title: "Lurker",
      description: "Players who flank, gather information, and disrupt opponent rotations.",
      basicMetrics: basicRoleMetrics[PlayerRole.Lurker],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Lurker],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Lurker],
      synergy: { 
        name: "Information Retrieval Success", 
        description: "Lurkers' ability to gather and act on information.",
        formula: "Through Smoke Kills / Kills (40%) + K/D Factor (25%)" 
      }
    },
    [PlayerRole.Anchor]: {
      title: "Anchor",
      description: "Defensive specialists who hold bombsites securely on CT side.",
      basicMetrics: basicRoleMetrics[PlayerRole.Anchor],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Anchor],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Anchor],
      synergy: { 
        name: "Site Hold Effectiveness", 
        description: "Anchors' effectiveness in site defense and retakes.",
        formula: "CT Rounds Won / Total Rounds (45%) + K/D Factor (25%)" 
      }
    },
    [PlayerRole.Support]: {
      title: "Support",
      description: "Utility-focused players who enable teammates' success.",
      basicMetrics: basicRoleMetrics[PlayerRole.Support],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Support],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Support],
      synergy: { 
        name: "Utility Contribution Score", 
        description: "Support players' ability to enable teammates with utility.",
        formula: "Assisted Flashes / Total Utility (65%) + K/D Factor (15%)" 
      }
    },
    [PlayerRole.Rotator]: {
      title: "Rotator",
      description: "Flexible players who move between sites and adapt to different situations.",
      basicMetrics: basicRoleMetrics[PlayerRole.Rotator],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Rotator],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Rotator],
      synergy: { 
        name: "Rotation Efficiency", 
        description: "Rotators' effectiveness in different positions and situations.",
        formula: "CT Rounds Won / Total Rounds (40%) + K/D Factor (25%)" 
      }
    },
  };

  const PIVFactors = [
    { name: "RCS (Role Core Score)", weight: 0.40, description: "Measures how well a player performs in their specific role" },
    { name: "ICF (Individual Consistency Factor)", weight: 0.25, description: "Measures player consistency across matches and rounds" },
    { name: "SC (Synergy Contribution)", weight: 0.25, description: "Measures how well a player enables teammates' success" },
    { name: "OSM (Opponent Strength Multiplier)", weight: 0.10, description: "Adjusts for the level of opposition faced" },
  ];
  
  const ICFFactors = [
    { name: "Base K/D Impact", role: "All Roles", weight: 1.8, description: "Baseline influence of K/D ratio on consistency" },
    { name: "IGL Adjustment", role: PlayerRole.IGL, weight: -0.25, description: "Reduction factor applied to IGLs to balance scoring" },
    { name: "Star Player Bonus", role: "Non-IGL with K/D > 1.2", weight: "+0.25 per 0.1 K/D", description: "Bonus for exceptional fraggers" },
    { name: "Base Formula", role: "All Roles", formula: "ICF = 1 / (1 + σ)", description: "Where σ represents the K/D-based volatility" },
  ];
  
  const rolePivComposition = [
    { name: "AWP", rcs: 0.40, icf: 0.20, sc: 0.30, kd: 0.15 },
    { name: "IGL", rcs: 0.45, icf: 0.15, sc: 0.30, kd: 0.10 },
    { name: "Spacetaker", rcs: 0.35, icf: 0.20, sc: 0.25, kd: 0.20 },
    { name: "Lurker", rcs: 0.40, icf: 0.20, sc: 0.25, kd: 0.15 },
    { name: "Anchor", rcs: 0.45, icf: 0.20, sc: 0.20, kd: 0.15 },
    { name: "Support", rcs: 0.45, icf: 0.15, sc: 0.30, kd: 0.10 },
    { name: "Rotator", rcs: 0.40, icf: 0.20, sc: 0.25, kd: 0.15 },
  ];
  
  const roleMetricsRadarData = [
    { metric: "Mechanical Skill", AWP: 90, IGL: 60, Spacetaker: 85, Lurker: 70, Anchor: 65, Support: 60, Rotator: 75 },
    { metric: "Positioning", AWP: 85, IGL: 70, Spacetaker: 65, Lurker: 80, Anchor: 90, Support: 75, Rotator: 80 },
    { metric: "Game Sense", AWP: 75, IGL: 95, Spacetaker: 70, Lurker: 85, Anchor: 80, Support: 80, Rotator: 85 },
    { metric: "Utility Usage", AWP: 60, IGL: 85, Spacetaker: 70, Lurker: 75, Anchor: 80, Support: 90, Rotator: 75 },
    { metric: "Team Play", AWP: 65, IGL: 90, Spacetaker: 70, Lurker: 65, Anchor: 70, Support: 85, Rotator: 80 },
  ];
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-2xl font-semibold text-gray-400">Loading role metrics...</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    setActiveChart('radar');
    
    // Initialize custom weights if empty
    setCustomWeights(prev => {
      if (!Object.keys(prev).length) {
        const initialWeights: {[role: string]: {[metric: string]: number}} = {};
        
        Object.values(PlayerRole).forEach(role => {
          initialWeights[role] = {};
          
          // Set weights for basic metrics
          basicRoleMetrics[role].forEach(metric => {
            initialWeights[role][metric.name] = metric.weight;
          });
          
          // Set weights for advanced metrics
          advancedRoleMetrics[role].forEach(metric => {
            initialWeights[role][metric.name] = metric.weight;
          });
        });
        
        return initialWeights;
      }
      return prev;
    });
  }, []);

  // Reset weights to default
  const handleResetWeights = () => {
    const defaultWeights: {[role: string]: {[metric: string]: number}} = {};
    
    Object.values(PlayerRole).forEach(role => {
      defaultWeights[role] = {};
      
      // Reset basic metrics to default (50% of original weights)
      basicRoleMetrics[role].forEach(metric => {
        defaultWeights[role][metric.name] = metric.weight;
      });
      
      // Reset advanced metrics to default (50% of original weights)
      advancedRoleMetrics[role].forEach(metric => {
        defaultWeights[role][metric.name] = metric.weight;
      });
    });
    
    setCustomWeights(defaultWeights);
    setWeightsModified(false);
  };

  // Update a metric weight
  const handleUpdateWeight = (role: string, metricName: string, newWeight: number) => {
    setCustomWeights(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [metricName]: newWeight
      }
    }));
    setWeightsModified(true);
  };

  // Apply weight changes to backend
  const handleApplyWeights = () => {
    // In a real implementation, this would make an API call to update weights in the backend
    console.log("Applying weights to backend:", customWeights);
    alert("Weight changes have been applied to the PIV calculations!");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          PIV Weighting System and Role Analysis
        </h1>
        <Button 
          onClick={handleExportToPDF}
          className="flex items-center gap-2"
          variant="outline"
        >
          <FileDown className="h-4 w-4" />
          Export as PDF
        </Button>
      </div>
      
      <div id="weightings-content">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card className="bg-background-light rounded-lg border border-gray-700">
          <CardHeader>
            <CardTitle>PIV Formula Components</CardTitle>
            <CardDescription>
              The Player Impact Value (PIV) formula combines multiple factors to create a comprehensive score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {PIVFactors.map((factor) => (
                <div key={factor.name} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{factor.name}</span>
                    <span className="text-sm text-gray-400">{(factor.weight * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={factor.weight * 100} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{factor.description}</p>
                </div>
              ))}
              
              <div className="bg-gray-800 p-4 rounded-lg mt-4">
                <div className="text-sm font-semibold mb-2">PIV Calculation Formula</div>
                <div className="font-mono text-xs bg-gray-900 p-2 rounded">
                  PIV = [(RCS × ICF) + SC] × OSM × K/D Factor
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  The formula is then scaled by 100 for display purposes (0.765 → 77)
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background-light rounded-lg border border-gray-700">
          <CardHeader>
            <CardTitle>Role-Specific PIV Factor Weightings</CardTitle>
            <CardDescription>
              Different roles have different emphasis on PIV factors in their calculations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={rolePivComposition}
                  margin={{ top: 20, right: 30, left: 0, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} 
                    domain={[0, 1]}
                  />
                  <Tooltip 
                    formatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
                    labelFormatter={(label) => `${label} Role`}
                  />
                  <Legend />
                  <Bar dataKey="rcs" name="RCS (Role Core Score)" stackId="a" fill="#8884d8" />
                  <Bar dataKey="icf" name="ICF (Consistency)" stackId="a" fill="#82ca9d" />
                  <Bar dataKey="sc" name="SC (Synergy)" stackId="a" fill="#ffc658" />
                  <Bar dataKey="kd" name="K/D Factor" stackId="a" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
              <div className="text-xs text-gray-400 mt-4">
                Chart shows how PIV composition varies by role. IGLs and Supports have higher weight on synergy while Spacetakers (Entry Fraggers) emphasize K/D more heavily.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-background-light rounded-lg border border-gray-700 mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Role Analysis and Metrics</h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Switch 
                  id="showBasicMetrics" 
                  checked={showBasicMetrics} 
                  onCheckedChange={setShowBasicMetrics}
                />
                <label htmlFor="showBasicMetrics" className="text-sm">Basic Metrics</label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="showAdvancedMetrics" 
                  checked={showAdvancedMetrics} 
                  onCheckedChange={setShowAdvancedMetrics}
                />
                <label htmlFor="showAdvancedMetrics" className="text-sm">Advanced Metrics</label>
              </div>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full">
              {Object.values(PlayerRole).map((role) => (
                <TabsTrigger key={role} value={role}>{roleInfo[role].title}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="bg-gray-800 p-4 rounded-lg mb-6">
                    <h3 className="text-xl font-semibold">{roleInfo[activeTab as PlayerRole].title}</h3>
                    <p className="text-gray-400 mt-2">{roleInfo[activeTab as PlayerRole].description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Metrics and Weights</h3>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResetWeights}
                        disabled={!weightsModified}
                        className="flex items-center gap-1 text-xs"
                      >
                        <ResetIcon className="h-3 w-3" />
                        Reset
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleApplyWeights}
                        disabled={!weightsModified}
                        className="flex items-center gap-1 text-xs"
                      >
                        <SaveIcon className="h-3 w-3" />
                        Apply
                      </Button>
                    </div>
                  </div>
                  
                  {showBasicMetrics && (
                    <>
                      <h4 className="text-md font-medium mb-3 mt-4 text-primary">Basic Metrics (50% Weighting)</h4>
                      <div className="space-y-4 bg-gray-800 p-4 rounded-lg">
                        {basicRoleMetrics[activeTab as PlayerRole].map((metric) => (
                          <div key={metric.name}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">{metric.name}</span>
                              <span className="text-xs text-gray-400">
                                {((customWeights[activeTab]?.[metric.name] || metric.weight) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Slider 
                                value={[(customWeights[activeTab]?.[metric.name] || metric.weight) * 100]} 
                                min={0} 
                                max={50} 
                                step={1}
                                onValueChange={(value) => handleUpdateWeight(activeTab, metric.name, value[0] / 100)}
                                className="flex-1"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {showAdvancedMetrics && (
                    <>
                      <h4 className="text-md font-medium mb-3 mt-4 text-green-500">Advanced Metrics (50% Weighting)</h4>
                      <div className="space-y-4 bg-gray-800 p-4 rounded-lg">
                        {advancedRoleMetrics[activeTab as PlayerRole].map((metric) => (
                          <div key={metric.name}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm">{metric.name}</span>
                              <span className="text-xs text-gray-400">
                                {((customWeights[activeTab]?.[metric.name] || metric.weight) * 100).toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Slider 
                                value={[(customWeights[activeTab]?.[metric.name] || metric.weight) * 100]} 
                                min={0} 
                                max={50} 
                                step={1}
                                onValueChange={(value) => handleUpdateWeight(activeTab, metric.name, value[0] / 100)}
                                className="flex-1"
                              />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Consistency Factors</h3>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <h4 className="text-md font-medium mb-2">Basic Consistency Metrics</h4>
                      <div className="space-y-2">
                        {basicConsistencyMetrics[activeTab as PlayerRole].map((metric) => (
                          <div key={metric.name} className="flex justify-between items-center">
                            <span className="text-sm">{metric.name}</span>
                            <span className="text-xs text-gray-400">{(metric.weight * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">Synergy Contribution</h3>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="text-sm font-medium">{roleInfo[activeTab as PlayerRole].synergy.name}</div>
                      <p className="text-xs text-gray-400 mt-1">{roleInfo[activeTab as PlayerRole].synergy.description}</p>
                      <div className="bg-gray-900 p-2 rounded mt-2">
                        <div className="text-xs font-mono">{roleInfo[activeTab as PlayerRole].synergy.formula}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Role Comparison</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setActiveChart('radar')}
                          className={`px-2 py-1 text-xs rounded ${activeChart === 'radar' ? 'bg-primary text-white' : 'bg-gray-700'}`}
                        >
                          Radar
                        </button>
                        <button 
                          onClick={() => setActiveChart('bar')}
                          className={`px-2 py-1 text-xs rounded ${activeChart === 'bar' ? 'bg-primary text-white' : 'bg-gray-700'}`}
                        >
                          Bar
                        </button>
                      </div>
                    </div>
                    
                    {activeChart === 'radar' ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart outerRadius={90} data={roleMetricsRadarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: '#e0e0e0', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar 
                              name={activeTab}
                              dataKey={activeTab as string}
                              stroke="#8884d8"
                              fill="#8884d8"
                              fillOpacity={0.6}
                            />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={roleMetricsRadarData}
                            margin={{ top: 5, right: 0, left: 0, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="metric" 
                              angle={-45} 
                              textAnchor="end" 
                              height={60} 
                              tick={{ fontSize: 10 }}
                            />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey={activeTab as string} fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {activeTab} compared across fundamental skills required for CS2
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-4">Individual Consistency Factor</h3>
                    <div className="space-y-4">
                      {ICFFactors.filter(f => f.role === "All Roles" || f.role === activeTab).map((factor) => (
                        <div key={factor.name} className="text-sm">
                          <div className="flex justify-between">
                            <span>{factor.name}</span>
                            {typeof factor.weight === 'number' && (
                              <span className="text-gray-400">{factor.weight > 0 ? `+${factor.weight}` : factor.weight}</span>
                            )}
                            {!factor.weight && factor.formula && (
                              <span className="text-xs font-mono text-gray-400">{factor.formula}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{factor.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </div>
    </div>
  );
}