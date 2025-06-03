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
import exportToPDF from '../lib/pdfExport';

export default function RoleWeightingsPage() {
  const [activeTab, setActiveTab] = useState<string>(PlayerRole.AWP);
  const [activeChart, setActiveChart] = useState<'radar' | 'bar'>('radar');
  const [weightsModified, setWeightsModified] = useState<boolean>(false);
  const [showBasicMetrics, setShowBasicMetrics] = useState<boolean>(true);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(true);
  
  // Local state for adjustable weights
  const [customWeights, setCustomWeights] = useState<{[role: string]: {[metric: string]: number}}>({});
  
  // Handle PDF export - exports all roles to a single PDF
  const handleExportToPDF = () => {
    const filename = `CS2_Role_Weightings_Complete.pdf`;
    // Use the new function to export all roles
    import('../lib/pdfExport').then(module => {
      module.exportAllRolesToPDF(roleInfo, filename);
    });
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
        description: "IGLs' ability to enable teammates and create strategic advantages.",
        formula: "Team KAST % (40%) + Round Win % After Timeout (35%) + Team Flash Assists (25%)" 
      }
    },
    [PlayerRole.Spacetaker]: {
      title: "Spacetaker",
      description: "Aggressive players who create space and gain map control for their team.",
      basicMetrics: basicRoleMetrics[PlayerRole.Spacetaker],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Spacetaker],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Spacetaker],
      synergy: { 
        name: "Entry Success Synergy", 
        description: "Spacetakers' ability to create openings and be effectively traded.",
        formula: "Traded % (45%) + Team Trade Success After Entry (35%) + Opening Duel Win % (20%)" 
      }
    },
    [PlayerRole.Lurker]: {
      title: "Lurker",
      description: "Solo players who work the flanks and gather information for their team.",
      basicMetrics: basicRoleMetrics[PlayerRole.Lurker],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Lurker],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Lurker],
      synergy: { 
        name: "Map Control Synergy", 
        description: "Lurkers' effectiveness in controlling areas and disrupting enemy rotations.",
        formula: "Flanking Success Rate (40%) + Impact in Late-Round Scenarios (35%) + K/D Ratio (25%)" 
      }
    },
    [PlayerRole.Anchor]: {
      title: "Anchor",
      description: "Defenders who specialize in holding bombsites against enemy attacks.",
      basicMetrics: basicRoleMetrics[PlayerRole.Anchor],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Anchor],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Anchor],
      synergy: { 
        name: "Site Defense Synergy", 
        description: "Anchors' ability to hold positions and delay enemy advances.",
        formula: "Multi-Kill % on Site Defense (45%) + Survival Time in Site Takes (30%) + Utility Damage (25%)" 
      }
    },
    [PlayerRole.Support]: {
      title: "Support",
      description: "Utility-focused players who enable their teammates' success through coordination.",
      basicMetrics: basicRoleMetrics[PlayerRole.Support],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Support],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Support],
      synergy: { 
        name: "Utility Support Synergy", 
        description: "Supports' effectiveness in enabling team success through utility and coordination.",
        formula: "Flash Assist Percentage (40%) + Smoke/Molotov Effectiveness (35%) + Team Success in Executes (25%)" 
      }
    },
    [PlayerRole.Rotator]: {
      title: "Rotator",
      description: "Dynamic defenders who quickly move between positions to reinforce teammates.",
      basicMetrics: basicRoleMetrics[PlayerRole.Rotator],
      advancedMetrics: advancedRoleMetrics[PlayerRole.Rotator],
      consistencyFactors: basicConsistencyMetrics[PlayerRole.Rotator],
      synergy: { 
        name: "Rotation Efficiency Synergy", 
        description: "Rotators' ability to provide timely reinforcement and maintain map control.",
        formula: "Rotation Speed Rating (40%) + Post-Rotation Impact (35%) + Through Smoke Kills / Kills (25%)" 
      }
    },
  };

  // PIV Formula Components
  const pivComponents = [
    { name: "Role Core Score (RCS)", description: "Measures how well a player performs core metrics for their assigned role", weight: 0.40, examples: "AWP: Opening kills, site control | Support: Flash assists, trades" },
    { name: "Individual Consistency Factor (ICF)", description: "Measures player's consistency across matches and maps", weight: 0.20, examples: "Low variance in K/D, ADR, KAST across maps and matches" },
    { name: "Synergy Contribution (SC)", description: "Measures how player enhances teammates' performance", weight: 0.25, examples: "Entry: Creating space | Support: Flash assists | Lurker: Flank timing" },
    { name: "Opponent Strength Multiplier (OSM)", description: "Accounts for quality of opposition faced", weight: 0.15, examples: "Performance against top-10 teams weighted more heavily" }
  ];

  // Sample comparative role data
  const roleComparisonData = [
    { metric: "Opening Kill Impact", AWP: 90, IGL: 60, Spacetaker: 85, Lurker: 60, Anchor: 65, Support: 50, Rotator: 60 },
    { metric: "Clutch Win Impact", AWP: 75, IGL: 65, Spacetaker: 70, Lurker: 85, Anchor: 80, Support: 60, Rotator: 70 },
    { metric: "K/D Influence", AWP: 85, IGL: 60, Spacetaker: 80, Lurker: 75, Anchor: 75, Support: 65, Rotator: 70 },
    { metric: "Multi-Kill Emphasis", AWP: 80, IGL: 55, Spacetaker: 75, Lurker: 70, Anchor: 85, Support: 60, Rotator: 75 },
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

  // Initialize weights from metrics data if not already initialized
  useEffect(() => {
    if (Object.keys(customWeights).length === 0) {
      const initialWeights: {[role: string]: {[metric: string]: number}} = {};
      
      Object.keys(roleInfo).forEach((role) => {
        initialWeights[role] = {};
        
        // Initialize basic metrics
        roleInfo[role as PlayerRole].basicMetrics.forEach(metric => {
          initialWeights[role][metric.name] = metric.weight;
        });
        
        // Initialize advanced metrics
        roleInfo[role as PlayerRole].advancedMetrics.forEach(metric => {
          initialWeights[role][metric.name] = metric.weight;
        });
      });
      
      setCustomWeights(initialWeights);
    }
  }, [roleInfo]);

  // Handle weight adjustment
  const handleWeightChange = (role: string, metricName: string, newValue: number) => {
    setCustomWeights(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [metricName]: newValue
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
              <CardTitle>
                PIV (Player Impact Value) Formula Components
              </CardTitle>
              <CardDescription>
                How different factors contribute to a player's overall impact rating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pivComponents.map((component, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{component.name} ({component.weight * 100}%)</span>
                      <span className="text-sm text-gray-400">{component.weight * 100}%</span>
                    </div>
                    <Progress value={component.weight * 100} className="h-2" />
                    <p className="text-sm text-gray-400">{component.description}</p>
                    <p className="text-xs text-gray-500">Examples: {component.examples}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background-light rounded-lg border border-gray-700">
            <CardHeader>
              <CardTitle>
                Role Comparison
              </CardTitle>
              <CardDescription>
                Relative weighting of metrics across different roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex mb-4 space-x-2">
                <Button 
                  onClick={() => setActiveChart('radar')}
                  variant={activeChart === 'radar' ? 'default' : 'outline'}
                  size="sm"
                >
                  Radar Chart
                </Button>
                <Button 
                  onClick={() => setActiveChart('bar')}
                  variant={activeChart === 'bar' ? 'default' : 'outline'}
                  size="sm"
                >
                  Bar Chart
                </Button>
              </div>
              
              <div className="h-80">
                {activeChart === 'radar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={roleComparisonData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis domain={[0, 100]} />
                      <Radar name="AWP" dataKey="AWP" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                      <Radar name="IGL" dataKey="IGL" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                      <Radar name="Spacetaker" dataKey="Spacetaker" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                      <Radar name="Support" dataKey="Support" stroke="#ff8042" fill="#ff8042" fillOpacity={0.3} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={roleComparisonData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="metric" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="AWP" fill="#8884d8" name="AWP" />
                      <Bar dataKey="IGL" fill="#82ca9d" name="IGL" />
                      <Bar dataKey="Spacetaker" fill="#ffc658" name="Spacetaker" />
                      <Bar dataKey="Support" fill="#ff8042" name="Support" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Card className="bg-background-light rounded-lg border border-gray-700">
            <CardHeader>
              <CardTitle>
                Role-Specific Metrics and Weights
              </CardTitle>
              <CardDescription>
                Customize how different metrics contribute to each role's PIV calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end mb-4 space-x-4">
                <div className="flex items-center space-x-2">
                  <label className="text-sm">Show Basic Metrics</label>
                  <Switch 
                    checked={showBasicMetrics} 
                    onCheckedChange={setShowBasicMetrics}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm">Show Advanced Metrics</label>
                  <Switch 
                    checked={showAdvancedMetrics} 
                    onCheckedChange={setShowAdvancedMetrics}
                  />
                </div>
                {weightsModified && (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="flex items-center gap-1"
                    >
                      <ResetIcon className="h-4 w-4" />
                      Reset
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleApplyWeights}
                      className="flex items-center gap-1"
                    >
                      <SaveIcon className="h-4 w-4" />
                      Apply Changes
                    </Button>
                  </div>
                )}
              </div>
              
              <Tabs defaultValue={PlayerRole.AWP} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-4">
                  <TabsTrigger value={PlayerRole.AWP}>AWPer</TabsTrigger>
                  <TabsTrigger value={PlayerRole.IGL}>IGL</TabsTrigger>
                  <TabsTrigger value={PlayerRole.Spacetaker}>Spacetaker</TabsTrigger>
                  <TabsTrigger value={PlayerRole.Lurker}>Lurker</TabsTrigger>
                  <TabsTrigger value={PlayerRole.Anchor}>Anchor</TabsTrigger>
                  <TabsTrigger value={PlayerRole.Support}>Support</TabsTrigger>
                  <TabsTrigger value={PlayerRole.Rotator}>Rotator</TabsTrigger>
                </TabsList>
                
                {Object.entries(roleInfo).map(([role, info]) => (
                  <TabsContent key={role} value={role} className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{info.title}</h3>
                      <p className="text-gray-400">{info.description}</p>
                    </div>
                    
                    {showBasicMetrics && (
                      <div className="space-y-4">
                        <h4 className="font-medium border-b border-gray-700 pb-2">Basic Metrics (50% Weighting)</h4>
                        {info.basicMetrics.map((metric, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span>{metric.name}</span>
                              <span className="text-sm text-gray-400">{(customWeights[role]?.[metric.name] * 2 * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Slider 
                                defaultValue={[metric.weight * 2 * 100]} 
                                max={100} 
                                step={1}
                                onValueChange={(values) => handleWeightChange(role, metric.name, values[0] / 100 / 2)}
                              />
                            </div>
                            <p className="text-xs text-gray-500">{metric.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {showAdvancedMetrics && (
                      <div className="space-y-4">
                        <h4 className="font-medium border-b border-gray-700 pb-2">Advanced Metrics (50% Weighting)</h4>
                        {info.advancedMetrics.map((metric, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span>{metric.name}</span>
                              <span className="text-sm text-gray-400">{(customWeights[role]?.[metric.name] * 2 * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Slider 
                                defaultValue={[metric.weight * 2 * 100]} 
                                max={100} 
                                step={1}
                                onValueChange={(values) => handleWeightChange(role, metric.name, values[0] / 100 / 2)}
                              />
                            </div>
                            <p className="text-xs text-gray-500">{metric.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <h4 className="font-medium border-b border-gray-700 pb-2">Role Synergy Calculation</h4>
                      <div className="p-3 bg-card rounded-md">
                        <p className="font-medium">{info.synergy.name}</p>
                        <p className="text-sm text-gray-400 mt-1">{info.synergy.description}</p>
                        <p className="text-xs bg-accent p-2 rounded mt-2 font-mono">Formula: {info.synergy.formula}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium border-b border-gray-700 pb-2">Basic Consistency Factors</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {info.consistencyFactors.map((factor, idx) => (
                          <div key={idx} className="p-3 bg-card rounded-md">
                            <div className="flex justify-between items-center mb-1">
                              <p className="font-medium">{factor.name}</p>
                              <span className="text-xs text-gray-400">{factor.weight * 100}%</span>
                            </div>
                            <p className="text-xs text-gray-500">{factor.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}