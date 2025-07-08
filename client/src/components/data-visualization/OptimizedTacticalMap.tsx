import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Target, MapPin, Users } from 'lucide-react';

interface XYZPlayerData {
  health: number;
  flash_duration: number;
  place?: string;
  armor: number;
  side: 't' | 'ct';
  pitch: number;
  X: number;
  yaw: number;
  Y: number;
  velocity_X: number;
  Z: number;
  velocity_Y: number;
  velocity_Z: number;
  tick: number;
  user_steamid: string;
  name: string;
  round_num: number;
}

interface OptimizedTacticalMapProps {
  xyzData: XYZPlayerData[];
}

export function OptimizedTacticalMap({ xyzData }: OptimizedTacticalMapProps) {
  const [selectedRound, setSelectedRound] = useState<string>('4');

  // Get available rounds efficiently
  const availableRounds = useMemo(() => {
    const rounds = new Set<number>();
    for (let i = 0; i < Math.min(xyzData.length, 10000); i++) {
      rounds.add(xyzData[i].round_num);
    }
    return Array.from(rounds).sort((a, b) => a - b);
  }, [xyzData]);

  // Optimized filtering with early termination
  const filteredData = useMemo(() => {
    const roundNum = parseInt(selectedRound);
    const result: XYZPlayerData[] = [];
    
    for (let i = 0; i < xyzData.length && result.length < 1000; i++) {
      if (xyzData[i].round_num === roundNum) {
        result.push(xyzData[i]);
      }
    }
    
    return result;
  }, [xyzData, selectedRound]);

  // Simplified statistics calculation
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalPositions: 0,
        tPlayers: 0,
        ctPlayers: 0,
        avgHealth: 0,
        activePlayers: 0,
        roundPrediction: 'NO DATA'
      };
    }

    let tCount = 0;
    let ctCount = 0;
    let totalHealth = 0;
    let activeCount = 0;
    
    for (const player of filteredData) {
      if (player.side === 't') tCount++;
      else ctCount++;
      
      totalHealth += player.health;
      if (player.health > 0) activeCount++;
    }

    const avgHealth = totalHealth / filteredData.length;
    const tAlive = filteredData.filter(p => p.side === 't' && p.health > 0).length;
    const ctAlive = filteredData.filter(p => p.side === 'ct' && p.health > 0).length;
    
    let roundPrediction = 'BALANCED';
    if (tAlive > ctAlive) roundPrediction = 'T-SIDE ADVANTAGE';
    else if (ctAlive > tAlive) roundPrediction = 'CT-SIDE ADVANTAGE';

    return {
      totalPositions: filteredData.length,
      tPlayers: tCount,
      ctPlayers: ctCount,
      avgHealth: Math.round(avgHealth),
      activePlayers: activeCount,
      roundPrediction
    };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/20 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Optimized Tactical Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Processing {stats.totalPositions.toLocaleString()} position records from {xyzData.length.toLocaleString()} total
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Round:</span>
          <Select value={selectedRound} onValueChange={setSelectedRound}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select round" />
            </SelectTrigger>
            <SelectContent>
              {availableRounds.map(round => (
                <SelectItem key={round} value={round.toString()}>
                  Round {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPositions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Players
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePlayers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Avg Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHealth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Round Prediction</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={stats.roundPrediction === 'T-SIDE ADVANTAGE' ? 'default' : 
                          stats.roundPrediction === 'CT-SIDE ADVANTAGE' ? 'secondary' : 'outline'}>
              {stats.roundPrediction}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Player Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Player Distribution</CardTitle>
          <CardDescription>
            Round {selectedRound} - {stats.tPlayers} T-side vs {stats.ctPlayers} CT-side players
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">{stats.tPlayers}</div>
              <div className="text-sm text-muted-foreground">T-Side Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.ctPlayers}</div>
              <div className="text-sm text-muted-foreground">CT-Side Players</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">Performance Optimized</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">
            This component shows simplified analytics to prevent browser freezing with large datasets. 
            Full tactical analysis will be available once performance optimizations are complete.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}