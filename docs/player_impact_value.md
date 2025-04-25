# Player Impact Value (PIV) System Documentation

## Overview

The Player Impact Value (PIV) system is a comprehensive player rating model designed for CS2 that evaluates player performance based on their specific roles and playstyles. Unlike traditional statistics that focus solely on kills, deaths, and ADR, the PIV system uses a multi-dimensional approach to quantify a player's true impact on the game.

## Core Components

The PIV calculation is based on the following core components:

### 1. Role Core Score (RCS)

The Role Core Score measures how effectively a player performs in their assigned role based on role-specific metrics.

- **Calculation**: Weighted average of normalized role-specific metrics
- **Scale**: 0-1 (higher is better)
- **Role-specific metrics examples**:
  - **AWP**: Opening Pick Success Rate, Multi Kill Conversion, AWPer Flash Assistance
  - **IGL**: Strategic Success Rate, Utility Effectiveness, Team Performance Index
  - **Support**: Flash Assist Rate, Trade Kill Efficiency, Utility Usage Impact
  - **Lurker**: Isolated Kill Success, Map Control Value, Information Value
  - **Spacetaker**: Entry Success Rate, Space Creation Value, Trading Potential
  - **Anchor**: Site Hold Success, Multi-kill Potential, Defensive Utility Value
  - **Rotator**: Rotation Timing, Defensive Flexibility, Multi-site Impact

### 2. Individual Consistency Factor (ICF)

The Individual Consistency Factor measures a player's performance consistency across matches.

- **Calculation**: Based on statistical variance of key performance metrics across matches
- **Scale**: 0-1 (higher is more consistent)
- **Adjustments**: 
  - IGLs receive a consistency bonus to account for cognitive load
  - High-fragging players (like ZywOo) receive a K/D weight adjustment

### 3. Synergy Contribution (SC)

The Synergy Contribution measures how well a player enhances team performance.

- **Calculation**: Based on role-specific team contribution metrics
- **Scale**: 0-1 (higher means better contribution to team synergy)
- **Examples**:
  - **AWP**: AWP Impact Rating (combining kills, opening picks, and utility)
  - **IGL**: Strategic Value (team performance with/without player)
  - **Support**: Support Effectiveness (flash assists, trade success)

### 4. Opponent Strength Multiplier (OSM)

The Opponent Strength Multiplier adjusts ratings based on the quality of opposition.

- **Calculation**: Based on opponent team ranking and individual opponent skill
- **Default**: 1.0 (neutral)
- **Range**: 0.8-1.2 (lower for weaker opponents, higher for stronger opponents)

## PIV Formula

The final PIV calculation combines these components in a weighted formula:

```
PIV = (RCS * 0.35 + ICF * 0.25 + SC * 0.25) * OSM * RoleModifier * 2
```

Where:
- RCS = Role Core Score (0-1)
- ICF = Individual Consistency Factor (0-1)
- SC = Synergy Contribution (0-1)
- OSM = Opponent Strength Multiplier (typically 0.8-1.2)
- RoleModifier = Role-specific adjustment factor:
  - AWP: 0.90x
  - Support: 1.08x
  - IGL: 1.05x
  - Spacetaker: 1.03x
  - Other roles: 1.00x

The result is multiplied by 2 to create a more intuitive scale, with values typically ranging from 1.0 to 2.5.

## Side-specific PIV

The system calculates three PIV values for each player:

1. **Overall PIV**: The player's complete impact across all rounds
2. **CT-side PIV**: The player's impact on CT (Counter-Terrorist) side only
3. **T-side PIV**: The player's impact on T (Terrorist) side only

This allows for more nuanced analysis of player performance on different sides of the game.

## Role Assignment System

### Primary Role Detection

Players can have multiple roles:

1. **CT-side Role**: Role assigned for Counter-Terrorist side
2. **T-side Role**: Role assigned for Terrorist side
3. **IGL Role**: In-Game Leader (if applicable, overrides other roles)

For display purposes, the system determines the primary role using:
- For IGLs: Always displayed as IGL
- For non-IGLs: Determined by a weighted combination of CT and T roles (typically 50% CT / 50% T)

### Role Assignment Process

1. **Explicit Assignment**: Roles are assigned based on the roles CSV file when available
2. **Automatic Detection**: When no explicit role data is available, roles are automatically detected based on play patterns:
   - Statistical patterns (e.g., AWP kill percentage, entry attempt frequency)
   - Position heat maps
   - Utility usage patterns
   - Known team roles (only one IGL per team)

## Team Integration

The PIV system integrates with the Team Impact Rating (TIR) system:

1. **Individual PIV** feeds into team calculations
2. **Role Coverage** affects team synergy calculations
3. **Team Composition Analysis** uses PIV to identify optimal role combinations

## Display Format

- PIV values are displayed as whole numbers (e.g., 0.798 → 80)
- K/D ratios are shown to 2 decimal places
- Player icons show team initials instead of player's first initial

## Technical Implementation

The PIV system is implemented across several key files:

- `server/newPlayerAnalytics.ts`: Contains the core PIV calculation logic
- `server/roleParser.ts`: Handles role parsing from CSV data
- `server/playerAnalytics.ts`: Contains legacy PIV calculation for backward compatibility
- `shared/schema.ts`: Defines the data structures for PIV and related metrics

## Future Enhancements

Planned improvements to the PIV system include:

1. **Economy Impact Factor**: Measuring a player's economic impact and efficiency
2. **Clutch Performance Index**: Specialized rating for clutch situations
3. **Map-specific Role Adjustments**: Tailoring role evaluations to specific maps
4. **Mental State Analysis**: Incorporating signs of tilt or confidence
5. **Role Synergy Modeling**: Evaluating how well certain role combinations work together