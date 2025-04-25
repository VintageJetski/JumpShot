# Match Predictor Documentation

## Overview

The Match Predictor is an AI-powered feature that analyzes CS2 team and player statistics to predict match outcomes. It uses a comprehensive statistical model that considers team ratings, player performances, map-specific statistics, and contextual factors to generate win probabilities and detailed insights.

## Key Features

### Match Setup
- Select any two teams to compare and predict outcomes
- Team statistics displayed: TIR (Team Impact Rating), Average PIV, Synergy, Map Win Rate
- Players are displayed in order of role importance: IGLs first, AWPers second, Spacetakers third/fourth, Lurkers and Supports last
- Team lineups show detailed role information with color-coded indicators (Blue for CT roles, Orange for T roles, Purple for IGL)

### Map Selection
- Choose from 6 standard CS2 maps in the current rotation: Mirage, Inferno, Nuke, Ancient, Anubis, Vertigo
- Support for both BO1 (single map) and BO3 (multiple maps) formats
- Multi-map selection for BO3 matches with numbered indicators for each map
- BO3 predictions show series outcome (2-0 or 2-1) based on team strength across all selected maps
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
- Visual representation of each team's win probability in a circular gauge
- Percentage values for each team with team names

### Predicted Score
- For BO1: Projected final score based on team strength and map characteristics (first to 13 rounds)
- For BO3: Projected series outcome (2-0 or 2-1) based on relative team strength

### Confidence Score
- Indicator of prediction confidence (0-100%)
- Based on statistical differentiation between teams and TIR difference
- Visualized with a progress bar

### Key Insights
- Automatically generated analytical insights about:
  - Team strengths (TIR comparison)
  - Role coverage advantages
  - Map-specific advantages
  - Key strategic factors

### Key Players to Watch
- Displays the most impactful players from each team
- Shows player role and PIV score
- Team affiliation indicated by team initials in a circular icon
- Sorted by potential match impact

## Technical Implementation

### Data Sources
- Player statistics from CS2 match data CSV files (IEM Katowice 2025 dataset)
- Team compositions and ratings based on aggregated player statistics
- T and CT side role assignments from dedicated role mapping CSV
- Map-specific historical performance
- Round-by-round data available but not currently utilized in predictions

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