# Round-Based Metrics Documentation

## Overview

The CS2 Analytics Platform now includes comprehensive round-based metrics that enhance team performance analysis beyond traditional player statistics. This document details the integration of round data, the metrics calculation, and the visualization in the application.

## Data Flow

1. Round data is loaded from `attached_assets/CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv`
2. The data is processed in `server/roundAnalytics.ts` to calculate team-specific metrics
3. The metrics are cached in `HybridStorage` for efficient access
4. Client applications fetch the metrics through the `/api/round-metrics/:teamName` endpoint

## Round Metrics Categories

### Economy Metrics

| Metric | Description | Importance |
|--------|-------------|------------|
| Full Buy Win Rate | Success rate when both teams have full equipment | Indicates team's strength in standard gunround scenarios |
| Force Buy Win Rate | Success rate with limited equipment purchases | Measures team's ability to win at economic disadvantage |
| Eco Win Rate | Success rate with minimal/no purchases | Shows team's skill in saving rounds |
| Economic Recovery | How quickly team recovers after economic setbacks | Reflects economic management and adaptation |

### Strategic Metrics

| Metric | Description | Importance |
|--------|-------------|------------|
| Bomb Plant Rate | Percentage of T rounds with successful bomb plants | Shows T-side objective focus |
| Post-Plant Win Rate | Success rate after planting the bomb | Indicates post-plant positioning strength |
| Retake Success Rate | CT success rate in defusing planted bombs | Measures CT coordination in retake scenarios |
| A Site Preference | Percentage preference for A bombsite | Reveals strategic tendencies |
| B Site Preference | Percentage preference for B bombsite | Reveals strategic tendencies |

### Momentum Metrics

| Metric | Description | Importance |
|--------|-------------|------------|
| Pistol Win Rate | Success rate in pistol rounds (rounds 1, 16) | Critical for early game advantage |
| Follow-Up Win Rate | Success in rounds following pistol round wins | Shows ability to convert pistol advantage |
| Comeback Factor | Ability to win after losing multiple consecutive rounds | Indicates mental resilience |
| Closing Factor | Success rate in converting man-advantage situations | Measures discipline in advantageous scenarios |

### Map-Specific Metrics

For each map in the pool, the following metrics are tracked:
- CT Win Rate (percentage)
- T Win Rate (percentage)
- Bombsite Preference (A/B distribution)

## Implementation Details

### Data Processing

1. **Round Data Loading**: `server/roundDataLoader.ts` initializes round data processing at application startup
2. **Metrics Calculation**: `server/roundAnalytics.ts` contains the logic for processing round data into team metrics
3. **Storage**: Round metrics are cached in memory for efficient querying

### Component Structure

The `RoundMetricsCard` component displays metrics in a dashboard-style layout with:
- Tabbed interface for metric categories
- Metric boxes showing percentage values with appropriate icons
- Map-specific performance cards in the Maps tab

### Map Name Handling

Map entries like "p1", "p2", "p3" in the data represent picks in a match series:
- Typically, professional matches are best-of-three, with each team picking one map
- These entries are displayed as "Pick 1", "Pick 2", "Pick 3" in the UI
- Standard map pool names (inferno, mirage, etc.) are displayed with capitalized first letters

## Integration with Other Features

### Player Role Integration

Round data is used to enhance player role evaluation with specific metrics designed for each role:

#### IGL (In-Game Leader)
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Economic Management | Team's efficiency in equipment allocation | Economic efficiency ratio + force buy success |
| Adaptive Strategy | Success in changing approaches after losses | Timeout round success + comeback factor |
| Momentum Control | Ability to maintain advantages | Follow-up round wins after pistol rounds |
| Timeout Effectiveness | Impact of tactical timeouts | Win rate in rounds following timeouts |

#### AWP
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Opening Duel Impact | Success in first engagements with AWP | First kill success rate in rounds |
| Map Control | Area denial and control with AWP | CT-side win rate in bombsite holds |
| Pivotal Round Impact | Performance in crucial rounds | Success in match points and eco vs. full buy rounds |

#### Spacetaker
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Entry Success | Effectiveness in gaining initial map control | T-side first kills and successful site takes |
| Space Creation | Ability to create opportunities for teammates | Flash assists and trade success rate |
| Site Take Efficiency | Success in executing bombsite attacks | Percentage of successful bombsite takes |

