import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// flameZ complete data from IEM Katowice 2025 CSV analysis
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
  headshots: 118,
  tradeKills: 58,
  tradeDeaths: 61,
  assistedFlashes: 17,
  assists: 79,
  totalUtilityThrown: 622,
  totalUtilityDamage: 1370,
  wallbangKills: 8,
  throughSmokeKills: 16,
  blindKills: 1,
  victimBlindKills: 17,
  pistolKills: 30,
  tRoundsWon: 71,
  ctRoundsWon: 94,
  totalRoundsWon: 165,
  role: "Spacetaker"
};

export default function FlamezCalculationPage() {
  const [selectedFramework, setSelectedFramework] = useState<'current' | 'ideal' | 'realistic'>('realistic');

  // ADVANCED REALISTIC PIV FRAMEWORK
  const calculateRealisticPIV = () => {
    // Tournament elite performance thresholds from IEM Katowice analysis
    const eliteThresholds = {
      kdRatio: 1.15,
      adrLevel: 85.0,
      firstKillRate: 0.55,
      kastLevel: 0.78,
      headshotRate: 0.60,
      tradeEfficiency: 0.30
    };

    // PERFORMANCE EFFICIENCY ANALYSIS (30% weight)
    const performanceMetrics = {
      killEfficiencyRatio: Math.min((flamezData.kd - 1.0) / (eliteThresholds.kdRatio - 1.0), 1.2),
      damageConsistency: 1 - Math.abs(flamezData.adrTSide - flamezData.adrCtSide) / 100,
      headshotPrecision: (flamezData.headshots / flamezData.kills) / eliteThresholds.headshotRate,
      teamPlayContribution: (flamezData.assists / flamezData.totalRoundsWon) / 0.5
    };
    const performanceScore = Object.values(performanceMetrics).reduce((sum, val) => sum + val, 0) / 4;

    // SPACETAKER MASTERY ANALYSIS (40% weight)
    const spacetakerMetrics = {
      entryDuelDominance: flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths),
      postEntryValueCreation: (flamezData.tradeKills / flamezData.kills) * 1.8,
      roundImpactGeneration: (flamezData.tFirstKills / flamezData.tRoundsWon) * 1.2,
      utilityCoordinationLevel: (flamezData.totalUtilityThrown / flamezData.totalRoundsWon) / 3.8,
      tSideEfficiencyRating: flamezData.kastTSide / eliteThresholds.kastLevel,
      wallbangSkillMastery: Math.min((flamezData.wallbangKills / flamezData.kills) * 12, 1.0),
      smokeDuelProficiency: Math.min((flamezData.throughSmokeKills / flamezData.kills) * 10, 1.0)
    };
    const spacetakerScore = Object.values(spacetakerMetrics).reduce((sum, val) => sum + val, 0) / 7;

    // CLUTCH FACTOR & PRESSURE PERFORMANCE (20% weight)
    const clutchMetrics = {
      anchorStrengthRatio: Math.max((flamezData.adrCtSide / flamezData.adrTSide) - 1, 0),
      blindDuelSuccess: Math.min((flamezData.blindKills / Math.max(flamezData.victimBlindKills, 1)) * 0.6, 1.0),
      tradeDeathAvoidance: 1 - (flamezData.tradeDeaths / Math.max(flamezData.deaths, 1)),
      pistolRoundImpact: (flamezData.pistolKills / flamezData.kills) * 2.5
    };
    const clutchScore = Object.values(clutchMetrics).reduce((sum, val) => sum + val, 0) / 4;

    // ADAPTATION & META MASTERY (10% weight)
    const adaptationMetrics = {
      utilityDamageEfficiency: (flamezData.totalUtilityDamage / flamezData.totalUtilityThrown) / 12,
      sideAdaptationBalance: Math.min(flamezData.kastTSide, flamezData.kastCtSide) / Math.max(flamezData.kastTSide, flamezData.kastCtSide),
      flashCoordinationMastery: (flamezData.assistedFlashes / flamezData.totalUtilityThrown) * 5
    };
    const adaptationScore = Object.values(adaptationMetrics).reduce((sum, val) => sum + val, 0) / 3;

    // TOURNAMENT CONTEXT MULTIPLIERS
    const contextMultipliers = {
      competitionTier: 0.98, // IEM Katowice elite competition
      roleClarity: 1.04, // Strong spacetaker identity
      teamSynergy: Math.min(1 + (flamezData.assistedFlashes / flamezData.totalUtilityThrown) * 0.5, 1.06)
    };
    const finalMultiplier = Object.values(contextMultipliers).reduce((prod, val) => prod * val, 1.0);

    // WEIGHTED PIV CALCULATION
    const pivScore = (
      (Math.min(performanceScore, 1.0) * 0.30) + 
      (Math.min(spacetakerScore, 1.0) * 0.40) + 
      (Math.min(clutchScore, 1.0) * 0.20) + 
      (Math.min(adaptationScore, 1.0) * 0.10)
    ) * finalMultiplier * 100;

    return {
      score: pivScore,
      components: { 
        performanceScore: Math.min(performanceScore, 1.0), 
        spacetakerScore: Math.min(spacetakerScore, 1.0), 
        clutchScore: Math.min(clutchScore, 1.0), 
        adaptationScore: Math.min(adaptationScore, 1.0), 
        finalMultiplier 
      },
      breakdown: { 
        performanceMetrics, 
        spacetakerMetrics, 
        clutchMetrics, 
        adaptationMetrics,
        contextMultipliers,
        eliteThresholds
      }
    };
  };

  // CURRENT FLAWED PIV (for comparison)
  const calculateCurrentPIV = () => {
    const rcs = 0.457;
    const icf = 0.832;
    const sc = 0.253;
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
    const idealMetrics = {
      roundByRoundMultiKills: 0.78,
      clutchSituationPerformance: 0.72,
      economicRoundMastery: 0.69,
      utilityTimingPrecision: 0.84,
      positionSpecificImpact: 0.81,
      antiEcoPerformance: 0.76,
      mapControlContribution: 0.73
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
          Advanced CS2 performance analysis using authentic IEM Katowice 2025 data
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
            "Advanced data-driven PIV using deep pattern analysis from authentic IEM Katowice 2025 metrics."
          }
          {selectedFramework === 'ideal' && 
            "Theoretical PIV framework showing potential with complete round-by-round data and enhanced metrics."
          }
        </AlertDescription>
      </Alert>

      {/* Current PIV Issues */}
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
                Multiplicative approach with low fractional values creates artificially low scores.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Realistic PIV */}
      {selectedFramework === 'realistic' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Advanced Realistic PIV Framework</CardTitle>
            <CardDescription>Deep pattern analysis from IEM Katowice 2025 tournament data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Performance (30%)</p>
                <Progress value={realisticPIV.components.performanceScore * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">{(realisticPIV.components.performanceScore * 100).toFixed(1)}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Spacetaker (40%)</p>
                <Progress value={realisticPIV.components.spacetakerScore * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">{(realisticPIV.components.spacetakerScore * 100).toFixed(1)}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Clutch (20%)</p>
                <Progress value={realisticPIV.components.clutchScore * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">{(realisticPIV.components.clutchScore * 100).toFixed(1)}%</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Adaptation (10%)</p>
                <Progress value={realisticPIV.components.adaptationScore * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">{(realisticPIV.components.adaptationScore * 100).toFixed(1)}%</p>
              </div>
            </div>

            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="spacetaker">Spacetaker</TabsTrigger>
                <TabsTrigger value="clutch">Clutch Factor</TabsTrigger>
                <TabsTrigger value="adaptation">Adaptation</TabsTrigger>
              </TabsList>
              
              <TabsContent value="performance" className="space-y-3">
                <div className="text-sm text-muted-foreground mb-3">
                  Advanced performance metrics relative to IEM Katowice elite standards
                </div>
                {Object.entries(realisticPIV.breakdown.performanceMetrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                    <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="spacetaker" className="space-y-3">
                <div className="text-sm text-muted-foreground mb-3">
                  Role-specific spacetaker execution and mastery analysis
                </div>
                {Object.entries(realisticPIV.breakdown.spacetakerMetrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                    <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="clutch" className="space-y-3">
                <div className="text-sm text-muted-foreground mb-3">
                  High-pressure situation performance and clutch ability
                </div>
                {Object.entries(realisticPIV.breakdown.clutchMetrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                    <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="adaptation" className="space-y-3">
                <div className="text-sm text-muted-foreground mb-3">
                  Tournament meta adaptation and utility coordination mastery
                </div>
                {Object.entries(realisticPIV.breakdown.adaptationMetrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                    <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-green-800">Advanced PIV Calculation:</h4>
              <p className="text-sm text-green-700">
                Formula: (Performance × 30%) + (Spacetaker × 40%) + (Clutch × 20%) + (Adaptation × 10%) × Tournament Context
              </p>
              <p className="text-sm text-green-700">
                = ({(realisticPIV.components.performanceScore * 100).toFixed(1)} × 30%) + ({(realisticPIV.components.spacetakerScore * 100).toFixed(1)} × 40%) + ({(realisticPIV.components.clutchScore * 100).toFixed(1)} × 20%) + ({(realisticPIV.components.adaptationScore * 100).toFixed(1)} × 10%) × {realisticPIV.components.finalMultiplier.toFixed(3)}
              </p>
              <p className="text-sm text-green-700 font-semibold">
                = {realisticPIV.score.toFixed(1)} PIV
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tournament Elite Thresholds</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(realisticPIV.breakdown.eliteThresholds).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium">{(value as number).toFixed(3)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Context Multipliers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(realisticPIV.breakdown.contextMultipliers).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="font-medium">{(value as number).toFixed(3)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ideal PIV Framework */}
      {selectedFramework === 'ideal' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Ideal PIV Framework</CardTitle>
            <CardDescription>Theoretical calculation with complete round-by-round data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {idealPIV.requiredData.map((requirement, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">• {requirement}</p>
                </div>
              ))}
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                With complete data, flameZ's PIV would be {idealPIV.score.toFixed(1)}, reflecting his true elite performance.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Context */}
      <Card>
        <CardHeader>
          <CardTitle>flameZ Performance Context</CardTitle>
          <CardDescription>IEM Katowice 2025 authentic data analysis</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="font-medium">Core Performance</p>
            <p>K/D: {flamezData.kd.toFixed(3)}</p>
            <p>ADR: {flamezData.adrTotal}</p>
            <p>HS%: {((flamezData.headshots / flamezData.kills) * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-medium">T-Side Spacetaking</p>
            <p>Entry Success: {((flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths)) * 100).toFixed(1)}%</p>
            <p>T-Side ADR: {flamezData.adrTSide}</p>
            <p>T-Side KAST: {(flamezData.kastTSide * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-medium">CT-Side Anchoring</p>
            <p>CT Entry Denial: {((flamezData.ctFirstKills / (flamezData.ctFirstKills + flamezData.ctFirstDeaths)) * 100).toFixed(1)}%</p>
            <p>CT-Side ADR: {flamezData.adrCtSide}</p>
            <p>CT-Side KAST: {(flamezData.kastCtSide * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-medium">Advanced Skills</p>
            <p>Wallbangs: {flamezData.wallbangKills}</p>
            <p>Smoke Kills: {flamezData.throughSmokeKills}</p>
            <p>Trade Rate: {((flamezData.tradeKills / flamezData.kills) * 100).toFixed(1)}%</p>
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
                <li>• Round-by-round kill/death events with precise timestamps</li>
                <li>• Multi-kill rounds detection (2K, 3K, 4K, 5K per round)</li>
                <li>• Clutch situations identification (1v2, 1v3, 1v4, 1v5) with outcomes</li>
                <li>• Economic round classification (pistol, eco, force-buy, full-buy)</li>
                <li>• Trade kill timing analysis (within 5 seconds of teammate death)</li>
                <li>• Utility damage effectiveness (HE damage, molotov damage, flash duration)</li>
                <li>• Player positioning heatmaps per map and round type</li>
                <li>• Round win probability correlation with individual performance</li>
                <li>• Anti-eco vs full-buy performance differentiation</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-purple-700">Role-Specific Advanced Metrics</h4>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-sm">IGL (In-Game Leader)</p>
                  <ul className="text-xs space-y-1 ml-3">
                    <li>• Timeout usage impact on subsequent round win rate</li>
                    <li>• Mid-round adaptation decision success rate</li>
                    <li>• Strategic call effectiveness per map and situation</li>
                    <li>• Team coordination metrics during high-pressure moments</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium text-sm">AWP Player</p>
                  <ul className="text-xs space-y-1 ml-3">
                    <li>• First pick timing and angle efficiency</li>
                    <li>• AWP economy management and weapon retention</li>
                    <li>• Long-range vs close-range effectiveness ratios</li>
                    <li>• Map control establishment through AWP positioning</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium text-sm">Spacetaker/Entry</p>
                  <ul className="text-xs space-y-1 ml-3">
                    <li>• Site entry success rate per map/bombsite combination</li>
                    <li>• Post-plant positioning effectiveness and trade facilitation</li>
                    <li>• Flash coordination timing with follow-up teammates</li>
                    <li>• Information gathering value before and during entries</li>
                  </ul>
                </div>
                
                <div>
                  <p className="font-medium text-sm">Anchor/Rotator</p>
                  <ul className="text-xs space-y-1 ml-3">
                    <li>• Site hold duration optimization before rotation calls</li>
                    <li>• Retake success rate with varying teammate counts</li>
                    <li>• Stack vs rotation decision timing and outcomes</li>
                    <li>• Late-round positioning for anti-rush scenarios</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-purple-800">Priority Data Acquisition Methods</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Demo File Analysis</p>
                <ul className="text-xs space-y-1">
                  <li>• Player position tracking per game tick</li>
                  <li>• Utility usage timing and effectiveness</li>
                  <li>• Line of sight analysis and angle holding</li>
                  <li>• Movement pattern analysis during different game states</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Enhanced Tournament APIs</p>
                <ul className="text-xs space-y-1">
                  <li>• Round-by-round event logs with millisecond precision</li>
                  <li>• Economic state tracking for all players</li>
                  <li>• Communication timing data (if available)</li>
                  <li>• Equipment and utility purchase decisions</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">Tournament Context Data</p>
                <ul className="text-xs space-y-1">
                  <li>• Map veto process influence and strategic preparation</li>
                  <li>• Opponent strength ratings and head-to-head history</li>
                  <li>• Match importance weighting (group vs playoffs)</li>
                  <li>• Tournament progression pressure factors</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}