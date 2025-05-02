# JumpShot Documentation

Welcome to the documentation for JumpShot. This comprehensive suite of tools is designed to analyze Counter-Strike 2 player and team performance using advanced metrics and AI-powered predictions.

## Core Features

### Player Analysis System
- [Player Impact Value (PIV) System](player_impact_value.md)
- Player Role Detection and Assignment
- Player Comparison Tools
- Performance Tracking and Visualization

### Team Analysis System
- [Team Impact Rating (TIR) System](team_impact_rating.md)
- Role Coverage and Team Composition Analysis
- Synergy Evaluation
- Map Performance Analysis

### Prediction Tools
- [Match Predictor](match_predictor.md)
- Tournament Progression Simulation
- Player Performance Forecasting

## Data Sources

The platform uses several data sources:

1. **Match Data CSV Files**
   - Player statistics from multiple tournaments (IEM Katowice 2025, PGL Bucharest 2025)
   - Round-by-round data
   - Map-specific performance metrics

2. **Role Assignment Data**
   - Player role definitions
   - Team composition information
   - T and CT side role assignments

3. **Metric Weights Configuration**
   - Role-specific metric importance weights
   - Performance evaluation parameters

For detailed information on data upload and processing, see [Data Upload and Processing](data_upload.md).

## Technical Architecture

The platform is built using:

- React.js with TypeScript for the frontend
- Express.js for the backend API
- PostgreSQL with Drizzle ORM for data persistence
- Advanced data visualization using Recharts
- Real-time updates and interactive UI components

## Getting Started

To start using the platform:

1. Navigate to the main dashboard to see an overview of all features
2. Use the sidebar to access specific tools:
   - Player Rankings
   - Team Analysis
   - Match Predictor
   - Performance Metrics

## Feature Roadmap

Upcoming features and improvements:

- Live match data integration
- Machine learning-based prediction refinements
- Mobile-optimized interface
- Advanced tournament analysis tools
- Custom metric creation tools