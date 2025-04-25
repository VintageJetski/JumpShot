# Team Impact Rating (TIR) System Documentation

## Overview

The Team Impact Rating (TIR) is a comprehensive team evaluation system designed to quantify a CS2 team's overall strength and effectiveness. The TIR system goes beyond simple win-loss records by incorporating player-level metrics, team synergy factors, and role-based performance into a single cohesive rating.

## Core Components

The TIR calculation is based on several key components:

### 1. Aggregate Player Impact

- **Base Calculation**: Weighted average of all team players' PIV (Player Impact Value)
- **Importance**: 45% of total TIR
- **Formula**: 
  ```
  AggregateImpact = (∑ PlayerPIV * RoleWeight) / TotalPlayers
  ```
- **Role Weights**:
  - IGL: 1.05x
  - AWP: 1.1x
  - Entry/Spacetaker: 1.05x
  - Support: 1.0x
  - Lurker: 1.0x

### 2. Team Synergy

- **Definition**: Measures how effectively players work together beyond individual skill
- **Importance**: 30% of total TIR
- **Calculation Factors**:
  - Role complementarity (proper balance of roles)
  - Play style compatibility
  - Historical performance together
  - Trade kill efficiency
  - Communication effectiveness (inferred from gameplay patterns)

### 3. Role Coverage

- **Definition**: Evaluates how well a team covers all necessary roles
- **Importance**: 15% of total TIR
- **Perfect Coverage**: Teams with optimal role distribution across T and CT sides
- **Penalties**: Applied for role redundancies or missing critical roles

### 4. Map Pool Strength

- **Definition**: Measures a team's performance across the competitive map pool
- **Importance**: 10% of total TIR
- **Calculation**:
  - Win rates on each map
  - Performance consistency across maps
  - Specialization value (being exceptionally strong on specific maps)

## TIR Formula

The complete TIR calculation combines these components:

```
TIR = (AggregatePlayerImpact * 0.45) + (TeamSynergy * 0.30) + (RoleCoverage * 0.15) + (MapPoolStrength * 0.10)
```

The result is scaled to a 0-10 range for easier interpretation, with most professional teams falling between 5.0 and 9.0.

## Practical Interpretation

The TIR values can be interpreted as follows:

- **9.0+**: World-class elite team (top 3 globally)
- **8.0-8.9**: Championship contender (top 10 globally)
- **7.0-7.9**: Strong professional team (top 20 globally)
- **6.0-6.9**: Established professional team
- **5.0-5.9**: Developing professional team
- **4.0-4.9**: Semi-professional team
- **Below 4.0**: Amateur or newly formed team

## Team Comparison Applications

The TIR system enables several analytical applications:

### 1. Head-to-Head Analysis

- Comparison of overall team strength
- Identification of team strengths and weaknesses
- Role matchup analysis between opposing teams

### 2. Tournament Seeding

- Objective ranking system for tournament organizers
- Fair matchup creation based on team strength
- Performance tracking throughout a tournament

### 3. Team Development Insights

- Identifying areas for improvement:
  - Role gaps
  - Synergy issues
  - Map pool weaknesses
- Measuring progress over time
- Evaluating roster changes

### 4. Match Prediction

- Foundation for the Match Predictor feature
- Win probability calculation based on TIR differential
- Key factor identification for potential match outcomes

## Technical Implementation

The TIR system is implemented across several key files:

- `server/teamAnalytics.ts`: Contains the core TIR calculation logic
- `server/storage.ts`: Handles persistent storage of team ratings
- `shared/schema.ts`: Defines the data structures for TIR
- `client/src/pages/MatchPredictorPage.tsx`: Utilizes TIR for predictions

## Future Enhancements

Planned improvements to the TIR system include:

1. **Opponent Strength Adjustment**: Contextualizing performance based on opponent quality
2. **Tournament Performance Weighting**: Giving more weight to performance in higher-tier events
3. **Roster Stability Factor**: Accounting for the impact of recent roster changes
4. **Mental Resilience Index**: Evaluating a team's ability to perform under pressure
5. **Dynamic Temporal Modeling**: Tracking form trends and projecting future performance