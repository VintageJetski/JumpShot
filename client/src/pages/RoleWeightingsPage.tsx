import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerRole } from '@shared/schema';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

export default function RoleWeightingsPage() {
  const [activeTab, setActiveTab] = React.useState<string>(PlayerRole.AWP);
  
  // Get all players for statistical analysis
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['/api/players'],
  });
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-2xl font-semibold text-gray-400">Loading role metrics...</div>
        </div>
      </div>
    );
  }
  
  // Role-specific info for display
  const roleInfo = {
    [PlayerRole.AWP]: {
      title: "AWPer",
      description: "Specialists who excel with the AWP sniper rifle, controlling key areas of the map.",
      primaryMetrics: [
        { name: "Opening Pick Success Rate", weight: 0.25, description: "The AWPer's effectiveness in securing opening kills." },
        { name: "Angle Hold Success", weight: 0.20, description: "Ability to maintain control over key angles and positions." },
        { name: "Multi Kill Conversion", weight: 0.15, description: "Converting AWP shots into multiple frags in a round." },
        { name: "Retake Contribution Index", weight: 0.10, description: "Impact of AWP during retake situations." },
        { name: "K/D Ratio", weight: 0.15, description: "Direct impact of K/D on AWPer PIV calculation." },
      ],
      synergy: { 
        name: "Flash Assist Synergy", 
        description: "AWPers' synergy with teammates through flash assists and tactical coordination.",
        formula: "Assisted Flashes / Total Utility + K/D Factor (30%)" 
      }
    },
    [PlayerRole.IGL]: {
      title: "In-Game Leader",
      description: "Team leaders who coordinate strategies and make mid-round calls.",
      primaryMetrics: [
        { name: "Tactical Timeout Success", weight: 0.20, description: "Effectiveness of tactics after timeouts." },
        { name: "Team Economy Preservation", weight: 0.20, description: "Ability to manage team economy efficiently." },
        { name: "Opening Play Success Rate", weight: 0.15, description: "Success of initial strategies in rounds." },
        { name: "Kill Participation Index", weight: 0.10, description: "Direct involvement in team's kills." },
        { name: "K/D Ratio", weight: 0.10, description: "Direct impact of K/D on IGL PIV calculation, reduced by 25%." },
      ],
      synergy: { 
        name: "In-game Impact Rating", 
        description: "IGLs' ability to enable teammates and create space for plays.",
        formula: "Assists / Kills Ratio (40%) + K/D Factor (20%)" 
      }
    },
    [PlayerRole.Spacetaker]: {
      title: "Entry Fragger / Spacetaker",
      description: "Aggressive players who create space and take map control.",
      primaryMetrics: [
        { name: "Opening Duel Success Rate", weight: 0.25, description: "Success rate in first engagements." },
        { name: "Aggression Efficiency Index", weight: 0.20, description: "Balance of aggressive plays and survival." },
        { name: "Trade Conversion Rate", weight: 0.15, description: "Ability to trade kills effectively." },
        { name: "First Blood Impact", weight: 0.15, description: "Impact of securing the first kill in rounds." },
        { name: "K/D Ratio", weight: 0.20, description: "Direct impact of K/D on Entry Fragger PIV calculation." },
      ],
      synergy: { 
        name: "Utility Effectiveness Score", 
        description: "Entry fraggers' effectiveness with utility to create space.",
        formula: "Assisted Flashes / Kills (50%) + K/D Factor (35%)" 
      }
    },
    [PlayerRole.Lurker]: {
      title: "Lurker",
      description: "Players who flank, gather information, and disrupt opponent rotations.",
      primaryMetrics: [
        { name: "Zone Influence Stability", weight: 0.20, description: "Ability to control areas of the map alone." },
        { name: "Rotation Disruption Impact", weight: 0.20, description: "Success in disrupting enemy rotations." },
        { name: "Flank Success Rate", weight: 0.20, description: "Success of flank attempts." },
        { name: "Clutch Conversion Rate", weight: 0.15, description: "Performance in late-round 1vX situations." },
        { name: "K/D Ratio", weight: 0.15, description: "Direct impact of K/D on Lurker PIV calculation." },
      ],
      synergy: { 
        name: "Information Retrieval Success", 
        description: "Lurkers' ability to gather and act on information.",
        formula: "Through Smoke Kills / Kills (40%) + K/D Factor (25%)" 
      }
    },
    [PlayerRole.Anchor]: {
      title: "Anchor",
      description: "Defensive specialists who hold bombsites securely on CT side.",
      primaryMetrics: [
        { name: "Site Hold Success Rate", weight: 0.25, description: "Effectiveness in defending a bombsite." },
        { name: "Survival Rate Post-Engagement", weight: 0.20, description: "Ability to survive after initial engagements." },
        { name: "Multi-Kill Defense Ratio", weight: 0.15, description: "Securing multiple kills while defending." },
        { name: "Opponent Entry Denial Rate", weight: 0.15, description: "Success in preventing T-side entry." },
        { name: "K/D Ratio", weight: 0.15, description: "Direct impact of K/D on Anchor PIV calculation." },
      ],
      synergy: { 
        name: "Site Hold Effectiveness", 
        description: "Anchors' effectiveness in site defense and retakes.",
        formula: "CT Rounds Won / Total Rounds (45%) + K/D Factor (25%)" 
      }
    },
    [PlayerRole.Support]: {
      title: "Support",
      description: "Utility-focused players who enable teammates' success.",
      primaryMetrics: [
        { name: "Utility Setup Efficiency", weight: 0.25, description: "Effectiveness of utility usage." },
        { name: "Support Flash Assist", weight: 0.20, description: "Enabling teammates with flash assists." },
        { name: "Anti-Exec Utility Success", weight: 0.15, description: "Disrupting enemy executes with utility." },
        { name: "Retake Utility Coordination", weight: 0.15, description: "Effectiveness of utility during retakes." },
        { name: "K/D Ratio", weight: 0.10, description: "Direct impact of K/D on Support PIV calculation." },
      ],
      synergy: { 
        name: "Utility Contribution Score", 
        description: "Support players' ability to enable teammates with utility.",
        formula: "Assisted Flashes / Total Utility (65%) + K/D Factor (15%)" 
      }
    },
    [PlayerRole.Rotator]: {
      title: "Rotator",
      description: "Flexible players who move between sites and adapt to different situations.",
      primaryMetrics: [
        { name: "Rotation Efficiency Index", weight: 0.25, description: "Speed and effectiveness of rotations." },
        { name: "Adaptive Defense Score", weight: 0.20, description: "Ability to adapt to different situations." },
        { name: "Site Lockdown Rate", weight: 0.15, description: "Success in locking down areas after rotation." },
        { name: "Entry Denial Efficiency", weight: 0.15, description: "Preventing entries after rotating." },
        { name: "K/D Ratio", weight: 0.15, description: "Direct impact of K/D on Rotator PIV calculation." },
      ],
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
  
  const activeRoleInfo = roleInfo[activeTab as PlayerRole];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
        PIV Weighting System and Role Analysis
      </h1>
      
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
            <CardTitle>K/D Influence by Role</CardTitle>
            <CardDescription>
              K/D ratio impacts PIV differently across roles, with direct and indirect components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rolePivComposition}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" tick={{ fill: '#9ca3af' }} />
                  <YAxis tick={{ fill: '#9ca3af' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#e5e7eb' }}
                    labelStyle={{ color: 'white', fontWeight: 'bold' }}
                  />
                  <Legend />
                  <Bar dataKey="kd" name="Direct K/D Impact" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="icf" name="ICF (K/D based)" stackId="a" fill="#10b981" />
                  <Bar dataKey="sc" name="Synergy Contribution" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="rcs" name="Role Core Score" stackId="a" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-400 mt-4">
              This chart shows how K/D ratio influences PIV scores across roles, both directly and through the ICF factor.
              Entry Fraggers and AWPers have the highest direct K/D weighting, while IGLs and Support players are less dependent on K/D.
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="grid grid-cols-7 gap-2 w-full">
          {Object.values(PlayerRole).map((role) => (
            <TabsTrigger key={role} value={role}>{roleInfo[role].title}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-background-light rounded-lg border border-gray-700">
          <CardHeader>
            <CardTitle>{activeRoleInfo.title} Metrics</CardTitle>
            <CardDescription>{activeRoleInfo.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activeRoleInfo.primaryMetrics.map((metric) => (
                <div key={metric.name} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{metric.name}</span>
                    <span className="text-sm text-gray-400">{(metric.weight * 100).toFixed(0)}%</span>
                  </div>
                  <Progress value={metric.weight * 100} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
                </div>
              ))}
              
              <div className="bg-gray-800 p-4 rounded-lg mt-4">
                <div className="text-sm font-semibold mb-2">Synergy Contribution</div>
                <div className="font-medium text-sm">{activeRoleInfo.synergy.name}</div>
                <div className="text-xs text-gray-400 mt-1">{activeRoleInfo.synergy.description}</div>
                <div className="font-mono text-xs bg-gray-900 p-2 rounded mt-2">
                  Formula: {activeRoleInfo.synergy.formula}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background-light rounded-lg border border-gray-700">
          <CardHeader>
            <CardTitle>Role Attribute Comparison</CardTitle>
            <CardDescription>Relative importance of different skills by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart outerRadius={90} data={roleMetricsRadarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#9ca3af' }} />
                  <PolarRadiusAxis tick={{ fill: '#9ca3af' }} />
                  <Radar
                    name={activeRoleInfo.title}
                    dataKey={activeTab}
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#e5e7eb' }}
                    labelStyle={{ color: 'white', fontWeight: 'bold' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-gray-400 mt-4 text-center">
              This radar chart shows the relative importance of different skill sets for the {activeRoleInfo.title} role
              compared to other roles in the CS2 ecosystem.
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-background-light rounded-lg border border-gray-700 mt-8">
        <CardHeader>
          <CardTitle>Individual Consistency Factor (ICF) Components</CardTitle>
          <CardDescription>
            How the ICF is calculated and adjusted based on player role and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ICFFactors.map((factor) => (
              <div key={factor.name} className="bg-gray-800 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between">
                  <div className="font-medium text-sm mb-2 sm:mb-0">{factor.name}</div>
                  <div className="text-sm text-gray-300">
                    <span className="text-xs text-gray-400 mr-2">Applies to:</span>
                    {factor.role}
                  </div>
                </div>
                {factor.weight && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-400">Weighting Factor</span>
                      <span className="text-sm text-gray-300">{typeof factor.weight === 'number' ? factor.weight : factor.weight}</span>
                    </div>
                    {typeof factor.weight === 'number' && factor.weight > 0 && (
                      <Progress value={Math.min(factor.weight / 2 * 100, 100)} className="h-1" />
                    )}
                  </div>
                )}
                {factor.formula && (
                  <div className="font-mono text-xs bg-gray-900 p-2 rounded mt-2">
                    {factor.formula}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">{factor.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}