#### Support
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Utility Impact | Effectiveness of utility usage | Flash assists and grenade damage in successful rounds |
| Post-Plant Support | Contribution to rounds after bomb plants | Post-plant win rate when player is alive |
| Retake Contribution | Role in successful bombsite retakes | Success rate in retake scenarios |

#### Lurker
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Flank Timing | Success in timing flanking maneuvers | Late-round kill success rate |
| Information Gathering | Ability to provide enemy position data | Success in rounds where lurking pattern detected |
| Clutch Impact | Performance in 1vX scenarios | Win rate in clutch situations |

#### Anchor/Rotator (CT-specific)
| Metric | Description | Calculation |
|--------|-------------|-------------|
| Site Defense | Success in holding bombsites | Win rate when defending a specific site |
| Rotation Timing | Effectiveness in site rotations | Success in retakes after rotation |
| Utility Usage | Smart utilization of utility | Impact of smoke and incendiary usage on round outcome |

### Match Prediction Enhancement

Round-based data significantly improves match prediction accuracy through:

#### Economy-Based Factors
| Factor | Weight | Description |
|--------|--------|-------------|
| Economy Efficiency | High | Compares teams' ability to convert money into round wins |
| Force Buy Success | Medium | Evaluates how teams perform in limited buy situations |
| Eco Round Success | Low | Measures success in minimal/save rounds |
| Economic Recovery | Medium | Compares how quickly teams bounce back after losing rounds |

#### Round Phase Factors
| Factor | Weight | Description |
|--------|--------|-------------|
| Pistol Round Win Rate | Very High | Critical for early advantage in each half |
| Follow-Up Conversion | High | Ability to convert pistol advantage into multiple rounds |
| Post-Plant Win Rate | Medium | Success after achieving bomb plant objective |
| Retake Success | Medium | Ability to reclaim bombsites and defuse |

#### Strategic Factors
| Factor | Weight | Description |
|--------|--------|-------------|
| Map-Specific Performance | Very High | Historical performance data on the selected map |
| Side Preference | Medium | CT/T-side bias based on historical performance |
| Site Preference | Medium | Bombsite attack/defense preferences and success rates |
| Timeout Strategy | Low | Effective use of tactical timeouts |

#### Psychological Factors
| Factor | Weight | Description |
|--------|--------|-------------|
| Comeback Factor | Medium | Ability to recover after losing multiple rounds |
| Closing Factor | High | Success in converting man-advantage scenarios |
| Match Point Performance | Medium | Historical performance in high-pressure situations |

The prediction algorithm creates a weighted assessment based on all these factors, with map-specific data and pistol round success having the strongest influence on the final prediction.

## Future Enhancements

1. Heat map visualization of bombsite attacks/defenses
2. Time-based analysis of round executions (early vs. late round performance)
3. Player-specific round contribution metrics
4. Utility usage effectiveness correlated with round outcomes

## Technical Reference

### Key Data Types

```typescript
// Round-based metrics interface
export interface TeamRoundMetrics {
  id: string;
  name: string;
  
  // Economy metrics
  econEfficiencyRatio: number;
  forceRoundWinRate: number;
  ecoRoundWinRate: number;
  fullBuyWinRate: number;
  economicRecoveryIndex: number;
  
  // Strategic metrics
  aPreference: number;
  bPreference: number;
  bombPlantRate: number;
  postPlantWinRate: number;
  retakeSuccessRate: number;
  
  // Momentum metrics
  pistolRoundWinRate: number;
  followUpRoundWinRate: number;
  comebackFactor: number;
  closingFactor: number;
  
  // Map-specific metrics
  mapPerformance: {
    [mapName: string]: {
      ctWinRate: number;
      tWinRate: number;
      bombsitesPreference: {
        a: number;
        b: number;
      }
    }
  }
}
```

### API Endpoints

```
GET /api/round-metrics/:teamName
```

Returns the complete round metrics for the specified team.

## Usage Examples

### Fetching Round Metrics in React Component

