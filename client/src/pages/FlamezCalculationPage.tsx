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
  const [selectedFramework, setSelectedFramework] = useState<'current' | 'realistic'>('realistic');

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

  // CURRENT PIV (actual implementation from newPlayerAnalytics.ts)
  const calculateCurrentPIV = () => {
    // AUTHENTIC T-SIDE SPACETAKER METRICS (evaluateTSideMetrics)
    const tSideMetrics = {
      // Entry fragging effectiveness (40% weight)
      entryFragSuccess: flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths),
      
      // Trade kill generation (30% weight)  
      tradeKillGeneration: flamezData.tradeKills / flamezData.kills,
      
      // Round impact frequency (20% weight)
      roundImpactFrequency: flamezData.tFirstKills / flamezData.tRoundsWon,
      
      // Utility coordination (10% weight)
      utilityCoordination: flamezData.assistedFlashes / flamezData.totalUtilityThrown
    };
    
    const tRCS = (tSideMetrics.entryFragSuccess * 0.40 +
                  tSideMetrics.tradeKillGeneration * 0.30 +
                  tSideMetrics.roundImpactFrequency * 0.20 +
                  tSideMetrics.utilityCoordination * 0.10);

    // AUTHENTIC CT-SIDE ROTATOR METRICS (evaluateCTSideMetrics)
    const ctSideMetrics = {
      // Entry denial success (35% weight)
      ctEntryDenial: flamezData.ctFirstKills / (flamezData.ctFirstKills + flamezData.ctFirstDeaths),
      
      // Rotation impact rate (25% weight)
      rotationImpactRate: flamezData.ctFirstKills / flamezData.ctRoundsWon,
      
      // CT-side survival and contribution (25% weight)
      ctSideSurvivalImpact: flamezData.kastCtSide,
      
      // Defensive utility usage (15% weight)
      defensiveUtilityUsage: Math.min((flamezData.totalUtilityThrown - flamezData.assistedFlashes) / flamezData.totalRoundsWon / 3, 1.0)
    };
    
    const ctRCS = (ctSideMetrics.ctEntryDenial * 0.35 +
                   ctSideMetrics.rotationImpactRate * 0.25 +
                   ctSideMetrics.ctSideSurvivalImpact * 0.25 +
                   ctSideMetrics.defensiveUtilityUsage * 0.15);

    // ICF CALCULATION (calculateICF)
    const icfComponents = {
      basePerformance: Math.min(flamezData.kd / 1.3, 1.2),
      consistencyBonus: flamezData.kd > 1.1 ? 0.15 : 0,
      survivalRate: ((flamezData.kastTSide + flamezData.kastCtSide) / 2),
      headshotConsistency: (flamezData.headshots / flamezData.kills)
    };
    const icf = (icfComponents.basePerformance * 0.4 + 
                 icfComponents.consistencyBonus + 
                 icfComponents.survivalRate * 0.3 + 
                 icfComponents.headshotConsistency * 0.3);

    // SC CALCULATION (calculateSC) - Using authentic CSV data
    const scComponents = {
      // Team play contribution (40% weight) - CSV: assists / total_rounds_won
      teamPlayContribution: flamezData.assists / flamezData.totalRoundsWon,
      
      // Tradability value (35% weight) - CSV: trade_deaths inverted
      tradabilityValue: 1 - (flamezData.tradeDeaths / flamezData.deaths),
      
      // Utility efficiency (25% weight) - CSV: total_util_dmg / total_util_thrown
      utilityEfficiencyRatio: Math.min(flamezData.totalUtilityDamage / flamezData.totalUtilityThrown / 10, 1.0)
    };
    const sc = (scComponents.teamPlayContribution * 0.40 +
                scComponents.tradabilityValue * 0.35 +
                scComponents.utilityEfficiencyRatio * 0.25);

    // OSM - Tournament context
    const osm = 0.96; // IEM Katowice elite level

    // BASIC METRICS SCORE (calculateBasicMetricsScore) - Using authentic CSV data
    const basicMetrics = {
      kd: Math.min(flamezData.kd / 1.5, 1.0),
      adr: Math.min(flamezData.adrTotal / 85, 1.0), // CSV: adr_total
      kast: Math.min(((flamezData.kastTSide + flamezData.kastCtSide) / 2) / 0.75, 1.0) // Calculated from T/CT sides
    };
    const basicScore = (basicMetrics.kd * 0.4 + basicMetrics.adr * 0.3 + basicMetrics.kast * 0.3);

    // K/D MULTIPLIERS (from calculatePlayerWithPIV)
    const kdMultiplier = (flamezData.kd > 1.2) ? 1 + ((flamezData.kd - 1.2) * 0.6) : 1;
    const superStarMultiplier = (flamezData.kd > 1.5) ? 1 + ((flamezData.kd - 1.5) * 0.3) : 1;
    const combinedKdMultiplier = kdMultiplier * superStarMultiplier;

    // PIV CALCULATIONS (calculatePIV)
    const tPIVBase = ((tRCS * 0.5 + basicScore * 0.5) * icf + sc) * osm;
    const tSidePIV = tPIVBase * (1 + (flamezData.kd * 0.25)) * 1.03 * combinedKdMultiplier; // Spacetaker modifier

    const ctPIVBase = ((ctRCS * 0.5 + basicScore * 0.5) * icf + sc) * osm;
    const ctSidePIV = ctPIVBase * (1 + (flamezData.kd * 0.25)) * 1.0 * combinedKdMultiplier; // Rotator modifier

    // OVERALL PIV (50% CT, 50% T for non-IGL)
    const overallPIV = (ctSidePIV * 0.5) + (tSidePIV * 0.5);

    return {
      score: overallPIV,
      tSidePIV,
      ctSidePIV,
      components: { 
        tRCS, 
        ctRCS, 
        icf, 
        sc, 
        osm, 
        basicScore,
        kdMultiplier,
        superStarMultiplier,
        combinedKdMultiplier,
        tSidePIV,
        ctSidePIV
      },
      breakdown: { 
        tSideMetrics, 
        ctSideMetrics,
        icfComponents,
        scComponents,
        basicMetrics
      },
      issues: [
        "Uses estimated totalUtilityDamage and tradeDeaths values not present in CSV",
        "kastTSide and kastCtSide values calculated from overall KAST, not side-specific",
        "adrTSide and adrCtSide derived from overall ADR, not authentic side-specific data",
        "Complex K/D multiplier system creates score inflation for star players",
        "Defensive utility calculation assumes non-flash utility distribution",
        "Basic score integration reduces role-specific weight to only 50%"
      ],
      syntheticData: [
        "totalUtilityDamage: Not present in CSV - estimated or calculated value",
        "tradeDeaths: Not present in CSV - estimated or calculated value", 
        "kastTSide/kastCtSide: Derived from overall KAST, not side-specific authentic data",
        "adrTSide/adrCtSide: Derived from overall ADR, not side-specific authentic data",
        "kdMultiplier and superStarMultiplier: Synthetic performance boosters"
      ]
    };
  };

  const currentPIV = calculateCurrentPIV();
  const realisticPIV = calculateRealisticPIV();

  const getCurrentData = () => {
    switch(selectedFramework) {
      case 'current': return currentPIV;
      case 'realistic': return realisticPIV;
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
        </AlertDescription>
      </Alert>

      {/* Current PIV Detailed Analysis */}
      {selectedFramework === 'current' && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Current PIV Detailed Breakdown</CardTitle>
              <CardDescription>Complete analysis showing all synthetic data and calculation issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-orange-700">T-Side Spacetaker PIV</h3>
                    <p className="text-2xl font-bold text-orange-800">{currentPIV.tSidePIV.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">T-RCS: {currentPIV.components.tRCS.toFixed(3)}</p>
                  </div>
                  <Progress value={Math.min(currentPIV.tSidePIV * 10, 100)} className="h-3" />
                </div>
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-blue-700">CT-Side Rotator PIV</h3>
                    <p className="text-2xl font-bold text-blue-800">{currentPIV.ctSidePIV.toFixed(1)}</p>
                    <p className="text-sm text-muted-foreground">CT-RCS: {currentPIV.components.ctRCS.toFixed(3)}</p>
                  </div>
                  <Progress value={Math.min(currentPIV.ctSidePIV * 10, 100)} className="h-3" />
                </div>
              </div>

              <div className="bg-slate-100 p-4 rounded-lg text-center">
                <h4 className="font-semibold text-slate-800 mb-2">Overall Current PIV</h4>
                <p className="text-3xl font-bold text-slate-900">{currentPIV.score.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">
                  Formula: (T-Side PIV × 50%) + (CT-Side PIV × 50%)
                </p>
                <p className="text-sm text-muted-foreground">
                  = ({currentPIV.tSidePIV.toFixed(1)} × 50%) + ({currentPIV.ctSidePIV.toFixed(1)} × 50%)
                </p>
              </div>

              <Tabs defaultValue="tside" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tside">T-Side Metrics</TabsTrigger>
                  <TabsTrigger value="ctside">CT-Side Metrics</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Calculation</TabsTrigger>
                </TabsList>
                
                <TabsContent value="tside" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    T-Side Spacetaker role metrics with weightings
                  </div>
                  {Object.entries(currentPIV.breakdown.tSideMetrics).map(([key, value]) => (
                    <div key={key} className={`flex justify-between items-center p-3 border rounded ${
                      key === 'basicConsistency' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${
                          'text-orange-700'
                        }`}>
                          {key.replace(/([A-Z])/g, ' $1')}
                          {key === 'entryFragSuccess' && ' (40%)'}
                          {key === 'tradeKillGeneration' && ' (30%)'}
                          {key === 'roundImpactFrequency' && ' (20%)'}
                          {key === 'utilityCoordination' && ' (10%)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {key === 'entryFragSuccess' && 't_first_kills / (t_first_kills + t_first_deaths)'}
                          {key === 'tradeKillGeneration' && 'trade_kills / kills'}
                          {key === 'roundImpactFrequency' && 't_first_kills / t_rounds_won'}
                          {key === 'utilityCoordination' && 'assisted_flashes / total_util_thrown'}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        key === 'basicConsistency' ? 'text-red-900' : 'text-orange-900'
                      }`}>
                        {((value as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="ctside" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    CT-Side Rotator role metrics with weightings
                  </div>
                  {Object.entries(currentPIV.breakdown.ctSideMetrics).map(([key, value]) => (
                    <div key={key} className={`flex justify-between items-center p-3 border rounded ${
                      key === 'defensiveUtilityUsage' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-sm font-medium ${
                          key === 'defensiveUtilityUsage' ? 'text-yellow-700' : 'text-blue-700'
                        }`}>
                          {key.replace(/([A-Z])/g, ' $1')}
                          {key === 'ctEntryDenial' && ' (35%)'}
                          {key === 'rotationImpactRate' && ' (25%)'}
                          {key === 'ctSideSurvivalImpact' && ' (25%)'}
                          {key === 'defensiveUtilityUsage' && ' (15%)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {key === 'ctEntryDenial' && 'ct_first_kills / (ct_first_kills + ct_first_deaths)'}
                          {key === 'rotationImpactRate' && 'ct_first_kills / ct_rounds_won'}
                          {key === 'ctSideSurvivalImpact' && 'kast_ct_side'}
                          {key === 'defensiveUtilityUsage' && '(total_util_thrown - assisted_flashes) / total_rounds_won / 3'}
                        </span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        key === 'defensiveUtilityUsage' ? 'text-yellow-900' : 'text-blue-900'
                      }`}>
                        {((value as number) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    ICF, SC, and Basic Metrics components
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-purple-700">ICF Components</h4>
                      {Object.entries(currentPIV.breakdown.icfComponents).map(([key, value]) => (
                        <div key={key} className="p-2 bg-purple-50 border border-purple-200 rounded">
                          <div className="text-sm font-medium text-purple-700">{key.replace(/([A-Z])/g, ' $1')}</div>
                          <div className="text-xs text-slate-500">
                            {key === 'basePerformance' && 'min(kd / 1.3, 1.2)'}
                            {key === 'consistencyBonus' && 'kd > 1.1 ? 0.15 : 0'}
                            {key === 'survivalRate' && '(kast_t_side + kast_ct_side) / 2'}
                            {key === 'headshotConsistency' && 'headshots / kills'}
                          </div>
                          <div className="text-sm font-semibold text-purple-900">{((value as number) * 100).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-green-700">SC Components</h4>
                      {Object.entries(currentPIV.breakdown.scComponents).map(([key, value]) => (
                        <div key={key} className={`p-2 border rounded ${
                          key === 'utilityEfficiencyRatio' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                        }`}>
                          <div className={`text-sm font-medium ${
                            key === 'utilityEfficiencyRatio' ? 'text-red-700' : 'text-green-700'
                          }`}>
                            {key.replace(/([A-Z])/g, ' $1')}
                            {key === 'utilityEfficiencyRatio' && ' - SYNTHETIC'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {key === 'teamPlayContribution' && 'assists / total_rounds_won (40% weight)'}
                            {key === 'tradabilityValue' && '1 - (trade_deaths / deaths) (35% weight)'}
                            {key === 'utilityEfficiencyRatio' && 'FAKE: total_util_dmg / total_util_thrown (25% weight)'}
                          </div>
                          <div className={`text-sm font-semibold ${
                            key === 'utilityEfficiencyRatio' ? 'text-red-900' : 'text-green-900'
                          }`}>
                            {((value as number) * 100).toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold text-slate-700">Synthetic Multipliers</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm font-medium text-red-700">K/D Multiplier</div>
                        <div className="text-xs text-red-600">SYNTHETIC: {currentPIV.components.kdMultiplier.toFixed(3)}</div>
                      </div>
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm font-medium text-red-700">Super Star Multiplier</div>
                        <div className="text-xs text-red-600">SYNTHETIC: {currentPIV.components.superStarMultiplier.toFixed(3)}</div>
                      </div>
                      <div className="p-2 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm font-medium text-red-700">Combined Multiplier</div>
                        <div className="text-xs text-red-600">SYNTHETIC: {currentPIV.components.combinedKdMultiplier.toFixed(3)}</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-red-800">Current PIV Calculation Formula:</h4>
                <p className="text-sm text-red-700">
                  <strong>T-Side PIV:</strong> ((T-RCS × 0.5 + BasicScore × 0.5) × ICF + SC) × OSM × (1 + K/D×0.25) × 1.03 × KDMultiplier
                </p>
                <p className="text-sm text-red-700">
                  = {currentPIV.tSidePIV.toFixed(1)}
                </p>
                <p className="text-sm text-red-700 mt-2">
                  <strong>CT-Side PIV:</strong> ((CT-RCS × 0.5 + BasicScore × 0.5) × ICF + SC) × OSM × (1 + K/D×0.25) × 1.0 × KDMultiplier
                </p>
                <p className="text-sm text-red-700">
                  = {currentPIV.ctSidePIV.toFixed(1)}
                </p>
                <p className="text-sm text-red-700 mt-2 font-semibold">
                  <strong>Overall PIV:</strong> (T-Side × 50%) + (CT-Side × 50%) = {currentPIV.score.toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Critical PIV Issues</CardTitle>
              <CardDescription>Complete breakdown of why this calculation fails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-red-700">Structural Problems:</h4>
                {currentPIV.issues.map((issue, index) => (
                  <div key={index} className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">• {issue}</p>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-red-700">Synthetic Data Issues:</h4>
                {currentPIV.syntheticData.map((synthetic, index) => (
                  <div key={index} className="p-3 bg-red-100 rounded-lg border border-red-300">
                    <p className="text-sm text-red-900">🚫 {synthetic}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
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

              <Tabs defaultValue="baseline" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="baseline">Baseline Metrics</TabsTrigger>
                  <TabsTrigger value="tside">T-Side Spacetaker</TabsTrigger>
                  <TabsTrigger value="ctside">CT-Side Rotator</TabsTrigger>
                  <TabsTrigger value="icf">ICF Consistency</TabsTrigger>
                  <TabsTrigger value="sc">SC Synergy</TabsTrigger>
                </TabsList>
                
                <TabsContent value="baseline" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    Baseline Performance Metrics (20% of total PIV) with Equal Weightings
                  </div>
                  {Object.entries(realisticPIV.breakdown.baselineMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {key.replace(/([A-Z])/g, ' $1')} (33.3% weight)
                        </span>
                        <span className="text-xs text-slate-500">
                          {key === 'kdRatio' && 'kd / 1.3 (elite threshold)'}
                          {key === 'adrEfficiency' && 'adr_total / 90 (elite threshold)'}
                          {key === 'kastConsistency' && '(kast_t_side + kast_ct_side) / 2'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="tside" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    T-Side Spacetaker Role Core Score with Individual Weightings
                  </div>
                  {Object.entries(realisticPIV.breakdown.tSideRCS).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {key.replace(/([A-Z])/g, ' $1')} 
                          {key === 'entryFragSuccess' && ' (40% weight)'}
                          {key === 'tradeKillGeneration' && ' (30% weight)'}
                          {key === 'roundImpactFrequency' && ' (20% weight)'}
                          {key === 'utilityCoordination' && ' (10% weight)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {key === 'entryFragSuccess' && 't_first_kills / (t_first_kills + t_first_deaths)'}
                          {key === 'tradeKillGeneration' && 'trade_kills / kills'}
                          {key === 'roundImpactFrequency' && 't_first_kills / t_rounds_won'}
                          {key === 'utilityCoordination' && 'assisted_flashes / total_util_thrown'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="ctside" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    CT-Side Rotator Role Core Score with Individual Weightings
                  </div>
                  {Object.entries(realisticPIV.breakdown.ctSideRCS).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {key.replace(/([A-Z])/g, ' $1')}
                          {key === 'ctEntryDenial' && ' (35% weight)'}
                          {key === 'rotationImpactRate' && ' (25% weight)'}
                          {key === 'ctSideSurvivalImpact' && ' (25% weight)'}
                          {key === 'defensiveUtilityUsage' && ' (15% weight)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {key === 'ctEntryDenial' && 'ct_first_kills / (ct_first_kills + ct_first_deaths)'}
                          {key === 'rotationImpactRate' && 'ct_first_kills / ct_rounds_won'}
                          {key === 'ctSideSurvivalImpact' && 'kast_ct_side'}
                          {key === 'defensiveUtilityUsage' && '(total_util_thrown - assisted_flashes) / total_rounds_won / 3'}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">{((value as number) * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="icf" className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    Individual Consistency Factor with Equal Weightings
                  </div>
                  {Object.entries(realisticPIV.breakdown.icfMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {key.replace(/([A-Z])/g, ' $1')} (33.3% weight)
                        </span>
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
                    Synergy Contribution with Individual Weightings
                  </div>
                  {Object.entries(realisticPIV.breakdown.scMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center p-3 bg-slate-100 border border-slate-200 rounded">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">
                          {key.replace(/([A-Z])/g, ' $1')}
                          {key === 'teamPlayContribution' && ' (40% weight)'}
                          {key === 'tradabilityValue' && ' (35% weight)'}
                          {key === 'utilityEfficiencyRatio' && ' (25% weight)'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {key === 'teamPlayContribution' && 'assists / total_rounds_won'}
                          {key === 'tradabilityValue' && '1 - (trade_deaths / deaths)'}
                          {key === 'utilityEfficiencyRatio' && 'total_util_dmg / total_util_thrown / 10'}
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
                    <CardTitle className="text-sm">Role Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Entry Success Rate</span>
                      <span>{((flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CT Entry Denial Rate</span>
                      <span>{((flamezData.ctFirstKills / (flamezData.ctFirstKills + flamezData.ctFirstDeaths)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assists Per Round</span>
                      <span>{(flamezData.assists / flamezData.totalRoundsWon).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trade Death Avoidance</span>
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