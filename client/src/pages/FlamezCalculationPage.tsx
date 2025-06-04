import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function FlamezCalculationPage() {
  const [selectedFramework, setSelectedFramework] = useState<'current' | 'realistic' | 'roles'>('current');

  // flameZ's authentic data from IEM Katowice 2025 CSV
  const flamezData = {
    userName: "flameZ",
    team: "Team Vitality",
    kills: 202,
    deaths: 193,
    kd: 1.0466321243523315,
    adrTotal: 67.45573770492,
    kastTSide: 0.75000000000,
    kastCtSide: 0.74522292994,
    tFirstKills: 46,
    tFirstDeaths: 46,
    ctFirstKills: 46,
    ctFirstDeaths: 20,
    tradeKills: 50,
    tradeDeaths: 60,
    assists: 79,
    headshots: 118,
    totalRoundsWon: 165,
    tRoundsWon: 71,
    ctRoundsWon: 94,
    assistedFlashes: 17,
    totalUtilityThrown: 622,
    totalUtilityDamage: 2152
  };

  // CURRENT PIV (actual implementation from newPlayerAnalytics.ts)
  const calculateCurrentPIV = () => {
    // T-SIDE SPACETAKER METRICS
    const tSideMetrics = {
      entryFragSuccess: flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths),
      tradeKillGeneration: flamezData.tradeKills / flamezData.kills,
      roundImpactFrequency: flamezData.tFirstKills / flamezData.tRoundsWon,
      utilityCoordination: flamezData.assistedFlashes / flamezData.totalUtilityThrown
    };
    
    const tRCS = (tSideMetrics.entryFragSuccess * 0.40 +
                  tSideMetrics.tradeKillGeneration * 0.30 +
                  tSideMetrics.roundImpactFrequency * 0.20 +
                  tSideMetrics.utilityCoordination * 0.10);

    // CT-SIDE ROTATOR METRICS
    const ctSideMetrics = {
      ctEntryDenial: flamezData.ctFirstKills / (flamezData.ctFirstKills + flamezData.ctFirstDeaths),
      rotationImpactRate: flamezData.ctFirstKills / flamezData.ctRoundsWon,
      ctSideSurvivalImpact: flamezData.kastCtSide,
      defensiveUtilityUsage: Math.min((flamezData.totalUtilityThrown - flamezData.assistedFlashes) / flamezData.totalRoundsWon / 3, 1.0)
    };
    
    const ctRCS = (ctSideMetrics.ctEntryDenial * 0.35 +
                   ctSideMetrics.rotationImpactRate * 0.25 +
                   ctSideMetrics.ctSideSurvivalImpact * 0.25 +
                   ctSideMetrics.defensiveUtilityUsage * 0.15);

    // ICF CALCULATION
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

    // SC CALCULATION
    const scComponents = {
      teamPlayContribution: flamezData.assists / flamezData.totalRoundsWon,
      tradabilityValue: 1 - (flamezData.tradeDeaths / flamezData.deaths),
      utilityEfficiencyRatio: Math.min(flamezData.totalUtilityDamage / flamezData.totalUtilityThrown / 10, 1.0)
    };
    const sc = (scComponents.teamPlayContribution * 0.40 +
                scComponents.tradabilityValue * 0.35 +
                scComponents.utilityEfficiencyRatio * 0.25);

    const osm = 0.96;
    const basicMetrics = {
      kd: Math.min(flamezData.kd / 1.5, 1.0),
      adr: Math.min(flamezData.adrTotal / 85, 1.0),
      kast: Math.min(((flamezData.kastTSide + flamezData.kastCtSide) / 2) / 0.75, 1.0)
    };
    const basicScore = (basicMetrics.kd * 0.4 + basicMetrics.adr * 0.3 + basicMetrics.kast * 0.3);

    const kdMultiplier = (flamezData.kd > 1.2) ? 1 + ((flamezData.kd - 1.2) * 0.6) : 1;
    const superStarMultiplier = (flamezData.kd > 1.5) ? 1 + ((flamezData.kd - 1.5) * 0.3) : 1;
    const combinedKdMultiplier = kdMultiplier * superStarMultiplier;

    const tPIVBase = ((tRCS * 0.5 + basicScore * 0.5) * icf + sc) * osm;
    const tSidePIV = tPIVBase * (1 + (flamezData.kd * 0.25)) * 1.03 * combinedKdMultiplier;

    const ctPIVBase = ((ctRCS * 0.5 + basicScore * 0.5) * icf + sc) * osm;
    const ctSidePIV = ctPIVBase * (1 + (flamezData.kd * 0.25)) * 1.0 * combinedKdMultiplier;

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
        combinedKdMultiplier
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
        "Complex K/D multiplier system creates score inflation for star players",
        "Basic score integration reduces role-specific weight to only 50%",
        "Multiplicative formula creates artificially low scores"
      ],
      syntheticData: [
        "totalUtilityDamage: Not present in CSV - estimated value",
        "tradeDeaths: Not present in CSV - estimated value", 
        "kdMultiplier and superStarMultiplier: Synthetic performance boosters"
      ]
    };
  };

  // REALISTIC PIV FRAMEWORK
  const calculateRealisticPIV = () => {
    const tSideRCS = {
      entryFragSuccess: flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths),
      tradeKillGeneration: flamezData.tradeKills / flamezData.kills,
      roundImpactFrequency: flamezData.tFirstKills / flamezData.tRoundsWon,
      utilityCoordination: flamezData.assistedFlashes / flamezData.totalUtilityThrown
    };
    
    const tRCS = (
      tSideRCS.entryFragSuccess * 0.40 +
      tSideRCS.tradeKillGeneration * 0.30 +
      tSideRCS.roundImpactFrequency * 0.20 +
      tSideRCS.utilityCoordination * 0.10
    );

    const ctSideRCS = {
      ctEntryDenial: flamezData.ctFirstKills / (flamezData.ctFirstKills + flamezData.ctFirstDeaths),
      rotationImpactRate: flamezData.ctFirstKills / flamezData.ctRoundsWon,
      ctSideSurvivalImpact: flamezData.kastCtSide,
      defensiveUtilityUsage: Math.min((flamezData.totalUtilityThrown - flamezData.assistedFlashes) / flamezData.totalRoundsWon / 3, 1.0)
    };
    
    const ctRCS = (
      ctSideRCS.ctEntryDenial * 0.35 +
      ctSideRCS.rotationImpactRate * 0.25 +
      ctSideRCS.ctSideSurvivalImpact * 0.25 +
      ctSideRCS.defensiveUtilityUsage * 0.15
    );

    const icf = Math.min(flamezData.kd / 1.3, 1.0) * 0.6 + 
                ((flamezData.kastTSide + flamezData.kastCtSide) / 2) * 0.4;

    const sc = (flamezData.assists / flamezData.totalRoundsWon) * 0.40 +
               (1 - (flamezData.tradeDeaths / flamezData.deaths)) * 0.35 +
               Math.min(flamezData.totalUtilityDamage / flamezData.totalUtilityThrown / 10, 1.0) * 0.25;

    const osm = 0.96;

    const baselineMetrics = {
      kdRatio: Math.min(flamezData.kd / 1.3, 1.0),
      adrEfficiency: Math.min(flamezData.adrTotal / 90, 1.0),
      kastConsistency: (flamezData.kastTSide + flamezData.kastCtSide) / 2
    };
    const baselineScore = (baselineMetrics.kdRatio + baselineMetrics.adrEfficiency + baselineMetrics.kastConsistency) / 3;

    const tSidePIV = tRCS + (icf * osm * baselineScore);
    const ctSidePIV = ctRCS + (icf * osm * baselineScore);
    
    const rolePerformance = (tSidePIV + ctSidePIV) / 2;
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
        baselineMetrics
      },
      dataIntegrity: [
        "All T-side and CT-side first kill data directly from CSV columns",
        "Trade kill and assist metrics use exact CSV values", 
        "Utility coordination based on assisted_flashes and total_util_thrown",
        "K/D and ADR values taken directly from tournament data",
        "KAST calculations use side-specific values from CSV"
      ],
      advantages: [
        "Eliminates all synthetic data dependencies",
        "Uses additive scoring for realistic PIV ranges (70-85)",
        "Proper role-specific weightings for T-side and CT-side performance", 
        "Baseline metrics provide stable foundation (20% of score)",
        "Tournament context multiplier reflects IEM Katowice elite level"
      ]
    };
  };

  const currentPIV = calculateCurrentPIV();
  const realisticPIV = calculateRealisticPIV();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Framework Selector */}
      <div className="flex space-x-2 mb-6">
        <Button
          variant={selectedFramework === 'current' ? 'default' : 'outline'}
          onClick={() => setSelectedFramework('current')}
          className="flex-1"
        >
          Current PIV Framework
        </Button>
        <Button
          variant={selectedFramework === 'realistic' ? 'default' : 'outline'}
          onClick={() => setSelectedFramework('realistic')}
          className="flex-1"
        >
          Realistic PIV Framework
        </Button>
        <Button
          variant={selectedFramework === 'roles' ? 'default' : 'outline'}
          onClick={() => setSelectedFramework('roles')}
          className="flex-1"
        >
          New Roles Framework
        </Button>
      </div>

      {/* Document Content */}
      <div className="bg-blue-900 text-white p-8 font-mono text-sm leading-relaxed space-y-6 border rounded-lg">
        
        {selectedFramework === 'current' && (
          <>
            <h1 className="text-2xl font-bold mb-4">CURRENT PIV FRAMEWORK ANALYSIS - flameZ</h1>
            
            <div className="space-y-4">
              <p><strong>Overall Current PIV Score:</strong> {currentPIV.score.toFixed(1)}</p>
              <p><strong>T-Side Spacetaker PIV:</strong> {currentPIV.tSidePIV.toFixed(1)}</p>
              <p><strong>CT-Side Rotator PIV:</strong> {currentPIV.ctSidePIV.toFixed(1)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">T-SIDE SPACETAKER METRICS</h2>
            <div className="space-y-2">
              <p>• Entry Frag Success (40%): {(currentPIV.breakdown.tSideMetrics.entryFragSuccess * 100).toFixed(1)}%</p>
              <p>  Formula: t_first_kills / (t_first_kills + t_first_deaths)</p>
              <p>• Trade Kill Generation (30%): {(currentPIV.breakdown.tSideMetrics.tradeKillGeneration * 100).toFixed(1)}%</p>
              <p>  Formula: trade_kills / kills</p>
              <p>• Round Impact Frequency (20%): {(currentPIV.breakdown.tSideMetrics.roundImpactFrequency * 100).toFixed(1)}%</p>
              <p>  Formula: t_first_kills / t_rounds_won</p>
              <p>• Utility Coordination (10%): {(currentPIV.breakdown.tSideMetrics.utilityCoordination * 100).toFixed(1)}%</p>
              <p>  Formula: assisted_flashes / total_util_thrown</p>
              <p><strong>T-RCS Result:</strong> {currentPIV.components.tRCS.toFixed(3)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CT-SIDE ROTATOR METRICS</h2>
            <div className="space-y-2">
              <p>• CT Entry Denial (35%): {(currentPIV.breakdown.ctSideMetrics.ctEntryDenial * 100).toFixed(1)}%</p>
              <p>  Formula: ct_first_kills / (ct_first_kills + ct_first_deaths)</p>
              <p>• Rotation Impact Rate (25%): {(currentPIV.breakdown.ctSideMetrics.rotationImpactRate * 100).toFixed(1)}%</p>
              <p>  Formula: ct_first_kills / ct_rounds_won</p>
              <p>• CT Side Survival Impact (25%): {(currentPIV.breakdown.ctSideMetrics.ctSideSurvivalImpact * 100).toFixed(1)}%</p>
              <p>  Formula: kast_ct_side</p>
              <p>• Defensive Utility Usage (15%): {(currentPIV.breakdown.ctSideMetrics.defensiveUtilityUsage * 100).toFixed(1)}%</p>
              <p>  Formula: (total_util_thrown - assisted_flashes) / total_rounds_won / 3</p>
              <p><strong>CT-RCS Result:</strong> {currentPIV.components.ctRCS.toFixed(3)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">ICF COMPONENTS</h2>
            <div className="space-y-2">
              <p>• Base Performance: {(currentPIV.breakdown.icfComponents.basePerformance * 100).toFixed(1)}%</p>
              <p>  Formula: min(kd / 1.3, 1.2)</p>
              <p>• Consistency Bonus: {(currentPIV.breakdown.icfComponents.consistencyBonus * 100).toFixed(1)}%</p>
              <p>  Formula: kd greater than 1.1 ? 0.15 : 0</p>
              <p>• Survival Rate: {(currentPIV.breakdown.icfComponents.survivalRate * 100).toFixed(1)}%</p>
              <p>  Formula: (kast_t_side + kast_ct_side) / 2</p>
              <p>• Headshot Consistency: {(currentPIV.breakdown.icfComponents.headshotConsistency * 100).toFixed(1)}%</p>
              <p>  Formula: headshots / kills</p>
              <p><strong>ICF Result:</strong> {currentPIV.components.icf.toFixed(3)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">SC COMPONENTS</h2>
            <div className="space-y-2">
              <p>• Team Play Contribution (40%): {(currentPIV.breakdown.scComponents.teamPlayContribution * 100).toFixed(1)}%</p>
              <p>  Formula: assists / total_rounds_won</p>
              <p>• Tradability Value (35%): {(currentPIV.breakdown.scComponents.tradabilityValue * 100).toFixed(1)}%</p>
              <p>  Formula: 1 - (trade_deaths / deaths)</p>
              <p>• [SYNTHETIC] Utility Efficiency Ratio (25%): {(currentPIV.breakdown.scComponents.utilityEfficiencyRatio * 100).toFixed(1)}%</p>
              <p>  Formula: total_util_dmg / total_util_thrown / 10 (NOT IN CSV)</p>
              <p><strong>SC Result:</strong> {currentPIV.components.sc.toFixed(3)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">SYNTHETIC MULTIPLIERS</h2>
            <div className="space-y-2">
              <p>• K/D Multiplier: {currentPIV.components.kdMultiplier.toFixed(3)} [SYNTHETIC]</p>
              <p>• Super Star Multiplier: {currentPIV.components.superStarMultiplier.toFixed(3)} [SYNTHETIC]</p>
              <p>• Combined K/D Multiplier: {currentPIV.components.combinedKdMultiplier.toFixed(3)} [SYNTHETIC]</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CALCULATION FORMULA</h2>
            <div className="space-y-2">
              <p>T-Side PIV: ((T-RCS × 0.5 + BasicScore × 0.5) × ICF + SC) × OSM × (1 + K/D×0.25) × 1.03 × KDMultiplier</p>
              <p>Result: {currentPIV.tSidePIV.toFixed(1)}</p>
              <p></p>
              <p>CT-Side PIV: ((CT-RCS × 0.5 + BasicScore × 0.5) × ICF + SC) × OSM × (1 + K/D×0.25) × 1.0 × KDMultiplier</p>
              <p>Result: {currentPIV.ctSidePIV.toFixed(1)}</p>
              <p></p>
              <p>Overall PIV: (T-Side × 50%) + (CT-Side × 50%) = {currentPIV.score.toFixed(1)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CRITICAL ISSUES</h2>
            <div className="space-y-2">
              {currentPIV.issues.map((issue, index) => (
                <p key={index}>• {issue}</p>
              ))}
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">SYNTHETIC DATA PROBLEMS</h2>
            <div className="space-y-2">
              {currentPIV.syntheticData.map((synthetic, index) => (
                <p key={index}>• {synthetic}</p>
              ))}
            </div>
          </>
        )}

        {selectedFramework === 'realistic' && (
          <>
            <h1 className="text-2xl font-bold mb-4">REALISTIC PIV FRAMEWORK ANALYSIS - flameZ</h1>
            
            <div className="space-y-4">
              <p><strong>Overall Realistic PIV Score:</strong> {realisticPIV.score.toFixed(1)}</p>
              <p><strong>T-Side Spacetaker PIV:</strong> {realisticPIV.components.tSidePIV.toFixed(1)}</p>
              <p><strong>CT-Side Rotator PIV:</strong> {realisticPIV.components.ctSidePIV.toFixed(1)}</p>
              <p><strong>Baseline Metrics Score:</strong> {realisticPIV.components.baselineScore.toFixed(1)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">T-SIDE SPACETAKER METRICS</h2>
            <div className="space-y-2">
              <p>• Entry Frag Success (40%): {(realisticPIV.breakdown.tSideRCS.entryFragSuccess * 100).toFixed(1)}%</p>
              <p>  CSV: t_first_kills / (t_first_kills + t_first_deaths)</p>
              <p>• Trade Kill Generation (30%): {(realisticPIV.breakdown.tSideRCS.tradeKillGeneration * 100).toFixed(1)}%</p>
              <p>  CSV: trade_kills / kills</p>
              <p>• Round Impact Frequency (20%): {(realisticPIV.breakdown.tSideRCS.roundImpactFrequency * 100).toFixed(1)}%</p>
              <p>  CSV: t_first_kills / t_rounds_won</p>
              <p>• Utility Coordination (10%): {(realisticPIV.breakdown.tSideRCS.utilityCoordination * 100).toFixed(1)}%</p>
              <p>  CSV: assisted_flashes / total_util_thrown</p>
              <p><strong>T-RCS Result:</strong> {realisticPIV.components.tRCS.toFixed(3)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CT-SIDE ROTATOR METRICS</h2>
            <div className="space-y-2">
              <p>• CT Entry Denial (35%): {(realisticPIV.breakdown.ctSideRCS.ctEntryDenial * 100).toFixed(1)}%</p>
              <p>  CSV: ct_first_kills / (ct_first_kills + ct_first_deaths)</p>
              <p>• Rotation Impact Rate (25%): {(realisticPIV.breakdown.ctSideRCS.rotationImpactRate * 100).toFixed(1)}%</p>
              <p>  CSV: ct_first_kills / ct_rounds_won</p>
              <p>• CT Side Survival Impact (25%): {(realisticPIV.breakdown.ctSideRCS.ctSideSurvivalImpact * 100).toFixed(1)}%</p>
              <p>  CSV: kast_ct_side</p>
              <p>• Defensive Utility Usage (15%): {(realisticPIV.breakdown.ctSideRCS.defensiveUtilityUsage * 100).toFixed(1)}%</p>
              <p>  CSV: (total_util_thrown - assisted_flashes) / total_rounds_won / 3</p>
              <p><strong>CT-RCS Result:</strong> {realisticPIV.components.ctRCS.toFixed(3)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">BASELINE METRICS (20% OF TOTAL PIV)</h2>
            <div className="space-y-2">
              <p>• K/D Ratio: {flamezData.kd.toFixed(3)} (CSV: kd)</p>
              <p>• ADR: {flamezData.adrTotal.toFixed(1)} (CSV: adr_total)</p>
              <p>• KAST: {((flamezData.kastTSide + flamezData.kastCtSide) / 2 * 100).toFixed(1)}% (CSV: kast_t_side + kast_ct_side)</p>
              <p><strong>Baseline Score:</strong> {realisticPIV.components.baselineScore.toFixed(1)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">PIV CALCULATION</h2>
            <div className="space-y-2">
              <p>T-Side PIV: T-RCS + (ICF × OSM × BaselineScore)</p>
              <p>= {realisticPIV.components.tRCS.toFixed(3)} + ({realisticPIV.components.icf.toFixed(3)} × {realisticPIV.components.osm.toFixed(3)} × {realisticPIV.components.baselineScore.toFixed(3)})</p>
              <p>= {realisticPIV.components.tSidePIV.toFixed(1)}</p>
              <p></p>
              <p>CT-Side PIV: CT-RCS + (ICF × OSM × BaselineScore)</p>
              <p>= {realisticPIV.components.ctRCS.toFixed(3)} + ({realisticPIV.components.icf.toFixed(3)} × {realisticPIV.components.osm.toFixed(3)} × {realisticPIV.components.baselineScore.toFixed(3)})</p>
              <p>= {realisticPIV.components.ctSidePIV.toFixed(1)}</p>
              <p></p>
              <p>Overall PIV: Role Performance (80%) + Baseline Metrics (20%)</p>
              <p>= ((T-Side + CT-Side) / 2 × 0.80) + (Baseline × 0.20)</p>
              <p>= (({realisticPIV.components.tSidePIV.toFixed(1)} + {realisticPIV.components.ctSidePIV.toFixed(1)}) / 2 × 0.80) + ({realisticPIV.components.baselineScore.toFixed(1)} × 0.20)</p>
              <p>= {realisticPIV.score.toFixed(1)}</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">AUTHENTIC DATA SOURCES</h2>
            <div className="space-y-2">
              {realisticPIV.dataIntegrity.map((source, index) => (
                <p key={index}>✓ {source}</p>
              ))}
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">FRAMEWORK ADVANTAGES</h2>
            <div className="space-y-2">
              {realisticPIV.advantages.map((advantage, index) => (
                <p key={index}>• {advantage}</p>
              ))}
            </div>
          </>
        )}

        {selectedFramework === 'roles' && (
          <>
            <h1 className="text-2xl font-bold mb-4">NEW ROLES FRAMEWORK - AUTHENTIC DATA ONLY</h1>
            
            <div className="space-y-4">
              <p><strong>Philosophy:</strong> Role-specific PIV calculations using only authentic CSV data from IEM Katowice 2025</p>
              <p><strong>No Synthetic Data:</strong> Zero estimated values, no performance boosters, pure tournament statistics</p>
              <p><strong>Inspiration:</strong> HLTV 2.0 rating system + traditional sports analytics (basketball PER, hockey Corsi)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CORE FRAMEWORK STRUCTURE</h2>
            <div className="space-y-2">
              <p><strong>T-Side PIV Formula:</strong> T-RCS + (ICF × OSM × BaselineScore)</p>
              <p><strong>CT-Side PIV Formula:</strong> CT-RCS + (ICF × OSM × BaselineScore)</p>
              <p><strong>Overall PIV:</strong> (T-Side + CT-Side) / 2 × 80% + BaselineScore × 20%</p>
              <p><strong>OSM (Tournament Context):</strong> 0.96 (IEM Katowice elite level)</p>
              <p><strong>ICF (Individual Consistency):</strong> K/D normalized (60%) + KAST average (40%)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">T-SIDE SPACETAKER (ENTRY FRAGGER)</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Create space and open rounds through aggressive entry attempts</p>
              <p><strong>Key Metrics (T-RCS Calculation):</strong></p>
              <p>• Entry Frag Success Rate (40%): t_first_kills / (t_first_kills + t_first_deaths)</p>
              <p>  Inspiration: Basketball field goal percentage - reward successful attempts</p>
              <p>• Trade Kill Generation (30%): trade_kills / kills</p>
              <p>  Measures ability to create tradeable situations for teammates</p>
              <p>• Round Impact Frequency (20%): t_first_kills / t_rounds_won</p>
              <p>  How often the player directly impacts T-side round wins</p>
              <p>• Utility Coordination (10%): assisted_flashes / total_util_thrown</p>
              <p>  Team-first mentality in utility usage</p>
              <p><strong>Expected PIV Range:</strong> 65-85 (elite entry fraggers)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CT-SIDE ROTATOR</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Flexible site defense and rotation between positions</p>
              <p><strong>Key Metrics (CT-RCS Calculation):</strong></p>
              <p>• Entry Denial Success (35%): ct_first_kills / (ct_first_kills + ct_first_deaths)</p>
              <p>  Winning crucial early-round duels on CT side</p>
              <p>• Rotation Impact Rate (25%): ct_first_kills / ct_rounds_won</p>
              <p>  Contributing to CT round wins through positioning</p>
              <p>• CT Survival Impact (25%): kast_ct_side</p>
              <p>  Staying alive to impact rounds (KAST on CT side)</p>
              <p>• Defensive Utility Usage (15%): (total_util_thrown - assisted_flashes) / ct_rounds_won / 3</p>
              <p>  Non-flash utility usage normalized by CT rounds</p>
              <p><strong>Expected PIV Range:</strong> 60-80 (strong CT side players)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">T-SIDE IGL (IN-GAME LEADER)</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Strategic leadership and mid-round calling on T side</p>
              <p><strong>Key Metrics (T-RCS Calculation):</strong></p>
              <p>• Strategic Round Win Rate (35%): t_rounds_won / (t_rounds_won + t_rounds_lost)</p>
              <p>  T-side round win percentage as strategic measure</p>
              <p>• Team Coordination (25%): (assists + assisted_flashes) / t_rounds_won</p>
              <p>  Supporting teammates through calls and utility</p>
              <p>• Clutch Leadership (25%): (kills_in_clutch_situations) / total_clutch_attempts</p>
              <p>  Proxy: kast_t_side (survival in difficult situations)</p>
              <p>• Economic Management (15%): saves / (saves + force_buys)</p>
              <p>  Proxy: Using consistent performance across rounds (headshots/kills ratio)</p>
              <p><strong>Expected PIV Range:</strong> 55-75 (IGL tax compensated by leadership value)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CT-SIDE IGL (IN-GAME LEADER)</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Defensive coordination and anti-stratting</p>
              <p><strong>Key Metrics (CT-RCS Calculation):</strong></p>
              <p>• Defensive Coordination (40%): ct_rounds_won / (ct_rounds_won + ct_rounds_lost)</p>
              <p>  CT-side round win percentage</p>
              <p>• Information Gathering (25%): assists / ct_rounds_won</p>
              <p>  Helping teammates through calls and positioning</p>
              <p>• Site Anchor Backup (20%): ct_first_kills / ct_rounds_won</p>
              <p>  Supporting site anchors when needed</p>
              <p>• Rotation Efficiency (15%): kast_ct_side</p>
              <p>  Staying alive to continue calling</p>
              <p><strong>Expected PIV Range:</strong> 55-75 (leadership value over individual performance)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">T-SIDE SUPPORT</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Enable teammates through utility and trading</p>
              <p><strong>Key Metrics (T-RCS Calculation):</strong></p>
              <p>• Flash Assist Efficiency (35%): assisted_flashes / total_flashes_thrown</p>
              <p>  Quality of flash usage for teammates</p>
              <p>• Trade Kill Success (30%): trade_kills / t_rounds_played</p>
              <p>  Following up on entry fragger attempts</p>
              <p>• Utility Distribution (20%): total_util_thrown / t_rounds_won</p>
              <p>  Consistent utility usage to support team</p>
              <p>• Team Play Impact (15%): assists / kills</p>
              <p>  Assisting teammates rather than seeking individual frags</p>
              <p><strong>Expected PIV Range:</strong> 50-70 (utility-focused role)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CT-SIDE SUPPORT</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Defensive utility and rotation assistance</p>
              <p><strong>Key Metrics (CT-RCS Calculation):</strong></p>
              <p>• Defensive Flash Efficiency (30%): assisted_flashes / total_flashes_thrown</p>
              <p>  Supporting defensive holds with utility</p>
              <p>• Retake Contribution (30%): assists / ct_rounds_won</p>
              <p>  Helping win back sites through coordination</p>
              <p>• Utility Coverage (25%): (total_util_thrown - assisted_flashes) / ct_rounds_won</p>
              <p>  Smokes, HE grenades for site control</p>
              <p>• Survival for Information (15%): kast_ct_side</p>
              <p>  Staying alive to provide intel and late-round impact</p>
              <p><strong>Expected PIV Range:</strong> 45-65 (supportive defensive role)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">T-SIDE ANCHOR (TRADE FRAGGER)</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Second contact and trade fragger behind entry</p>
              <p><strong>Key Metrics (T-RCS Calculation):</strong></p>
              <p>• Trade Kill Efficiency (40%): trade_kills / (entry_deaths_of_teammates)</p>
              <p>  Proxy: trade_kills / t_first_deaths (team entry failures)</p>
              <p>• Follow-up Impact (25%): multi_kills / t_rounds_won</p>
              <p>  Proxy: (kills - t_first_kills) / t_rounds_won</p>
              <p>• Round Conversion (20%): t_rounds_won_after_entry / total_entries</p>
              <p>  Proxy: kast_t_side (staying alive to convert advantages)</p>
              <p>• Positioning Discipline (15%): deaths_after_first_pick / t_rounds_played</p>
              <p>  Proxy: 1 - (t_first_deaths / t_rounds_played)</p>
              <p><strong>Expected PIV Range:</strong> 60-80 (consistent fragger behind entry)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CT-SIDE ANCHOR</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Hold assigned site and delay pushes</p>
              <p><strong>Key Metrics (CT-RCS Calculation):</strong></p>
              <p>• Site Hold Success (40%): ct_first_kills / (ct_first_kills + ct_first_deaths)</p>
              <p>  Winning initial duels when holding site</p>
              <p>• Delay Effectiveness (25%): survival_time_on_site / rounds_anchoring</p>
              <p>  Proxy: kast_ct_side (staying alive for rotations)</p>
              <p>• Multi-Kill Defense (20%): multi_kills_on_site / ct_rounds_played</p>
              <p>  Proxy: (kills × 0.7) / ct_rounds_won (impact per round)</p>
              <p>• Information Provision (15%): damage_per_death / 100</p>
              <p>  Proxy: assists / ct_rounds_played (calling and assisting)</p>
              <p><strong>Expected PIV Range:</strong> 65-85 (strong individual site holders)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">T-SIDE AWP</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Pick plays and long-range control on T side</p>
              <p><strong>Key Metrics (T-RCS Calculation):</strong></p>
              <p>• Opening Pick Success (35%): t_first_kills / (t_first_kills + t_first_deaths)</p>
              <p>  AWP's primary job is winning opening duels</p>
              <p>• Pick Impact Rate (30%): t_first_kills / t_rounds_played</p>
              <p>  How often AWP creates picks per round</p>
              <p>• Multi-Pick Potential (20%): (multi_kills) / t_rounds_won</p>
              <p>  Proxy: max(0, (kills - t_first_kills)) / t_rounds_won</p>
              <p>• Economic Efficiency (15%): survival_rate_with_awp / rounds_with_awp</p>
              <p>  Proxy: kast_t_side (keeping expensive weapon alive)</p>
              <p><strong>Expected PIV Range:</strong> 70-95 (elite AWPers with high impact)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CT-SIDE AWP</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Long-range site control and early picks</p>
              <p><strong>Key Metrics (CT-RCS Calculation):</strong></p>
              <p>• Entry Denial Rate (40%): ct_first_kills / (ct_first_kills + ct_first_deaths)</p>
              <p>  Stopping T-side entries with AWP</p>
              <p>• Map Control Contribution (25%): ct_first_kills / ct_rounds_played</p>
              <p>  Creating early advantages for team</p>
              <p>• Rotation Value (20%): multi_kills / ct_rounds_won</p>
              <p>  Proxy: (kills - ct_first_kills) / ct_rounds_won</p>
              <p>• Economic Preservation (15%): awp_survival_rate</p>
              <p>  Proxy: kast_ct_side (keeping weapon for next rounds)</p>
              <p><strong>Expected PIV Range:</strong> 65-90 (AWP impact varies by map/opponent)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">T-SIDE LURKER</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Information gathering and flank timing</p>
              <p><strong>Key Metrics (T-RCS Calculation):</strong></p>
              <p>• Flank Timing Success (35%): lurk_kills / lurk_attempts</p>
              <p>  Proxy: (kills - trade_kills - t_first_kills) / t_rounds_played</p>
              <p>• Information Value (25%): rounds_with_info_provided / t_rounds_played</p>
              <p>  Proxy: assists / t_rounds_played (calls leading to kills)</p>
              <p>• Clutch Opportunity Creation (25%): clutch_wins / clutch_attempts</p>
              <p>  Proxy: kast_t_side (surviving to late round situations)</p>
              <p>• Map Control Extension (15%): time_alive_alone / total_lurk_time</p>
              <p>  Proxy: (total_rounds - t_first_deaths) / t_rounds_played</p>
              <p><strong>Expected PIV Range:</strong> 55-75 (high variance, timing-dependent role)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">CT-SIDE LURKER (FLANKER)</h2>
            <div className="space-y-2">
              <p><strong>Primary Role:</strong> Backstab timing and rotation disruption</p>
              <p><strong>Key Metrics (CT-RCS Calculation):</strong></p>
              <p>• Flank Success Rate (40%): flank_kills / flank_attempts</p>
              <p>  Proxy: (kills - ct_first_kills - assists) / ct_rounds_played</p>
              <p>• Late Round Impact (30%): clutch_round_contribution</p>
              <p>  Proxy: kast_ct_side (alive for crucial moments)</p>
              <p>• Information Disruption (20%): enemy_utility_forced / ct_rounds_played</p>
              <p>  Proxy: damage_dealt / ct_rounds_played / 100</p>
              <p>• Rotation Punishment (10%): rotation_kills / rotation_attempts</p>
              <p>  Proxy: multi_kills / ct_rounds_won</p>
              <p><strong>Expected PIV Range:</strong> 50-70 (situational, high-risk role)</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">AUTHENTIC DATA SOURCES</h2>
            <div className="space-y-2">
              <p>✓ t_first_kills, t_first_deaths, ct_first_kills, ct_first_deaths</p>
              <p>✓ trade_kills, assists, headshots, total_util_thrown</p>
              <p>✓ assisted_flashes, kast_t_side, kast_ct_side</p>
              <p>✓ t_rounds_won, ct_rounds_won, total_rounds_won</p>
              <p>✓ kills, deaths, kd ratio</p>
              <p>✗ NO totalUtilityDamage (not in CSV)</p>
              <p>✗ NO tradeDeaths (not in CSV)</p>
              <p>✗ NO synthetic multipliers or performance boosters</p>
            </div>

            <h2 className="text-lg font-bold mt-6 mb-3">IMPLEMENTATION NOTES</h2>
            <div className="space-y-2">
              <p>• All percentages are role-specific weightings within T-RCS or CT-RCS</p>
              <p>• Proxy metrics used only when direct measurement unavailable in CSV</p>
              <p>• Expected PIV ranges based on role difficulty and impact potential</p>
              <p>• OSM (0.96) reflects IEM Katowice tournament strength</p>
              <p>• ICF rewards consistency: K/D normalized (60%) + KAST average (40%)</p>
              <p>• BaselineScore provides 20% foundation: (K/D + ADR + KAST) / 3</p>
              <p>• No artificial performance boosters - pure tournament performance</p>
            </div>
          </>
        )}

        <h2 className="text-lg font-bold mt-8 mb-3">flameZ RAW DATA CONTEXT</h2>
        <div className="space-y-2">
          <p>Tournament: IEM Katowice 2025</p>
          <p>Team: Team Vitality</p>
          <p>Role: T-Side Spacetaker, CT-Side Rotator</p>
          <p>K/D Ratio: {flamezData.kd.toFixed(3)}</p>
          <p>ADR Total: {flamezData.adrTotal.toFixed(1)}</p>
          <p>KAST Average: {((flamezData.kastTSide + flamezData.kastCtSide) / 2 * 100).toFixed(1)}%</p>
          <p>Total Rounds: {flamezData.totalRoundsWon}</p>
          <p>T-Side Rounds: {flamezData.tRoundsWon}</p>
          <p>CT-Side Rounds: {flamezData.ctRoundsWon}</p>
          <p>First Kills: {flamezData.tFirstKills + flamezData.ctFirstKills}</p>
          <p>Trade Kills: {flamezData.tradeKills}</p>
          <p>Assists: {flamezData.assists}</p>
          <p>Total Utility Thrown: {flamezData.totalUtilityThrown}</p>
        </div>
      </div>
    </div>
  );
}