```tsx
// Example component that fetches and displays round metrics
import { useQuery } from "@tanstack/react-query";
import { TeamRoundMetrics } from "@shared/schema";

function TeamRoundMetricsDisplay({ teamName }: { teamName: string }) {
  const { data: metrics, isLoading } = useQuery<TeamRoundMetrics>({
    queryKey: [`/api/round-metrics/${teamName}`],
    enabled: !!teamName
  });

  if (isLoading) return <div>Loading metrics...</div>;
  if (!metrics) return <div>No round data available</div>;

  return (
    <div>
      <h2>{metrics.name} Round Performance</h2>
      <div>
        <h3>Economy</h3>
        <p>Full Buy Win Rate: {Math.round(metrics.fullBuyWinRate * 100)}%</p>
        <p>Force Buy Win Rate: {Math.round(metrics.forceRoundWinRate * 100)}%</p>
      </div>
      {/* Additional metrics display */}
    </div>
  );
}
```

### Enhancing Match Prediction with Round Data

```typescript
// In match prediction logic
import { TeamWithTIR, TeamRoundMetrics } from "@shared/schema";

function predictMatchOutcome(
  team1: TeamWithTIR,
  team2: TeamWithTIR,
  team1RoundMetrics: TeamRoundMetrics,
  team2RoundMetrics: TeamRoundMetrics,
  mapName: string
): { team1WinProbability: number, team2WinProbability: number } {
  // Base prediction from player PIV values
  let team1Score = team1.tir;
  let team2Score = team2.tir;
  
  // Enhance with round-based factors
  
  // 1. Economy factors
  const ecoFactor = 0.15; // 15% weight
  if (team1RoundMetrics.econEfficiencyRatio > team2RoundMetrics.econEfficiencyRatio) {
    team1Score += ecoFactor * team1Score;
  } else {
    team2Score += ecoFactor * team2Score;
  }
  
  // 2. Pistol round success
  const pistolFactor = 0.2; // 20% weight
  const team1PistolAdvantage = team1RoundMetrics.pistolRoundWinRate - team2RoundMetrics.pistolRoundWinRate;
  if (team1PistolAdvantage > 0) {
    team1Score += pistolFactor * team1PistolAdvantage * team1Score;
  } else {
    team2Score += pistolFactor * Math.abs(team1PistolAdvantage) * team2Score;
  }
  
  // 3. Map-specific performance
  const mapFactor = 0.25; // 25% weight
  const team1MapStats = team1RoundMetrics.mapPerformance[mapName];
  const team2MapStats = team2RoundMetrics.mapPerformance[mapName];
  
  if (team1MapStats && team2MapStats) {
    const team1MapWinRate = (team1MapStats.ctWinRate + team1MapStats.tWinRate) / 2;
    const team2MapWinRate = (team2MapStats.ctWinRate + team2MapStats.tWinRate) / 2;
    
    if (team1MapWinRate > team2MapWinRate) {
      team1Score += mapFactor * team1Score;
    } else {
      team2Score += mapFactor * team2Score;
    }
  }
  
  // Calculate final probabilities
  const totalScore = team1Score + team2Score;
  return {
    team1WinProbability: team1Score / totalScore,
    team2WinProbability: team2Score / totalScore
  };
}
```

### Enhancing Player Role Performance with Round Data

```typescript
// In player analytics
import { PlayerWithPIV, TeamRoundMetrics, PlayerRole } from "@shared/schema";

function enhanceAWPerMetrics(
  player: PlayerWithPIV,
  teamRoundMetrics: TeamRoundMetrics
): PlayerWithPIV {
  if (player.role !== PlayerRole.AWP) return player;
  
  // Only enhance AWPers
  let enhancedPIV = player.piv;
  
  // Factor in the team's CT side performance where AWPers are crucial
  const ctSideImpact = 0.1; // 10% weight
  Object.values(teamRoundMetrics.mapPerformance).forEach(mapStats => {
    if (mapStats.ctWinRate > 0.6) { // Strong CT side
      enhancedPIV *= (1 + ctSideImpact);
    }
  });
  
  // Factor in post-plant performance (AWPers often hold angles after plant)
  if (teamRoundMetrics.postPlantWinRate > 0.7) {
    enhancedPIV *= 1.05; // 5% bonus
  }
  
  return {
    ...player,
    piv: enhancedPIV
  };
}
```

These examples demonstrate how round-based metrics can be integrated throughout the application to enhance team analysis, player evaluation, and match prediction.