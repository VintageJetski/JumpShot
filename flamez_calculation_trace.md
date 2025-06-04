# flameZ PIV Calculation Analysis

## Raw Data from CSV (flameZ - Team Vitality):
- Kills: 202
- Deaths: 193  
- K/D: 1.04663212435
- AWP Kills: 0 (not an AWP player)
- Assists: 79
- First Kills: 92
- First Deaths: 66
- ADR Total: 85.39 (very high)
- KAST Total: 0.758 (solid)
- Total Utility: 622
- Assisted Flashes: 17

## Current PIV Calculation Breakdown:

### 1. Role Assignment
- Based on console logs, players are getting assigned roles from CSV
- flameZ likely assigned: Spacetaker or Support role (not AWP since awp_kills = 0)

### 2. Role Metrics Calculation (RCS)
From debug logs, 8 metrics normalized 0-1, each weighted 0.125:
- Example values: ~0.6-0.9 range for top players
- RCS = sum of (metric × 0.125) for 8 metrics
- Typical RCS result: ~0.68 for good players

### 3. ICF (Individual Consistency Factor)
- K/D: 1.047 (solid)
- Sigma: sqrt((1.047-1)²) = 0.047
- ICF calculation: ~0.82 (good consistency)

### 4. SC (Synergy Contribution) 
- Role-specific calculation
- Typical result: ~0.67 for good players

### 5. Basic Metrics Score
- Role-specific metrics from basicMetrics.ts
- Typical result: ~0.27 (this seems low!)

### 6. OSM (Opponent Strength Multiplier)
- Static value: 0.84

### 7. Current PIV Formula:
**PIV = RCS × ICF × SC × OSM × BasicScore × RoleWeight**

Example calculation:
0.68 × 0.82 × 0.67 × 0.84 × 0.27 × 1.0 = **0.102**

## THE PROBLEM:
1. **Multiplying 6 fractional values** (0.1-0.9 range each)
2. **Basic Score appears too low** (~0.27 for top players)
3. **No scaling to meaningful range** (should be 0-100, not 0-1)
4. **Missing role weights** affecting final calculation

## WHY TOP PLAYERS GET LOW SCORES:
- flameZ stats suggest he should score 85-95 PIV
- Instead getting ~10-26 due to compound multiplication
- Each component reduces the final value exponentially