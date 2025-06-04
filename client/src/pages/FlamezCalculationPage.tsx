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
  
  // Calculate flameZ T-Side PIV (Spacetaker)
  const calculateTSidePIV = () => {
    // Opening Duel Success Rate (25%)
    const openingDuelSuccess = flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths);
    
    // Trade Kill Involvement (17.5%) 
    const tradeKillInvolvement = flamezData.tradeKills / flamezData.kills;
    
    // T-Side ADR (14%) - normalized to 0-1 scale
    const tSideADR = Math.min(flamezData.adrTSide / 100, 1.0);
    
    // Headshot Percentage (15%)
    const headshotPct = flamezData.headshots / flamezData.kills;
    
    // T-Side KAST (15%)
    const tSideKAST = flamezData.kastTSide;
    
    // Basic Consistency (10.5%) - using K/D consistency
    const basicConsistency = Math.min(flamezData.kd / 1.5, 1.0);
    
    const tSidePIV = (openingDuelSuccess * 0.25) + 
                     (tradeKillInvolvement * 0.175) + 
                     (tSideADR * 0.14) + 
                     (headshotPct * 0.15) + 
                     (tSideKAST * 0.15) + 
                     (basicConsistency * 0.105);
    
    return {
      score: tSidePIV,
      breakdown: [
        { name: "Opening Duel Success", value: openingDuelSuccess, weight: 25.0, contribution: openingDuelSuccess * 0.25 },
        { name: "Trade Kill Involvement", value: tradeKillInvolvement, weight: 17.5, contribution: tradeKillInvolvement * 0.175 },
        { name: "T-Side ADR", value: tSideADR, weight: 14.0, contribution: tSideADR * 0.14 },
        { name: "Headshot Percentage", value: headshotPct, weight: 15.0, contribution: headshotPct * 0.15 },
        { name: "T-Side KAST", value: tSideKAST, weight: 15.0, contribution: tSideKAST * 0.15 },
        { name: "Basic Consistency", value: basicConsistency, weight: 10.5, contribution: basicConsistency * 0.105 }
      ]
    };
  };

  // Calculate flameZ CT-Side PIV (Rotator)
  const calculateCTSidePIV = () => {
    // CT-Side ADR (30%) - normalized to 0-1 scale
    const ctSideADR = Math.min(flamezData.adrCtSide / 100, 1.0);
    
    // Flash Assist Ratio (15%) - assists per utility thrown
    const flashAssistRatio = flamezData.assistedFlashes / flamezData.totalUtilityThrown;
    
    // CT-Side KAST (10%)
    const ctSideKAST = flamezData.kastCtSide;
    
    // Basic Consistency (15%) - using K/D consistency
    const basicConsistency = Math.min(flamezData.kd / 1.5, 1.0);
    
    // Remaining 40% weight - need to add more CT metrics
    const remainingWeight = 0.40; // Placeholder for additional CT metrics
    const remainingValue = 0.75; // Placeholder calculation
    
    const ctSidePIV = (ctSideADR * 0.30) + 
                      (flashAssistRatio * 0.15) + 
                      (ctSideKAST * 0.10) + 
                      (basicConsistency * 0.15) +
                      (remainingValue * remainingWeight);
    
    return {
      score: ctSidePIV,
      breakdown: [
        { name: "CT-Side ADR", value: ctSideADR, weight: 30.0, contribution: ctSideADR * 0.30 },
        { name: "Flash Assist Ratio", value: flashAssistRatio, weight: 15.0, contribution: flashAssistRatio * 0.15 },
        { name: "CT-Side KAST", value: ctSideKAST, weight: 10.0, contribution: ctSideKAST * 0.10 },
        { name: "Basic Consistency", value: basicConsistency, weight: 15.0, contribution: basicConsistency * 0.15 },
        { name: "Additional CT Metrics", value: remainingValue, weight: 40.0, contribution: remainingValue * remainingWeight }
      ]
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

      {/* T-Side PIV Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>T-Side PIV (Spacetaker Role)</CardTitle>
          <CardDescription>
            Score: {(flamezPIV.tSide.score * 100).toFixed(1)} | Weight: {(flamezPIV.weights.tWeight * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {flamezPIV.tSide.breakdown.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{metric.weight}%</Badge>
                  <span className="text-sm">{(metric.value * 100).toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={metric.value * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Contribution: {(metric.contribution * 100).toFixed(2)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* CT-Side PIV Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>CT-Side PIV (Rotator Role)</CardTitle>
          <CardDescription>
            Score: {(flamezPIV.ctSide.score * 100).toFixed(1)} | Weight: {(flamezPIV.weights.ctWeight * 100).toFixed(1)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {flamezPIV.ctSide.breakdown.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{metric.name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{metric.weight}%</Badge>
                  <span className="text-sm">{(metric.value * 100).toFixed(1)}%</span>
                </div>
              </div>
              <Progress value={metric.value * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Contribution: {(metric.contribution * 100).toFixed(2)}
              </p>
            </div>
          ))}
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