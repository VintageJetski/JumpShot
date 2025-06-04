import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface MetricWeight {
  name: string;
  weight: number;
  description: string;
}

interface RoleWeights {
  tSideMetrics: MetricWeight[];
  ctSideMetrics: MetricWeight[];
  basicConsistencyFactors: MetricWeight[];
}

const initialSpacetakerWeights: RoleWeights = {
  tSideMetrics: [
    {
      name: "Opening Duel Success Rate",
      weight: 25.0,
      description: "Success in T-side entry frags"
    },
    {
      name: "Trade Kill Involvement", 
      weight: 17.5,
      description: "Involvement in team's trades"
    },
    {
      name: "Average Damage per Round (ADR)",
      weight: 14.0,
      description: "Damage output per round"
    },
    {
      name: "Basic Consistency",
      weight: 10.5,
      description: "Consistency in Opening Duels performance"
    },
    {
      name: "Headshot Percentage",
      weight: 15.0,
      description: "Percentage of kills as headshots"
    },
    {
      name: "T-Side KAST",
      weight: 15.0,
      description: "Kill, Assist, Survive, Trade on T-side"
    }
  ],
  ctSideMetrics: [
    {
      name: "CT-Side ADR",
      weight: 30.0,
      description: "Damage per round on CT side"
    },
    {
      name: "Basic Consistency",
      weight: 15.0,
      description: "Consistency in performance metrics"
    },
    {
      name: "Flash Assist Ratio",
      weight: 15.0,
      description: "Flash assists relative to flashes thrown"
    },
    {
      name: "CT-Side KAST",
      weight: 10.0,
      description: "KAST on CT side only"
    }
  ],
  basicConsistencyFactors: [
    {
      name: "Flash Assists Consistency",
      weight: 20.0,
      description: "Consistency in flash support"
    },
    {
      name: "Trade Kill Consistency",
      weight: 20.0,
      description: "Consistency in trading kills"
    },
    {
      name: "Smokes Usage Consistency",
      weight: 10.0,
      description: "Consistency in utility usage"
    },
    {
      name: "ADR Consistency",
      weight: 20.0,
      description: "Consistency in damage per round"
    },
    {
      name: "KAST Consistency",
      weight: 30.0,
      description: "Consistency in overall round contribution"
    }
  ]
};

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

