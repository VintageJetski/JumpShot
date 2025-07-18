import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Users, Zap, Shield } from 'lucide-react';

interface XYZPlayerData {
  tick: number;
  round: number;
  name: string;
  steamId: string;
  side: 't' | 'ct';
  X: number;
  Y: number;
  health: number;
  armor: number;
  flash_duration: number;
  velocity_X: number;
  velocity_Y: number;
}

export default function TacticalInsightsPage() {
  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  const roundData = xyzData.filter(d => d.round === 4);
  
  // Generate tactical insights from authentic data
  const insights = generateTacticalInsights(roundData);

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          Tactical Insights
        </h1>
        <p className="text-muted-foreground">
          Strategic analysis and tactical intelligence from authentic match data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {insight.icon}
                    <Badge variant={insight.type === 'opportunity' ? 'default' : insight.type === 'strength' ? 'secondary' : 'destructive'}>
                      {insight.type}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Round 4
                  </div>
                </div>
                <CardTitle className="text-lg">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm mb-3">
                  {insight.description}
                </CardDescription>
                <div className="space-y-2">
                  {insight.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
                {insight.recommendation && (
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-400 mb-1">Recommendation:</div>
                    <div className="text-sm text-blue-300">{insight.recommendation}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {roundData.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-muted-foreground">
              No tactical data available for analysis. Ensure round data is loaded.
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function generateTacticalInsights(roundData: XYZPlayerData[]) {
  if (roundData.length === 0) return [];

  const insights = [];
  
  // Analyze player distribution
  const tPlayers = roundData.filter(p => p.side === 't');
  const ctPlayers = roundData.filter(p => p.side === 'ct');
  const uniqueTPlayers = [...new Set(tPlayers.map(p => p.name))];
  const uniqueCTPlayers = [...new Set(ctPlayers.map(p => p.name))];

  // Player activity analysis
  const playerActivity = new Map<string, number>();
  roundData.forEach(point => {
    const key = point.name;
    playerActivity.set(key, (playerActivity.get(key) || 0) + 1);
  });

  const mostActivePlayer = [...playerActivity.entries()]
    .sort(([,a], [,b]) => b - a)[0];

  if (mostActivePlayer) {
    insights.push({
      type: 'strength' as const,
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
      title: 'High Activity Player Identified',
      description: 'Player showing exceptional movement and positioning activity.',
      details: [
        `${mostActivePlayer[0]} recorded ${mostActivePlayer[1]} position data points`,
        'Indicates aggressive positioning and map control attempts',
        'High mobility suggests proactive tactical approach'
      ],
      recommendation: `Monitor ${mostActivePlayer[0]}'s positioning patterns for strategic counter-plays.`
    });
  }

  // Health analysis
  const healthData = roundData.filter(p => p.health > 0);
  const lowHealthEvents = roundData.filter(p => p.health > 0 && p.health < 30);
  
  if (lowHealthEvents.length > 0) {
    const affectedPlayers = [...new Set(lowHealthEvents.map(p => p.name))];
    insights.push({
      type: 'weakness' as const,
      icon: <Shield className="w-4 h-4 text-red-500" />,
      title: 'Critical Health Situations Detected',
      description: 'Multiple instances of players in vulnerable low-health states.',
      details: [
        `${affectedPlayers.length} players experienced critical health levels`,
        `${lowHealthEvents.length} total low-health position records`,
        'Indicates intense combat or poor positioning'
      ],
      recommendation: 'Focus on team support and healing prioritization for affected players.'
    });
  }

  // Team distribution analysis
  if (uniqueTPlayers.length > 0 && uniqueCTPlayers.length > 0) {
    insights.push({
      type: 'opportunity' as const,
      icon: <Users className="w-4 h-4 text-blue-500" />,
      title: 'Balanced Team Engagement',
      description: 'Both teams showing active positioning and map presence.',
      details: [
        `${uniqueTPlayers.length} T-side players active: ${uniqueTPlayers.join(', ')}`,
        `${uniqueCTPlayers.length} CT-side players active: ${uniqueCTPlayers.join(', ')}`,
        'Balanced engagement suggests competitive round dynamics'
      ],
      recommendation: 'Analyze positioning patterns to identify strategic advantages.'
    });
  }

  // Velocity analysis
  const movementData = roundData.filter(p => p.velocity_X !== undefined && p.velocity_Y !== undefined);
  const highVelocityEvents = movementData.filter(p => 
    Math.sqrt(p.velocity_X ** 2 + p.velocity_Y ** 2) > 200
  );

  if (highVelocityEvents.length > 0) {
    const fastPlayers = [...new Set(highVelocityEvents.map(p => p.name))];
    insights.push({
      type: 'strength' as const,
      icon: <TrendingUp className="w-4 h-4 text-green-500" />,
      title: 'Rapid Movement Patterns Detected',
      description: 'Players executing high-speed tactical movements.',
      details: [
        `${fastPlayers.length} players with rapid movement: ${fastPlayers.slice(0, 3).join(', ')}`,
        `${highVelocityEvents.length} high-velocity position records`,
        'Suggests aggressive positioning or quick rotations'
      ],
      recommendation: 'Consider counter-positioning to intercept rapid movement patterns.'
    });
  }

  // Flash duration analysis
  const flashedPlayers = roundData.filter(p => p.flash_duration > 0);
  if (flashedPlayers.length > 0) {
    const uniqueFlashedPlayers = [...new Set(flashedPlayers.map(p => p.name))];
    insights.push({
      type: 'opportunity' as const,
      icon: <Target className="w-4 h-4 text-orange-500" />,
      title: 'Flash Utilization Detected',
      description: 'Tactical flash usage affecting player visibility.',
      details: [
        `${uniqueFlashedPlayers.length} players affected by flash utilities`,
        `${flashedPlayers.length} total flash effect instances`,
        'Indicates coordinated utility usage'
      ],
      recommendation: 'Capitalize on flashed opponents or improve flash coordination.'
    });
  }

  // Data quality insight
  insights.push({
    type: 'strength' as const,
    icon: <TrendingUp className="w-4 h-4 text-blue-500" />,
    title: 'Comprehensive Data Coverage',
    description: 'Rich positional data available for tactical analysis.',
    details: [
      `${roundData.length} total position data points recorded`,
      `${[...new Set(roundData.map(p => p.name))].length} unique players tracked`,
      `${[...new Set(roundData.map(p => p.tick))].length} distinct time intervals captured`,
      'High-resolution data enables detailed tactical insights'
    ],
    recommendation: 'Leverage detailed positional data for advanced tactical modeling.'
  });

  return insights;
}