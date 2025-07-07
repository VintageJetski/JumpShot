import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MapPin, TrendingUp } from 'lucide-react';

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

interface SimpleTacticalMapProps {
  xyzData: XYZPlayerData[];
}

export function SimpleTacticalMap({ xyzData }: SimpleTacticalMapProps) {
  const [selectedRound, setSelectedRound] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Get available rounds
  const availableRounds = useMemo(() => {
    const rounds = Array.from(new Set(xyzData.map(d => d.round_num))).sort((a, b) => a - b);
    return rounds;
  }, [xyzData]);

  // Filter data by selected round
  const filteredData = useMemo(() => {
    if (selectedRound === 'all') return xyzData;
    return xyzData.filter(d => d.round_num === parseInt(selectedRound));
  }, [xyzData, selectedRound]);

  // Basic statistics
  const stats = useMemo(() => {
    const tPlayers = filteredData.filter(d => d.side === 't');
    const ctPlayers = filteredData.filter(d => d.side === 'ct');
    const avgHealth = filteredData.reduce((sum, d) => sum + d.health, 0) / filteredData.length;
    const activePlayers = filteredData.filter(d => d.health > 0);
    
    return {
      totalPositions: filteredData.length,
      tPlayerCount: tPlayers.length,
      ctPlayerCount: ctPlayers.length,
      avgHealth: Math.round(avgHealth),
      alivePlayers: activePlayers.length,
      deadPlayers: filteredData.length - activePlayers.length
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
            <h3 className="font-semibold text-lg">Phase 2: Tactical Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Processing {stats.totalPositions.toLocaleString()} position records
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rounds</SelectItem>
              {availableRounds.map(round => (
                <SelectItem key={round} value={round.toString()}>
                  Round {round}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insights">Phase 2 AI</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-red-600 text-white p-2 rounded-lg">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.tPlayerCount}</div>
                  <div className="text-sm text-muted-foreground">T-Side Positions</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 text-white p-2 rounded-lg">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.ctPlayerCount}</div>
                  <div className="text-sm text-muted-foreground">CT-Side Positions</div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.avgHealth}%</div>
                  <div className="text-sm text-muted-foreground">Average Health</div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="mt-6 p-6">
            <h4 className="font-semibold mb-4">Position Analysis</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Total Positions Tracked</span>
                <Badge variant="outline">{stats.totalPositions.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Players Alive</span>
                <Badge variant="default">{stats.alivePlayers}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Players Eliminated</span>
                <Badge variant="secondary">{stats.deadPlayers}</Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-4">
          <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/20 rounded-lg p-6">
            <h4 className="font-semibold text-lg mb-4">Phase 2 AI Analysis</h4>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-orange-500 font-semibold">Utility Intelligence</div>
                  <div className="text-xs text-muted-foreground">Analyzing deployment patterns</div>
                </div>
                <div className="text-center">
                  <div className="text-green-500 font-semibold">Information Warfare</div>
                  <div className="text-xs text-muted-foreground">Tracking lurker movements</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-500 font-semibold">Coordination</div>
                  <div className="text-xs text-muted-foreground">Team formation analysis</div>
                </div>
              </div>
              
              <div className="bg-black/20 rounded-lg p-4 text-center">
                <div className="text-lg font-semibold text-green-400">✓ Phase 2 Active</div>
                <div className="text-sm text-muted-foreground mt-1">
                  Advanced tactical analysis engine processing {stats.totalPositions.toLocaleString()} positions
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}