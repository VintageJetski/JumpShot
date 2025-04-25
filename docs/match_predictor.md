# Match Predictor Documentation

## Overview

The Match Predictor is an AI-powered feature that analyzes CS2 team and player statistics to predict match outcomes. It uses a comprehensive statistical model that considers team ratings, player performances, map-specific statistics, and contextual factors to generate win probabilities and detailed insights.

## Key Features

### Match Setup
- Select any two teams to compare and predict outcomes
- Team statistics displayed: TIR (Team Impact Rating), Average PIV, Synergy, Map Win Rate
- Key players are automatically identified for each team

### Map Selection
- Choose from 7 standard CS2 maps: Mirage, Inferno, Nuke, Ancient, Anubis, Overpass, Vertigo
- Map-specific performance statistics are factored into predictions
- Visual comparison of map performance for both teams available in the Map Stats dialog

### Contextual Factors
The following contextual factors can be adjusted to refine predictions:

1. **Recent Form** (0-100 scale)
   - Adjust to favor teams with better recent match results
   - Default: 50 (neutral)

2. **Head-to-Head History** (0-100 scale)
   - Adjust based on previous encounters between the two teams
   - Default: 50 (neutral)

3. **Map Selection Advantage** (0-100 scale)
   - Adjust based on which team had more control of the map selection process
   - Default: 50 (neutral)

4. **Tournament Tier** (0-100 scale)
   - Adjust based on tournament significance (S-Tier Major to C-Tier)
   - Values:
     - 75-100: S-Tier Major
     - 50-75: A-Tier
     - 25-50: B-Tier
     - 0-25: C-Tier
   - Default: 50 (Mid Tier)

### Advanced Options
The following toggles enable additional predictive factors:

1. **Psychology Factors**
   - Incorporates team morale, pressure handling, and momentum factors
   - Default: Enabled

2. **Tournament Context**
   - Factors in tournament stage, stakes, and team experience
   - Default: Enabled

3. **Role-specific Matchups**
   - Analyzes player-to-player matchups based on their roles
   - Default: Enabled

## Prediction Output

### Win Probability
- Visual representation of each team's win probability
- Percentage values for each team

### Predicted Score
- Projected final score based on team strength and map characteristics

### Confidence Score
- Indicator of prediction confidence (0-100%)
- Based on statistical differentiation between teams

### Key Factors
- Detailed comparison of core predictive metrics for both teams:
  - Team Impact Rating (TIR)
  - Average PIV (Player Impact Value)
  - Team Synergy
  - Map Win Rate
  - Role Coverage

### Match Insights
- Automatically generated analytical insights about:
  - Team strengths
  - Map advantages
  - Key players to watch
  - Prediction summary

## Technical Implementation

### Data Sources
- Player statistics from CS2 match data CSV files
- Team compositions and ratings
- Role assignments and performance metrics
- Map-specific historical performance

### Prediction Algorithm
The prediction algorithm uses the following process:

1. Calculates base win probability using weighted core factors:
   - Team Impact Rating (30% weight)
   - Average PIV (15% weight)
   - Team Synergy (20% weight)
   - Map Win Rate (20% weight)
   - Role Coverage (15% weight)

2. Applies adjustment factors:
   - Recent Form
   - Head-to-Head History
   - Map Selection Advantage
   - Tournament Tier

3. Calculates confidence score based on:
   - TIR difference between teams
   - Probability skew from 50/50
   
4. Predicts score based on win probability model

5. Identifies key players based on:
   - PIV (Player Impact Value)
   - Role effectiveness on selected map
   - Performance consistency

## Usage Tips

- The prediction model is most accurate when both teams have played several matches in the database
- Advanced options improve prediction accuracy but require more computational resources
- Tournament Tier has a significant impact on predictions, as performance varies by event importance
- Compare map performances to identify potential veto strategies
- Key player insights can help identify which players to focus on when watching matches

## Future Improvements

- Integration with live match data feeds
- Historical accuracy tracking
- User-customizable weight adjustments
- Integration with third-party CS2 match APIs
- Round-by-round prediction for live matches