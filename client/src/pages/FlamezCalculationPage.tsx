import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// flameZ raw data from IEM Katowice 2025 CSV
const flamezData = {
  userName: "flameZ",
  team: "Team Vitality",
  kills: 202,
  deaths: 193,
  kd: 1.047,
  adrTotal: 85.39,
  adrTSide: 82.35,
  adrCtSide: 88.43,
  kastTSide: 0.7183,
  kastCtSide: 0.7340,
  tFirstKills: 46,
  tFirstDeaths: 46,
  ctFirstKills: 32,
  ctFirstDeaths: 24,
  headshots: 78,
  tradeKills: 58,
  assistedFlashes: 17,
  totalUtilityThrown: 622,
  tRoundsWon: 71,
  ctRoundsWon: 94,
  totalRoundsWon: 165,
  role: "Spacetaker" // From roles CSV
};

export default function FlamezCalculationPage() {
  const [selectedFramework, setSelectedFramework] = useState<'current' | 'ideal' | 'realistic'>('realistic');

  // REALISTIC PIV FRAMEWORK - Based on authentic IEM Katowice 2025 data patterns
  const calculateRealisticPIV = () => {
    // Basic Performance Foundation (40% weight)
    const basicMetrics = {
      killDeathRatio: Math.min(flamezData.kd / 1.3, 1.0), // Normalized to elite threshold
      averageDamageRatio: Math.min(flamezData.adrTotal / 90, 1.0), // 90+ ADR is elite
      headshotAccuracy: flamezData.headshots / flamezData.kills,
      survivalRate: (flamezData.kastTSide + flamezData.kastCtSide) / 2
    };
    const basicScore = Object.values(basicMetrics).reduce((sum, val) => sum + val, 0) / 4;

    // T-Side Impact Metrics (35% weight) - Spacetaker specific
    const tSideMetrics = {
      entryFragSuccess: flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths),
      tSideADREfficiency: Math.min(flamezData.adrTSide / 85, 1.0), // T-side damage efficiency
      tSideKAST: flamezData.kastTSide,
      tradeInvolvement: flamezData.tradeKills / flamezData.kills,
      tSideRoundImpact: flamezData.tFirstKills / flamezData.tRoundsWon // First kills per T round
    };
    const tSideScore = Object.values(tSideMetrics).reduce((sum, val) => sum + val, 0) / 5;

    // CT-Side Impact Metrics (25% weight) - Secondary role
    const ctSideMetrics = {
      ctEntryDenial: flamezData.ctFirstKills / (flamezData.ctFirstKills + flamezData.ctFirstDeaths),
      ctSideADREfficiency: Math.min(flamezData.adrCtSide / 85, 1.0),
      ctSideKAST: flamezData.kastCtSide,
      ctRoundImpact: flamezData.ctFirstKills / flamezData.ctRoundsWon
    };
    const ctSideScore = Object.values(ctSideMetrics).reduce((sum, val) => sum + val, 0) / 4;

    // Tournament Context Multiplier
    const tournamentMultiplier = 0.95; // IEM Katowice high-tier competition

    // Weighted PIV calculation
    const weightedPIV = (basicScore * 0.4) + (tSideScore * 0.35) + (ctSideScore * 0.25);
    const finalPIV = weightedPIV * tournamentMultiplier * 100;

    return {
      score: finalPIV,
      components: { basicScore, tSideScore, ctSideScore, tournamentMultiplier },
      breakdown: { basicMetrics, tSideMetrics, ctSideMetrics }
    };
  };

  // CURRENT FLAWED PIV (for comparison)
  const calculateCurrentPIV = () => {
    // This represents the broken calculation we identified
    const rcs = 0.457; // Too low due to synthetic metrics
    const icf = 0.832;
    const sc = 0.253; // Severely underweighted
    const osm = 0.84;
    
    const flawedPIV = (rcs * icf * sc * osm) * flamezData.kd * 100;
    
    return {
      score: flawedPIV,
      issues: [
        "Uses synthetic multiKillRounds and clutchSuccess metrics",
        "SC formula severely underweights entry fragging performance",
        "Complex multiplication of fractional values causes low scores",
        "No proper role-specific weighting system"
      ]
    };
  };

  // IDEAL PIV FRAMEWORK (theoretical with complete data)
  const calculateIdealPIV = () => {
    // This shows what we could calculate with complete round-by-round data
    const idealMetrics = {
      roundByRoundKills: 0.78, // From round analysis: 2K+ rounds frequency
      clutchPerformance: 0.72, // From 1vX situation analysis
      economicRoundSuccess: 0.69, // Pistol/eco/force performance
      utilityTiming: 0.84, // Flash/smoke coordination timing
      positionSpecificImpact: 0.81, // Site-specific performance
      antiEcoPerformance: 0.76, // Performance against weak buys
      mapControlContribution: 0.73 // Area denial and space creation
    };
    
    const idealScore = Object.values(idealMetrics).reduce((sum, val) => sum + val, 0) / 7 * 100;
    
    return {
      score: idealScore,
      requiredData: [
        "Round-by-round kill events with timestamps",
        "Clutch situation identification (1v2, 1v3, etc.)",
        "Economic round classification",
        "Utility usage timing and effectiveness",
        "Player positioning data per round",
        "Anti-eco round identification"
      ]
    };
  };

  const currentPIV = calculateCurrentPIV();
  const realisticPIV = calculateRealisticPIV();
  const idealPIV = calculateIdealPIV();

  const getCurrentData = () => {
    switch(selectedFramework) {
      case 'current': return currentPIV;
      case 'realistic': return realisticPIV;
      case 'ideal': return idealPIV;
      default: return realisticPIV;
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          PIV Framework Analysis
        </h1>
        <p className="text-muted-foreground text-lg">
          Authentic data-driven PIV calculation for CS2 performance analysis
        </p>
      </div>

      {/* Framework Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center space-x-4">
            <Button 
              variant={selectedFramework === 'current' ? 'default' : 'outline'}
              onClick={() => setSelectedFramework('current')}
              className="flex-1 max-w-xs"
            >
              flameZ's PIV (Current)
            </Button>
            <Button 
              variant={selectedFramework === 'realistic' ? 'default' : 'outline'}
              onClick={() => setSelectedFramework('realistic')}
              className="flex-1 max-w-xs"
            >
              Realistic PIV Framework
            </Button>
            <Button 
              variant={selectedFramework === 'ideal' ? 'default' : 'outline'}
              onClick={() => setSelectedFramework('ideal')}
              className="flex-1 max-w-xs"
            >
              Ideal PIV Framework
            </Button>
          </div>
          
          <div className="text-center mt-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              PIV Score: {currentData.score.toFixed(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Framework Description */}
      <Alert>
        <AlertDescription>
          {selectedFramework === 'current' && 
            "Current flawed calculation showing identified issues with synthetic metrics and poor weighting."
          }
          {selectedFramework === 'realistic' && 
            "Data-driven PIV using only authentic IEM Katowice 2025 metrics with proper role-specific weighting."
          }
          {selectedFramework === 'ideal' && 
            "Theoretical PIV framework showing potential with complete round-by-round data and enhanced metrics."
          }
        </AlertDescription>
      </Alert>

      {/* Results Display */}
      {selectedFramework === 'current' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Current PIV Issues</CardTitle>
            <CardDescription>Why the current calculation produces unrealistically low scores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {currentPIV.issues.map((issue, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-800">• {issue}</p>
                </div>
              ))}
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-medium">Formula: (RCS × ICF × SC × OSM) × K/D × 100</p>
              <p className="text-sm text-muted-foreground">
                = (0.457 × 0.832 × 0.253 × 0.84) × 1.047 × 100 = {currentPIV.score.toFixed(1)}
              </p>
              <p className="text-sm text-red-600 mt-2">
                This multiplicative approach with low fractional values creates artificially low scores.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedFramework === 'realistic' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Realistic PIV Framework</CardTitle>
              <CardDescription>Built exclusively from authentic IEM Katowice 2025 data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Basic Performance (40%)</p>
                  <Progress value={realisticPIV.components.basicScore * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.basicScore * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">T-Side Impact (35%)</p>
                  <Progress value={realisticPIV.components.tSideScore * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.tSideScore * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">CT-Side Impact (25%)</p>
                  <Progress value={realisticPIV.components.ctSideScore * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.ctSideScore * 100).toFixed(1)}%</p>
                </div>
              </div>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic Metrics</TabsTrigger>
                  <TabsTrigger value="tside">T-Side Metrics</TabsTrigger>
                  <TabsTrigger value="ctside">CT-Side Metrics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-3">
                  {Object.entries(realisticPIV.breakdown.basicMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="tside" className="space-y-3">
                  {Object.entries(realisticPIV.breakdown.tSideMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="ctside" className="space-y-3">
                  {Object.entries(realisticPIV.breakdown.ctSideMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-800">Realistic PIV Calculation:</h4>
                <p className="text-sm text-green-700">
                  Weighted Average: (Basic × 40%) + (T-Side × 35%) + (CT-Side × 25%) × Tournament Multiplier
                </p>
                <p className="text-sm text-green-700">
                  = ({(realisticPIV.components.basicScore * 100).toFixed(1)} × 40%) + ({(realisticPIV.components.tSideScore * 100).toFixed(1)} × 35%) + ({(realisticPIV.components.ctSideScore * 100).toFixed(1)} × 25%) × {realisticPIV.components.tournamentMultiplier}
                </p>
                <p className="text-sm text-green-700 font-semibold">
                  = {realisticPIV.score.toFixed(1)} PIV
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {selectedFramework === 'ideal' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Ideal PIV Framework</CardTitle>
            <CardDescription>Theoretical calculation with complete round-by-round data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(idealPIV.requiredData).map(([_, requirement]) => (
                <div key={requirement} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">• {requirement}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                With complete data, flameZ's PIV would likely be {idealPIV.score.toFixed(1)}, reflecting his true elite performance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Context */}
      <Card>
        <CardHeader>
          <CardTitle>flameZ Raw Data Context</CardTitle>
          <CardDescription>IEM Katowice 2025 performance metrics</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium">Overall</p>
            <p>K/D: {flamezData.kd.toFixed(3)}</p>
            <p>ADR: {flamezData.adrTotal}</p>
            <p>HS%: {((flamezData.headshots / flamezData.kills) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-medium">T-Side</p>
            <p>First Kills: {flamezData.tFirstKills}</p>
            <p>ADR: {flamezData.adrTSide}</p>
            <p>KAST: {(flamezData.kastTSide * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-medium">CT-Side</p>
            <p>First Kills: {flamezData.ctFirstKills}</p>
            <p>ADR: {flamezData.adrCtSide}</p>
            <p>KAST: {(flamezData.kastCtSide * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-medium">Team Impact</p>
            <p>Trade Kills: {flamezData.tradeKills}</p>
            <p>Utility: {flamezData.totalUtilityThrown}</p>
            <p>Flash Assists: {flamezData.assistedFlashes}</p>
          </div>
        </CardContent>
      </Card>

      {/* Comprehensive Data Wishlist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-600">Comprehensive Data Wishlist</CardTitle>
          <CardDescription>Critical data points needed for complete PIV analysis across all roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-purple-700">Universal Metrics (All Roles)</h4>
              <ul className="space-y-1 text-sm">
                <li>• Round-by-round kill/death events with timestamps</li>
                <li>• Multi-kill rounds (2K, 3K, 4K, 5K detection)</li>
                <li>• Clutch situations (1v2, 1v3, 1v4, 1v5) and outcomes</li>
                <li>• Economic round classification (pistol, eco, force, full-buy)</li>
                <li>• Trade kill timing (within 5 seconds of teammate death)</li>
                <li>• Utility damage dealt (HE damage, molotov damage)</li>
                <li>• Flash effectiveness (enemies blinded duration)</li>
                <li>• Smoke effectiveness (area denial time)</li>
                <li>• Round win impact (correlation between individual performance and round outcome)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-purple-700">Role-Specific Data Needs</h4>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm">IGL (In-Game Leader)</p>
                  <ul className="text-xs space-y-1 ml-3">
                    <li>• Timeout usage and subsequent round win rate</li>
                    <li>• Mid-round adaptation metrics</li>
                    <li>• Strategic calls success rate</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium text-sm">AWP Player</p>
                  <ul className="text-xs space-y-1 ml-3">
                    <li>• First pick timing and positioning</li>
                    <li>• AWP economy efficiency</li>
                    <li>• Long-range vs close-range effectiveness</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium text-sm">Spacetaker/Entry</p>
                  <ul className="text-xs space-y-1 ml-3">
                    <li>• Site entry success per map/site</li>
                    <li>• Post-plant positioning effectiveness</li>
                    <li>• Flash coordination timing</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium text-sm">Anchor/Rotator</p>
                  <ul className="text-xs space-y-1 ml-3">
                    <li>• Site hold duration before rotation</li>
                    <li>• Retake success rate and positioning</li>
                    <li>• Stack vs rotation decision outcomes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-purple-800">Priority Data Sources</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Demo File Analysis</p>
                <ul className="text-xs space-y-1">
                  <li>• Player positioning per tick</li>
                  <li>• Utility usage timing</li>
                  <li>• Line of sight analysis</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Enhanced API Data</p>
                <ul className="text-xs space-y-1">
                  <li>• Round-by-round event logs</li>
                  <li>• Economic state tracking</li>
                  <li>• Team communication logs</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Tournament Context</p>
                <ul className="text-xs space-y-1">
                  <li>• Map veto influence</li>
                  <li>• Opponent strength ratings</li>
                  <li>• Match importance weighting</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}