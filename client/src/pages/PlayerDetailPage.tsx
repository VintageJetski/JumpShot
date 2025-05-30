import React from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { PlayerWithPIV } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Trophy, Target, TrendingUp, Award, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PlayerDetailPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: player, isLoading, error } = useQuery<PlayerWithPIV>({
    queryKey: ['/api/players', id],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-400">Player not found</div>
        <Button onClick={() => setLocation('/players')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Players
        </Button>
      </div>
    );
  }

  // Create metric display data from the real tournament stats
  const displayMetrics = {
    'K/D Ratio': player.metrics?.kd || 0,
    'Average Damage': player.metrics?.adr || 0,
    'KAST %': player.metrics?.kast || 0,
    'First Kills': player.metrics?.firstKills || 0,
    'Headshots': player.metrics?.headshots || 0,
    'Utility Damage': player.metrics?.utilityDamage || 0
  };

  // Calculate basic performance indicators from tournament data
  const performanceScore = Math.round(player.piv * 100) / 100;
  const efficiencyRating = Math.round(((player.metrics?.kd || 0) * 50 + (player.metrics?.adr || 0) / 2) / 2);
  const impactRating = Math.round((player.metrics?.firstKills || 0) * 5 + (player.metrics?.utilityDamage || 0) / 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={() => setLocation('/players')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Players
        </Button>
      </div>

      {/* Player Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg p-6 border border-blue-500/20"
      >
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{player.name}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <Badge variant="secondary" className="bg-blue-600/20 text-blue-300">
                {player.team}
              </Badge>
              <Badge variant="outline" className="border-purple-500/30 text-purple-300">
                {player.role}
              </Badge>
              <Badge variant="outline" className="border-green-500/30 text-green-300">
                {player.event}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-400">{performanceScore}</div>
            <div className="text-sm text-gray-400">PIV Score</div>
          </div>
        </div>
      </motion.div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{performanceScore}</div>
              <div className="text-sm text-gray-400">Player Impact Value</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-400" />
                Efficiency Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{efficiencyRating}</div>
              <div className="text-sm text-gray-400">K/D + ADR Combined</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center">
                <Award className="w-5 h-5 mr-2 text-purple-400" />
                Impact Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{impactRating}</div>
              <div className="text-sm text-gray-400">First Kills + Utility</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-400" />
              Tournament Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(displayMetrics).map(([metric, value]) => (
                <div key={metric} className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {typeof value === 'number' ? (value % 1 === 0 ? value : value.toFixed(2)) : value}
                  </div>
                  <div className="text-sm text-gray-400">{metric}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Role Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
              Role & Team Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Current Role</h3>
                <Badge variant="outline" className="border-purple-500/30 text-purple-300 text-lg px-4 py-2">
                  {player.role}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Team & Event</h3>
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 text-lg px-4 py-2 block w-fit">
                    {player.team}
                  </Badge>
                  <Badge variant="outline" className="border-green-500/30 text-green-300 text-lg px-4 py-2 block w-fit">
                    {player.event}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function getMetricDescription(metric: string, player: PlayerWithPIV): string {
  const descriptions: Record<string, string> = {
    'K/D Ratio': `Kill/Death ratio of ${player.metrics?.kd || 0} shows ${player.name}'s fragging efficiency`,
    'Average Damage': `${player.metrics?.adr || 0} average damage per round demonstrates consistent impact`,
    'KAST %': `${player.metrics?.kast || 0}% KAST shows involvement in successful rounds`,
    'First Kills': `${player.metrics?.firstKills || 0} first kills indicate opening round impact`,
    'Headshots': `${player.metrics?.headshots || 0} headshots show precision and aim consistency`,
    'Utility Damage': `${player.metrics?.utilityDamage || 0} utility damage reflects strategic grenade usage`
  };
  return descriptions[metric] || `${metric}: ${player.metrics?.[metric as keyof typeof player.metrics] || 'N/A'}`;
}