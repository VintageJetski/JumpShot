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

  // ADVANCED REALISTIC PIV FRAMEWORK - Authentic Data Only with RCS/ICF/SC/OSM
  const calculateRealisticPIV = () => {
    // ======================
    // T-SIDE SPACETAKER RCS - Role Core Score with Proper Weightings
    // ======================
    const tSideRCS = {
      // CSV: t_first_kills / (t_first_kills + t_first_deaths) - 40% weight
      // Primary spacetaker responsibility
      entryFragSuccess: flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths),
      
      // CSV: trade_kills / kills - 30% weight
      // Spacetakers create trade opportunities for team
      tradeKillGeneration: flamezData.tradeKills / flamezData.kills,
      
      // CSV: t_first_kills / t_rounds_won - 20% weight
      // Round impact frequency as entry fragger
      roundImpactFrequency: flamezData.tFirstKills / flamezData.tRoundsWon,
      
      // CSV: assisted_flashes / total_util_thrown - 10% weight  
      // Limited utility coordination role for spacetakers
      utilityCoordination: flamezData.assistedFlashes / flamezData.totalUtilityThrown
    };
    
    // Apply proper weightings for spacetaker role
    const tRCS = (
      tSideRCS.entryFragSuccess * 0.40 +
      tSideRCS.tradeKillGeneration * 0.30 +
      tSideRCS.roundImpactFrequency * 0.20 +
      tSideRCS.utilityCoordination * 0.10
    );

    // ======================
    // CT-SIDE ROTATOR RCS - Role Core Score with Proper Weightings
    // ======================
    const ctSideRCS = {
      // CSV: ct_first_kills / (ct_first_kills + ct_first_deaths) - 35% weight
      // Primary rotator responsibility - stopping entries
      ctEntryDenial: flamezData.ctFirstKills / (flamezData.ctFirstKills + flamezData.ctFirstDeaths),
      
      // CSV: ct_first_kills / ct_rounds_won - 25% weight
      // Impact frequency as rotator
      rotationImpactRate: flamezData.ctFirstKills / flamezData.ctRoundsWon,
      
      // CSV: kast_ct_side - 25% weight
      // Survival and contribution on defense
      ctSideSurvivalImpact: flamezData.kastCtSide,
      
      // CSV: (total_util_thrown - assisted_flashes) / total_rounds_won / 3 - 15% weight
      // Defensive utility usage (smokes, HE, molotovs)
      defensiveUtilityUsage: Math.min((flamezData.totalUtilityThrown - flamezData.assistedFlashes) / flamezData.totalRoundsWon / 3, 1.0)
    };
    
    // Apply proper weightings for rotator role
    const ctRCS = (
      ctSideRCS.ctEntryDenial * 0.35 +
      ctSideRCS.rotationImpactRate * 0.25 +
      ctSideRCS.ctSideSurvivalImpact * 0.25 +
      ctSideRCS.defensiveUtilityUsage * 0.15
    );

    // ======================
    // BASELINE METRICS (20% of total PIV)
    // ======================
    const baselineMetrics = {
      // CSV: kd ratio normalized to elite standard
      kdRatio: Math.min(flamezData.kd / 1.3, 1.0),
      
      // CSV: adr_total normalized 
      adrEfficiency: Math.min(flamezData.adrTotal / 90, 1.0),
      
      // CSV: Average of T and CT KAST
      kastConsistency: (flamezData.kastTSide + flamezData.kastCtSide) / 2
    };
    const baselineScore = Object.values(baselineMetrics).reduce((sum, val) => sum + val, 0) / 3;

    // ======================
    // ICF - Individual Consistency Factor  
    // ======================
    const icfMetrics = {
      // CSV: kd / 1.4 (elite threshold), capped at 1.2
      basePerformanceRatio: Math.min(flamezData.kd / 1.4, 1.2),
      
      // CSV: 1 / (1 + |kd - 1.0| * 0.8)
      consistencyFactor: 1 / (1 + Math.abs(flamezData.kd - 1.0) * 0.8),
      
      // CSV: headshots / kills
      precisionConsistency: flamezData.headshots / flamezData.kills
    };
    const icf = Object.values(icfMetrics).reduce((sum, val) => sum + val, 0) / 3;

    // ======================
    // SC - Synergy Contribution
    // ======================
    const scMetrics = {
      // CSV: assists / total_rounds_won - 40% weight
      teamPlayContribution: flamezData.assists / flamezData.totalRoundsWon,
      
      // CSV: trade_deaths / deaths (inverted - lower is better) - 35% weight
      tradabilityValue: 1 - (flamezData.tradeDeaths / flamezData.deaths),
      
      // CSV: total_util_dmg / total_util_thrown - 25% weight
      utilityEfficiencyRatio: Math.min(flamezData.totalUtilityDamage / flamezData.totalUtilityThrown / 10, 1.0)
    };
    
    // Apply proper weightings for synergy
    const sc = (
      scMetrics.teamPlayContribution * 0.40 +
      scMetrics.tradabilityValue * 0.35 +
      scMetrics.utilityEfficiencyRatio * 0.25
    );

    // ======================
    // OSM - Opponent Strength Multiplier
    // ======================
    // Static for IEM Katowice - elite tournament context
    const osm = 0.96;

    // ======================
    // PIV CALCULATION WITH BASELINE METRICS
    // ======================
    // Role-specific calculations (40% each for T/CT)
    const tSidePIV = (tRCS * icf * sc * osm);
    const ctSidePIV = (ctRCS * icf * sc * osm);
    
    // Combined role performance (80% total)
    const rolePerformance = (tSidePIV + ctSidePIV) / 2;
    
    // Final PIV: Role Performance (80%) + Baseline Metrics (20%)
    const overallPIV = (rolePerformance * 0.80 + baselineScore * 0.20) * 100;

    return {
      score: overallPIV,
      components: { 
        tRCS, 
        ctRCS, 
        icf, 
        sc, 
        osm,
        tSidePIV,
        ctSidePIV,
        baselineScore,
        rolePerformance
      },
      breakdown: { 
        tSideRCS, 
        ctSideRCS, 
        icfMetrics, 
        scMetrics,
        baselineMetrics,
        weightings: {
          rolePerformance: "80%",
          baselineMetrics: "20%",
          tSideSpacetaker: "Entry Success: 40%, Trade Generation: 30%, Round Impact: 20%, Utility: 10%",
          ctSideRotator: "Entry Denial: 35%, Rotation Impact: 25%, Survival: 25%, Utility: 15%",
          synergyContribution: "Team Play: 40%, Tradability: 35%, Utility Efficiency: 25%"
        },
        csvSources: {
          entryFragSuccess: "t_first_kills / (t_first_kills + t_first_deaths)",
          tradeKillGeneration: "trade_kills / kills",
          tradabilityValue: "1 - (trade_deaths / deaths)",
          utilityEfficiency: "total_util_dmg / total_util_thrown",
          ctEntryDenial: "ct_first_kills / (ct_first_kills + ct_first_deaths)",
          baselineKD: "kd / 1.3",
          baselineADR: "adr_total / 90",
          baselineKAST: "(kast_t_side + kast_ct_side) / 2"
        }
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

  // IDEAL PIV FRAMEWORK (Your Original System)
  const calculateIdealPIV = () => {
    // Original PIV calculation from your established framework
    const rcs = 0.457;
    const icf = 0.832;
    const sc = 0.253;
    const osm = 0.84;
    
    // Your original PIV formula
    const originalPIV = (rcs * icf * sc * osm) * flamezData.kd * 100;
    
    return {
      score: originalPIV,
      components: { rcs, icf, sc, osm, kd: flamezData.kd },
      breakdown: {
        rcsDetails: "Role Core Score based on spacetaker performance metrics",
        icfDetails: "Individual Consistency Factor including K/D stability",
        scDetails: "Synergy Contribution measuring team impact",
        osmDetails: "Opponent Strength Multiplier for tournament context"
      },
      formula: "PIV = (RCS × ICF × SC × OSM) × K/D × 100",
      description: "Original PIV framework showing baseline calculation method"
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
            "Enhanced PIV framework with original role weightings and TIR models from our established system."
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
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Realistic PIV Framework - RCS/ICF/SC/OSM</CardTitle>
              <CardDescription>Role-specific weightings with authentic CSV data only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-6 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Baseline (20%)</p>
                  <Progress value={realisticPIV.components.baselineScore * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.baselineScore * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">T-Side RCS</p>
                  <Progress value={realisticPIV.components.tRCS * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.tRCS * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">CT-Side RCS</p>
                  <Progress value={realisticPIV.components.ctRCS * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.ctRCS * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">ICF</p>
                  <Progress value={realisticPIV.components.icf * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.icf * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">SC</p>
                  <Progress value={realisticPIV.components.sc * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.sc * 100).toFixed(1)}%</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">OSM</p>
                  <Progress value={realisticPIV.components.osm * 100} className="h-2" />
                  <p className="text-sm text-muted-foreground">{(realisticPIV.components.osm * 100).toFixed(1)}%</p>
                </div>
              </div>

              <Tabs defaultValue="tside" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="tside">T-Side Spacetaker</TabsTrigger>
                  <TabsTrigger value="ctside">CT-Side Rotator</TabsTrigger>
                  <TabsTrigger value="icf">ICF Consistency</TabsTrigger>
                  <TabsTrigger value="sc">SC Synergy</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tside" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    T-Side Spacetaker Role Core Score - Basketball "Points Per Game" Style
                  </div>
                  {Object.entries(realisticPIV.breakdown.tSideRCS).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs text-slate-500">
                          {key === 'entryFragSuccess' && 't_first_kills / (t_first_kills + t_first_deaths)'}
                          {key === 'tradeKillGeneration' && 'trade_kills / kills'}
                          {key === 'roundImpactFrequency' && 't_first_kills / t_rounds_won'}
                          {key === 'utilityCoordination' && 'assisted_flashes / total_util_thrown'}
                          {key === 'tSideDamageEfficiency' && 'adr_t_side / 100'}
                          {key === 'wallbangProficiency' && 'wallbang_kills / kills'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="ctside" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    CT-Side Rotator Role Core Score - Basketball "Defensive Stop %" Style
                  </div>
                  {Object.entries(realisticPIV.breakdown.ctSideRCS).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs text-slate-500">
                          {key === 'ctEntryDenial' && 'ct_first_kills / (ct_first_kills + ct_first_deaths)'}
                          {key === 'rotationImpactRate' && 'ct_first_kills / ct_rounds_won'}
                          {key === 'ctSideDamageEfficiency' && 'adr_ct_side / 100'}
                          {key === 'ctSideSurvivalImpact' && 'kast_ct_side'}
                          {key === 'smokeDuelSuccess' && 'through_smoke_kills / kills'}
                          {key === 'defensiveUtilityUsage' && '(total_util_thrown - assisted_flashes) / total_rounds_won / 3'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="icf" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    Individual Consistency Factor - Basketball "True Shooting %" Style
                  </div>
                  {Object.entries(realisticPIV.breakdown.icfMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs text-slate-500">
                          {key === 'basePerformanceRatio' && 'kd / 1.4 (elite threshold)'}
                          {key === 'consistencyFactor' && '1 / (1 + |kd - 1.0| * 0.8)'}
                          {key === 'precisionConsistency' && 'headshots / kills'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="sc" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    Synergy Contribution - Basketball "PER" Style Team Impact
                  </div>
                  {Object.entries(realisticPIV.breakdown.scMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs text-slate-500">
                          {key === 'teamPlayContribution' && 'assists / total_rounds_won'}
                          {key === 'tradabilityValue' && '1 - (trade_deaths / deaths)'}
                          {key === 'utilityEfficiencyRatio' && 'total_util_dmg / total_util_thrown / 15'}
                          {key === 'adversityPerformance' && 'blind_kills / victim_blind_kills'}
                          {key === 'economicImpactRate' && 'pistol_kills / kills'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-green-800">PIV Calculation Formula:</h4>
                <p className="text-sm text-green-700">
                  T-Side PIV = (T-RCS × ICF × SC × OSM) = {realisticPIV.components.tRCS.toFixed(3)} × {realisticPIV.components.icf.toFixed(3)} × {realisticPIV.components.sc.toFixed(3)} × {realisticPIV.components.osm.toFixed(3)} = {realisticPIV.components.tSidePIV.toFixed(3)}
                </p>
                <p className="text-sm text-green-700">
                  CT-Side PIV = (CT-RCS × ICF × SC × OSM) = {realisticPIV.components.ctRCS.toFixed(3)} × {realisticPIV.components.icf.toFixed(3)} × {realisticPIV.components.sc.toFixed(3)} × {realisticPIV.components.osm.toFixed(3)} = {realisticPIV.components.ctSidePIV.toFixed(3)}
                </p>
                <p className="text-sm text-green-700 font-semibold">
                  Overall PIV = (T-Side + CT-Side) / 2 × 100 = {realisticPIV.score.toFixed(1)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Basketball Analytics Applied</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Field Goal % (Entry Success)</span>
                      <span>{((flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defensive Stop % (CT Entry Denial)</span>
                      <span>{((flamezData.ctFirstKills / (flamezData.ctFirstKills + flamezData.ctFirstDeaths)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assists Per Game (Team Play)</span>
                      <span>{(flamezData.assists / flamezData.totalRoundsWon).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usage Efficiency (Trade Death Avoidance)</span>
                      <span>{((1 - flamezData.tradeDeaths / flamezData.deaths) * 100).toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">CSV Data Sources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {Object.entries(realisticPIV.breakdown.csvSources).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-600">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-mono text-slate-800">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Ideal PIV Framework */}
      {selectedFramework === 'ideal' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Original PIV Framework</CardTitle>
            <CardDescription>Your established PIV calculation method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">RCS: {idealPIV.components.rcs.toFixed(3)}</p>
                <p className="text-xs text-blue-600">{idealPIV.breakdown.rcsDetails}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">ICF: {idealPIV.components.icf.toFixed(3)}</p>
                <p className="text-xs text-blue-600">{idealPIV.breakdown.icfDetails}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">SC: {idealPIV.components.sc.toFixed(3)}</p>
                <p className="text-xs text-blue-600">{idealPIV.breakdown.scDetails}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800">OSM: {idealPIV.components.osm.toFixed(3)}</p>
                <p className="text-xs text-blue-600">{idealPIV.breakdown.osmDetails}</p>
              </div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-800">Formula:</h4>
              <p className="text-sm text-blue-700">{idealPIV.formula}</p>
              <p className="text-sm text-blue-700">
                = ({idealPIV.components.rcs.toFixed(3)} × {idealPIV.components.icf.toFixed(3)} × {idealPIV.components.sc.toFixed(3)} × {idealPIV.components.osm.toFixed(3)}) × {idealPIV.components.kd.toFixed(3)} × 100
              </p>
              <p className="text-sm text-blue-700 font-semibold">
                = {idealPIV.score.toFixed(1)} PIV
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">{idealPIV.description}</p>
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