export default function RoleWeightings2Page() {
  const [spacetakerWeights] = useState<RoleWeights>(initialSpacetakerWeights);

  // Calculate flameZ T-Side PIV (Spacetaker)
  const calculateTSidePIV = () => {
    // Opening Duel Success Rate (25%)
    const openingDuelSuccess = flamezData.tFirstKills / (flamezData.tFirstKills + flamezData.tFirstDeaths);
    
    // Trade Kill Involvement (17.5%)
    const tradeKillInvolvement = flamezData.tradeKills / flamezData.kills;
    
    // T-Side ADR (14%)
    const tSideADR = flamezData.adrTSide / 100; // Normalize
    
    // Headshot Percentage (15%)
    const headshotPct = flamezData.headshots / flamezData.kills;
    
    // T-Side KAST (15%)
    const tSideKAST = flamezData.kastTSide;
    
    // Basic Consistency (10.5%) - placeholder for now
    const basicConsistency = 0.75; // Will calculate properly
    
    const tSidePIV = (openingDuelSuccess * 0.25) + 
                     (tradeKillInvolvement * 0.175) + 
                     (tSideADR * 0.14) + 
                     (headshotPct * 0.15) + 
                     (tSideKAST * 0.15) + 
                     (basicConsistency * 0.105);
    
    return {
      score: tSidePIV,
      breakdown: {
        openingDuelSuccess: { value: openingDuelSuccess, contribution: openingDuelSuccess * 0.25 },
        tradeKillInvolvement: { value: tradeKillInvolvement, contribution: tradeKillInvolvement * 0.175 },
        tSideADR: { value: tSideADR, contribution: tSideADR * 0.14 },
        headshotPct: { value: headshotPct, contribution: headshotPct * 0.15 },
        tSideKAST: { value: tSideKAST, contribution: tSideKAST * 0.15 },
        basicConsistency: { value: basicConsistency, contribution: basicConsistency * 0.105 }
      }
    };
  };

  // Calculate flameZ CT-Side PIV (Rotator)
  const calculateCTSidePIV = () => {
    // CT-Side ADR (30%)
    const ctSideADR = flamezData.adrCtSide / 100; // Normalize
    
    // Flash Assist Ratio (15%)
    const flashAssistRatio = flamezData.assistedFlashes / (flamezData.totalUtilityThrown * 0.3); // Approximate flashes thrown
    
    // CT-Side KAST (10%)
    const ctSideKAST = flamezData.kastCtSide;
    
    // Basic Consistency (15%) - placeholder
    const basicConsistency = 0.75;
    
    const ctSidePIV = (ctSideADR * 0.30) + 
                      (flashAssistRatio * 0.15) + 
                      (ctSideKAST * 0.10) + 
                      (basicConsistency * 0.15);
    
    return {
      score: ctSidePIV,
      breakdown: {
        ctSideADR: { value: ctSideADR, contribution: ctSideADR * 0.30 },
        flashAssistRatio: { value: flashAssistRatio, contribution: flashAssistRatio * 0.15 },
        ctSideKAST: { value: ctSideKAST, contribution: ctSideKAST * 0.10 },
        basicConsistency: { value: basicConsistency, contribution: basicConsistency * 0.15 }
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
          <h1 className="text-3xl font-bold">Role Weightings 2.0</h1>
          <p className="text-muted-foreground mt-2">
            Clean PIV calculation framework with proper T/CT side separation
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Clean Implementation
        </Badge>
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Role Configuration</CardTitle>
          <CardDescription>
            Configure weights for each role's T-side and CT-side performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={(value) => setSelectedRole(value as PlayerRole)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value={PlayerRole.Spacetaker}>Spacetaker</TabsTrigger>
              <TabsTrigger value={PlayerRole.Rotator}>Rotator</TabsTrigger>
              <TabsTrigger value={PlayerRole.AWP}>AWP</TabsTrigger>
              <TabsTrigger value={PlayerRole.IGL}>IGL</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* PIV Calculation Formula */}
      <Card>
        <CardHeader>
          <CardTitle>PIV Calculation Framework</CardTitle>
          <CardDescription>
            Clean separation of Basic Metrics, Advanced Metrics, and Consistency Factors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">T-Side PIV Calculation:</h4>
            <code className="text-sm">
              T_PIV = (Basic_Metrics × 0.4) + (Advanced_Metrics × 0.4) + (Consistency_Factor × 0.2)
            </code>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">CT-Side PIV Calculation:</h4>
            <code className="text-sm">
              CT_PIV = (Basic_Metrics × 0.4) + (Advanced_Metrics × 0.4) + (Consistency_Factor × 0.2)
            </code>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Overall PIV:</h4>
            <code className="text-sm">
              Overall_PIV = (T_PIV × T_rounds_weight) + (CT_PIV × CT_rounds_weight)
            </code>
          </div>
        </CardContent>
      </Card>

      {/* T-Side Metrics Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>T-Side Basic Metrics ({selectedRole})</CardTitle>
          <CardDescription>
            Configure weights for T-side performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentWeights.tSideMetrics.map((metric, index) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{metric.name}</h4>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
                <Badge variant="secondary">{metric.weight.toFixed(1)}%</Badge>
              </div>
              <Slider
                value={[metric.weight]}
                onValueChange={(value) => updateWeight('tSideMetrics', index, value[0])}
                max={50}
                min={0}
                step={0.5}
                className="w-full"
              />
            </div>
          ))}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium">
              Total T-Side Weight: {calculateTotalWeight(currentWeights.tSideMetrics).toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CT-Side Metrics Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>CT-Side Basic Metrics (Rotator Role)</CardTitle>
          <CardDescription>
            Configure weights for CT-side performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentWeights.ctSideMetrics.map((metric, index) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{metric.name}</h4>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
                <Badge variant="secondary">{metric.weight.toFixed(1)}%</Badge>
              </div>
              <Slider
                value={[metric.weight]}
                onValueChange={(value) => updateWeight('ctSideMetrics', index, value[0])}
                max={50}
                min={0}
                step={0.5}
                className="w-full"
              />
            </div>
          ))}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium">
              Total CT-Side Weight: {calculateTotalWeight(currentWeights.ctSideMetrics).toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Basic Consistency Factors */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Consistency Factors</CardTitle>
          <CardDescription>
            Consistency metrics applied to both T and CT side calculations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentWeights.basicConsistencyFactors.map((metric, index) => (
            <div key={metric.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{metric.name}</h4>
                  <p className="text-sm text-muted-foreground">{metric.description}</p>
                </div>
                <Badge variant="secondary">{metric.weight.toFixed(1)}%</Badge>
              </div>
              <Slider
                value={[metric.weight]}
                onValueChange={(value) => updateWeight('basicConsistencyFactors', index, value[0])}
                max={50}
                min={0}
                step={0.5}
                className="w-full"
              />
            </div>
          ))}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium">
              Total Consistency Weight: {calculateTotalWeight(currentWeights.basicConsistencyFactors).toFixed(1)}%
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Implementation Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button variant="default">
              Apply New Formula
            </Button>
            <Button variant="outline">
              Reset to Defaults
            </Button>
            <Button variant="outline">
              Export Configuration
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>This clean framework will replace the current mixed calculation approach with:</p>
            <ul className="list-disc ml-6 mt-2 space-y-1">
              <li>Proper T/CT side separation for dual-role players</li>
              <li>Clear Basic/Advanced/Consistency metric categorization</li>
              <li>Configurable role-specific weights</li>
              <li>Meaningful PIV scores (0-100 range)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}