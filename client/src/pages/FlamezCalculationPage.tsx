import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// flameZ raw data from CSV
const flamezData = {
  userName: "flameZ",
  team: "Team Vitality", 
  kills: 202,
  deaths: 193,
  kd: 1.04663212435,
  tFirstKills: 46,
  tFirstDeaths: 46,
  ctFirstKills: 46,
  ctFirstDeaths: 20,
  tradeKills: 58,
  adrTotal: 85.39,
  adrTSide: 82.35,
  adrCtSide: 88.84,
  kastTotal: 0.758,
  kastTSide: 0.765,
  kastCtSide: 0.750,
  headshots: 118,
  assistedFlashes: 17,
  totalUtilityThrown: 622,
  tRoundsWon: 71,
  ctRoundsWon: 94,
  totalRoundsWon: 165
};

export default function FlamezCalculationPage() {
  
  // Advanced Metrics Calculation using previous complex framework
  const calculateAdvancedMetrics = () => {
    // RCS (Role Core Score) - Spacetaker specific metrics
    const spacetakerMetrics = {
      entryFragSuccess: flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths),
      tradeKillEfficiency: flamezData.tradeKills / flamezData.kills,
      multiKillRounds: Math.min(flamezData.kd * 0.6, 1.0), // Proxy for multi-kill capability
      utilityCoordination: flamezData.assistedFlashes / flamezData.totalUtilityThrown,
      siteExecutionSuccess: flamezData.tRoundsWon / flamezData.totalRoundsWon,
      clutchSuccess: Math.min((flamezData.kd - 1) * 2, 1.0), // K/D above 1.0 indicates clutch ability
      economicImpact: flamezData.adrTSide / 100,
      consistency: 1 / (1 + Math.abs(flamezData.kd - 1.2)) // Consistency around optimal K/D
    };
    
    // Normalize metrics to 0-1 scale and calculate RCS
    const normalizedMetrics = Object.values(spacetakerMetrics).map(val => Math.max(0, Math.min(1, val)));
    const rcs = normalizedMetrics.reduce((sum, val) => sum + val, 0) / normalizedMetrics.length;
    
    return { spacetakerMetrics, rcs };
  };

  // ICF (Individual Consistency Factor) - Enhanced calculation
  const calculateICF = () => {
    const kd = flamezData.kd;
    
    // Base performance factor
    const basePerformanceFactor = Math.min(kd / 1.4, 1.2); // Cap at 1.2 for exceptional players
    
    // Consistency multiplier based on K/D variance
    const kdDeviation = Math.abs(kd - 1.0);
    const sigma = kdDeviation * 0.8; // Role-specific sigma calculation
    const consistencyMultiplier = 1 / (1 + sigma);
    
    // flameZ is not IGL, so no IGL bonus
    const iglMultiplier = 1.0;
    
    const icf = basePerformanceFactor * consistencyMultiplier * iglMultiplier;
    
    return {
      value: Math.min(icf, 1.0),
      breakdown: {
        basePerformanceFactor,
        consistencyMultiplier,
        iglMultiplier,
        sigma
      }
    };
  };

  // SC (Synergy Contribution) - Spacetaker specific
  const calculateSC = () => {
    // Entry impact for team
    const entryImpact = (flamezData.tFirstKills / flamezData.totalRoundsWon) * 0.4;
    
    // Trade coordination
    const tradeCoordination = (flamezData.tradeKills / flamezData.kills) * 0.3;
    
    // Utility synergy
    const utilitySynergy = (flamezData.assistedFlashes / flamezData.totalUtilityThrown) * 0.2;
    
    // K/D contribution
    const kdContribution = Math.min(flamezData.kd / 2, 0.5) * 0.1;
    
    const sc = entryImpact + tradeCoordination + utilitySynergy + kdContribution;
    
    return {
      value: Math.min(sc, 1.0),
      breakdown: {
        entryImpact,
        tradeCoordination,
        utilitySynergy,
        kdContribution
      }
    };
  };

  // Calculate flameZ T-Side PIV (Spacetaker) with enhanced metrics
  const calculateTSidePIV = () => {
    const advancedMetrics = calculateAdvancedMetrics();
    const icf = calculateICF();
    const sc = calculateSC();
    const osm = 0.84; // Opponent Strength Multiplier for IEM Katowice
    const kdMultiplier = Math.min(flamezData.kd, 1.5); // K/D multiplier capped at 1.5
    
    // Basic Metrics (simplified for T-side)
    const basicMetrics = {
      openingDuelSuccess: flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths),
      tradeKillInvolvement: flamezData.tradeKills / flamezData.kills,
      adrNormalized: Math.min(flamezData.adrTSide / 100, 1.0),
      headshotPct: flamezData.headshots / flamezData.kills,
      kastTSide: flamezData.kastTSide
    };
    
    const basicScore = Object.values(basicMetrics).reduce((sum, val) => sum + val, 0) / Object.values(basicMetrics).length;
    
    // Enhanced PIV Formula: (RCS * ICF * SC * OSM) * K/D Multiplier + Basic Score Weight
    const complexPIV = (advancedMetrics.rcs * icf.value * sc.value * osm) * kdMultiplier;
    const basicWeight = 0.3;
    const complexWeight = 0.7;
    
    const tSidePIV = (complexPIV * complexWeight) + (basicScore * basicWeight);
    
    return {
      score: tSidePIV,
      components: {
        rcs: advancedMetrics.rcs,
        icf: icf.value,
        sc: sc.value,
        osm,
        kdMultiplier,
        basicScore,
        complexPIV,
        finalScore: tSidePIV
      },
      breakdown: [
        { name: "RCS (Role Core Score)", value: advancedMetrics.rcs, weight: "Complex", contribution: advancedMetrics.rcs },
        { name: "ICF (Individual Consistency)", value: icf.value, weight: "Complex", contribution: icf.value },
        { name: "SC (Synergy Contribution)", value: sc.value, weight: "Complex", contribution: sc.value },
        { name: "OSM (Opponent Strength)", value: osm, weight: "Complex", contribution: osm },
        { name: "K/D Multiplier", value: kdMultiplier, weight: "Complex", contribution: kdMultiplier },
        { name: "Basic Metrics Average", value: basicScore, weight: 30.0, contribution: basicScore * basicWeight }
      ],
      detailedBreakdown: {
        advancedMetrics: advancedMetrics.spacetakerMetrics,
        icfBreakdown: icf.breakdown,
        scBreakdown: sc.breakdown,
        basicMetrics
      }
    };
  };

  // Calculate flameZ CT-Side PIV (Rotator) with enhanced metrics
  const calculateCTSidePIV = () => {
    // Advanced CT-Side Rotator Metrics
    const rotatorMetrics = {
      positionHoldSuccess: flamezData.ctRoundsWon / flamezData.totalRoundsWon, // Site holding effectiveness
      rotationEfficiency: Math.min(flamezData.adrCtSide / 85, 1.0), // Damage efficiency on rotations
      utilityImpact: flamezData.assistedFlashes / flamezData.totalUtilityThrown,
      anchorStrength: Math.min((flamezData.ctFirstKills / flamezData.ctFirstDeaths), 1.2), // Opening duel success CT
      retakeContribution: Math.min(flamezData.kd * 0.8, 1.0), // Retake capability
      economicStability: flamezData.kastCtSide, // KAST indicates economic contribution
      teamSupport: (flamezData.assistedFlashes / flamezData.totalUtilityThrown) * 1.5, // Enhanced utility support
      adaptability: 1 / (1 + Math.abs(flamezData.adrCtSide - flamezData.adrTSide) / 20) // Consistency across sides
    };
    
    // Normalize and calculate RCS for CT-side
    const normalizedCTMetrics = Object.values(rotatorMetrics).map(val => Math.max(0, Math.min(1, val)));
    const ctRCS = normalizedCTMetrics.reduce((sum, val) => sum + val, 0) / normalizedCTMetrics.length;
    
    // ICF for CT-side (similar calculation but CT-focused)
    const ctICF = calculateICF(); // Same consistency factors apply
    
    // SC for CT-side (Rotator specific synergy)
    const ctSC = {
      rotationImpact: (flamezData.ctRoundsWon / flamezData.totalRoundsWon) * 0.35,
      utilityCoordination: (flamezData.assistedFlashes / flamezData.totalUtilityThrown) * 0.25,
      siteSupport: Math.min(flamezData.adrCtSide / 90, 1.0) * 0.25,
      teamSynergy: Math.min(flamezData.kd / 1.8, 0.6) * 0.15
    };
    
    const ctSCValue = Object.values(ctSC).reduce((sum, val) => sum + val, 0);
    
    // Enhanced CT PIV Formula: (RCS * ICF * SC * OSM) * K/D Multiplier
    const osm = 0.84;
    const kdMultiplier = Math.min(flamezData.kd, 1.5);
    const complexCTPIV = (ctRCS * ctICF.value * ctSCValue * osm) * kdMultiplier;
    
    // Basic CT metrics
    const basicCTMetrics = {
      ctADR: Math.min(flamezData.adrCtSide / 100, 1.0),
      flashAssistRatio: flamezData.assistedFlashes / flamezData.totalUtilityThrown,
      ctKAST: flamezData.kastCtSide,
      siteHoldSuccess: flamezData.ctRoundsWon / flamezData.totalRoundsWon
    };
    
    const basicCTScore = Object.values(basicCTMetrics).reduce((sum, val) => sum + val, 0) / Object.values(basicCTMetrics).length;
    
    const basicWeight = 0.3;
    const complexWeight = 0.7;
    const ctSidePIV = (complexCTPIV * complexWeight) + (basicCTScore * basicWeight);
    
    return {
      score: ctSidePIV,
      components: {
        ctRCS,
        ctICF: ctICF.value,
        ctSC: ctSCValue,
        osm,
        kdMultiplier,
        basicCTScore,
        complexCTPIV,
        finalScore: ctSidePIV
      },
      breakdown: [
        { name: "CT RCS (Role Core Score)", value: ctRCS, weight: "Complex", contribution: ctRCS },
        { name: "CT ICF (Consistency)", value: ctICF.value, weight: "Complex", contribution: ctICF.value },
        { name: "CT SC (Synergy)", value: ctSCValue, weight: "Complex", contribution: ctSCValue },
        { name: "OSM (Opponent Strength)", value: osm, weight: "Complex", contribution: osm },
        { name: "K/D Multiplier", value: kdMultiplier, weight: "Complex", contribution: kdMultiplier },
        { name: "Basic CT Metrics", value: basicCTScore, weight: 30.0, contribution: basicCTScore * basicWeight }
      ],
      detailedBreakdown: {
        rotatorMetrics,
        ctSCBreakdown: ctSC,
        basicCTMetrics
      }
    };
  };

  // Calculate Overall PIV
  const calculateOverallPIV = () => {
    const tSideResult = calculateTSidePIV();
    const ctSideResult = calculateCTSidePIV();
    
    // Weight by rounds played
    const tWeight = flamezData.tRoundsWon / flamezData.totalRoundsWon;
    const ctWeight = flamezData.ctRoundsWon / flamezData.totalRoundsWon;
    
    const overallPIV = (tSideResult.score * tWeight) + (ctSideResult.score * ctWeight);
    
    // Scale to 0-100 range
    const scaledPIV = overallPIV * 100;
    
    return {
      tSide: tSideResult,
      ctSide: ctSideResult,
      overall: overallPIV,
      scaled: scaledPIV,
      weights: { tWeight, ctWeight }
    };
  };

  const flamezPIV = calculateOverallPIV();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">flameZ PIV Calculation Framework</h1>
          <p className="text-muted-foreground mt-2">
            Clean T/CT side separation with role-specific metrics
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          PIV: {flamezPIV.scaled.toFixed(1)}
        </Badge>
      </div>

      {/* Raw Data Display */}
      <Card>
        <CardHeader>
          <CardTitle>flameZ Raw Data (Team Vitality)</CardTitle>
          <CardDescription>Authentic data from IEM Katowice 2025 CSV</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Overall Stats</p>
            <p className="text-sm">Kills: {flamezData.kills}</p>
            <p className="text-sm">Deaths: {flamezData.deaths}</p>
            <p className="text-sm">K/D: {flamezData.kd.toFixed(3)}</p>
            <p className="text-sm">ADR: {flamezData.adrTotal}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">T-Side Stats</p>
            <p className="text-sm">First Kills: {flamezData.tFirstKills}</p>
            <p className="text-sm">First Deaths: {flamezData.tFirstDeaths}</p>
            <p className="text-sm">ADR: {flamezData.adrTSide}</p>
            <p className="text-sm">KAST: {(flamezData.kastTSide * 100).toFixed(1)}%</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">CT-Side Stats</p>
            <p className="text-sm">First Kills: {flamezData.ctFirstKills}</p>
            <p className="text-sm">First Deaths: {flamezData.ctFirstDeaths}</p>
            <p className="text-sm">ADR: {flamezData.adrCtSide}</p>
            <p className="text-sm">KAST: {(flamezData.kastCtSide * 100).toFixed(1)}%</p>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced T-Side PIV Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>T-Side PIV (Spacetaker Role) - Enhanced Formula</CardTitle>
          <CardDescription>
            Score: {(flamezPIV.tSide.score * 100).toFixed(1)} | Weight: {(flamezPIV.weights.tWeight * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula Display */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Enhanced PIV Formula:</h4>
            <code className="text-sm">
              PIV = [(RCS × ICF × SC × OSM) × K/D Multiplier × 70%] + [Basic Score × 30%]
            </code>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>RCS: {flamezPIV.tSide.components.rcs.toFixed(3)} | ICF: {flamezPIV.tSide.components.icf.toFixed(3)} | SC: {flamezPIV.tSide.components.sc.toFixed(3)}</p>
              <p>OSM: {flamezPIV.tSide.components.osm} | K/D Multiplier: {flamezPIV.tSide.components.kdMultiplier.toFixed(3)}</p>
              <p>Complex PIV: {(flamezPIV.tSide.components.complexPIV * 100).toFixed(1)} | Basic Score: {(flamezPIV.tSide.components.basicScore * 100).toFixed(1)}</p>
            </div>
          </div>

          {/* Component Breakdown */}
          {flamezPIV.tSide.breakdown.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={metric.weight === "Complex" ? "default" : "secondary"}>
                    {metric.weight === "Complex" ? "Complex Formula" : `${metric.weight}%`}
                  </Badge>
                  <span className="text-sm">{(metric.value * 100).toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={metric.value * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Raw Value: {metric.value.toFixed(4)}
              </p>
            </div>
          ))}

          {/* Detailed Spacetaker Metrics */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Advanced Spacetaker Metrics (RCS Components)</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(flamezPIV.tSide.detailedBreakdown.advancedMetrics).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span>{((value as number) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ICF Breakdown */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Individual Consistency Factor (ICF) Breakdown</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(flamezPIV.tSide.detailedBreakdown.icfBreakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span>{(value as number).toFixed(4)}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced CT-Side PIV Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>CT-Side PIV (Rotator Role) - Enhanced Formula</CardTitle>
          <CardDescription>
            Score: {(flamezPIV.ctSide.score * 100).toFixed(1)} | Weight: {(flamezPIV.weights.ctWeight * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formula Display */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Enhanced CT PIV Formula:</h4>
            <code className="text-sm">
              PIV = [(CT_RCS × ICF × CT_SC × OSM) × K/D Multiplier × 70%] + [Basic CT Score × 30%]
            </code>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>CT_RCS: {flamezPIV.ctSide.components.ctRCS.toFixed(3)} | ICF: {flamezPIV.ctSide.components.ctICF.toFixed(3)} | CT_SC: {flamezPIV.ctSide.components.ctSC.toFixed(3)}</p>
              <p>OSM: {flamezPIV.ctSide.components.osm} | K/D Multiplier: {flamezPIV.ctSide.components.kdMultiplier.toFixed(3)}</p>
              <p>Complex CT PIV: {(flamezPIV.ctSide.components.complexCTPIV * 100).toFixed(1)} | Basic CT Score: {(flamezPIV.ctSide.components.basicCTScore * 100).toFixed(1)}</p>
            </div>
          </div>

          {/* Component Breakdown */}
          {flamezPIV.ctSide.breakdown.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={metric.weight === "Complex" ? "default" : "secondary"}>
                    {metric.weight === "Complex" ? "Complex Formula" : `${metric.weight}%`}
                  </Badge>
                  <span className="text-sm">{(metric.value * 100).toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={metric.value * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Raw Value: {metric.value.toFixed(4)}
              </p>
            </div>
          ))}

          {/* Detailed Rotator Metrics */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Advanced Rotator Metrics (CT_RCS Components)</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(flamezPIV.ctSide.detailedBreakdown.rotatorMetrics).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span>{((value as number) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* CT Synergy Breakdown */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">CT Synergy Contribution (SC) Breakdown</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(flamezPIV.ctSide.detailedBreakdown.ctSCBreakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span>{((value as number) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final PIV Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall PIV Calculation</CardTitle>
          <CardDescription>Combined T-side and CT-side performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">T-Side Contribution</p>
              <p className="text-lg">{(flamezPIV.tSide.score * flamezPIV.weights.tWeight * 100).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">
                {(flamezPIV.tSide.score * 100).toFixed(1)} × {(flamezPIV.weights.tWeight * 100).toFixed(1)}%
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">CT-Side Contribution</p>
              <p className="text-lg">{(flamezPIV.ctSide.score * flamezPIV.weights.ctWeight * 100).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">
                {(flamezPIV.ctSide.score * 100).toFixed(1)} × {(flamezPIV.weights.ctWeight * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Final PIV Score</span>
              <span className="text-2xl font-bold text-primary">{flamezPIV.scaled.toFixed(1)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Formula: (T_PIV × {(flamezPIV.weights.tWeight * 100).toFixed(1)}%) + (CT_PIV × {(flamezPIV.weights.ctWeight * 100).toFixed(1)}%) × 100
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}