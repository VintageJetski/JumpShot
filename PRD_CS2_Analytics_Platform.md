# CS2 Performance Analytics Platform - Product Requirements Document

## Overview
A comprehensive Counter-Strike 2 player and team performance analytics platform that transforms raw match data into actionable insights through advanced metrics, predictive modeling, and interactive visualizations.

## Core Technology Stack
- **Frontend**: React.js with TypeScript, Framer Motion, Recharts
- **Backend**: Node.js/Express with TypeScript
- **Database**: Supabase (PostgreSQL) as primary data source
- **Data Processing**: Real-time PIV calculations with role-based analytics
- **Authentication**: Built-in user management
- **Deployment**: Replit platform

## Database Schema (Supabase)

### Core Tables Structure

#### events
- `event_id` (Primary Key)
- `name` (e.g., "IEM_Katowice_2025")
- `start_date`
- `end_date`

#### teams
- `id` (Primary Key)
- `name`
- `logo_url`
- `event_id` (Foreign Key → events.event_id)

#### players
- `steam_id` (Primary Key, BIGINT)
- `user_name`
- `team_id` (Foreign Key → teams.id)
- `event_id` (Foreign Key → events.event_id)

#### roles
- `steam_id` (Foreign Key → players.steam_id)
- `in_game_leader` (BOOLEAN)
- `t_role` (TEXT: "Entry Fragger", "Support", "Lurker", "AWPer", "IGL")
- `ct_role` (TEXT: "Anchor", "Rotator", "Support", "AWPer", "IGL")

#### player_match_summary
- `steam_id` (Foreign Key → players.steam_id)
- `file_id` (Match identifier)
- `team_id` (Foreign Key → teams.id)
- `event_id` (Foreign Key → events.event_id)
- Combined Primary Key: (steam_id, file_id, event_id)

#### Statistical Tables (linked by steam_id)
- **kill_stats**: kills, headshots, wallbang_kills, no_scope, through_smoke, awp_kills, etc.
- **general_stats**: deaths, assists, adr, kast, rating, entry_kills, multi_kills, etc.
- **utility_stats**: flash_assists, he_damage, smoke_success, molotov_damage, etc.

## PIV (Player Impact Value) Calculation System

### Core Formula
```
PIV = (RCS × ICF × SC × OSM) + Basic_Metrics_Bonus
```

### Component Definitions

#### RCS (Role Core Score): 0.0-1.0
Measures how well a player performs their assigned role-specific responsibilities.

**Calculation Method**:
1. Extract role-specific metrics based on player's T and CT roles
2. Normalize metrics across all players (0-1 scale)
3. Apply role-specific weights
4. Calculate weighted average

#### ICF (Individual Consistency Factor): 0.0-2.0
Rewards consistent high performance while penalizing volatility.

**Formula**:
```
base_performance = sqrt(kills * adr) / (deaths + 1)
consistency_factor = 1 + min(kd_ratio * 0.3, 0.6)
icf = base_performance * consistency_factor
sigma = standard_deviation_factor (0.05-0.15)
```

#### SC (Synergy Contribution): 0.0-1.0
Role-specific contribution to team success.

**Metrics by Role**:
- **Entry Fragger**: Opening kill success rate, multi-kill rounds
- **Support**: Flash assists, trade kill efficiency
- **Lurker**: Information gathering, flank success
- **AWPer**: Pick efficiency, economy impact
- **IGL**: Team coordination metrics (when available)
- **Anchor**: Site hold success, retake efficiency
- **Rotator**: Rotation timing, adaptive positioning

#### OSM (Opponent Strength Multiplier): 0.8-1.2
Adjusts PIV based on opposition quality (future implementation).

### Role Weights and Metrics

#### T-Side Roles

**Entry Fragger**
- Opening Kill Success Rate (30%)
- Multi-Kill Rounds (25%)
- Trade Kill Efficiency (20%)
- Site Penetration Success (15%)
- Economy Impact (10%)

**Support**
- Flash Assist Efficiency (35%)
- Trade Kill Success (30%)
- Utility Coordination (20%)
- Team Setup Contribution (15%)

**Lurker**
- Information Gathering Efficiency (40%)
- Flank Success Rate (30%)
- Zone Influence Stability (20%)
- Delayed Timing Effectiveness (10%)

**AWPer**
- Pick Efficiency (40%)
- Economy Impact (25%)
- Map Control Contribution (20%)
- Long-Range Accuracy (15%)

**IGL (In-Game Leader)**
- Strategic Round Wins (30%)
- Team Coordination (25%)
- Adaptive Calling (20%)
- Economic Management (15%)
- Communication Effectiveness (10%)

#### CT-Side Roles

**Anchor**
- Site Hold Success Rate (35%)
- Retake Efficiency (25%)
- Economic Conservation (20%)
- Clutch Performance (20%)

**Rotator**
- Rotation Efficiency Index (40%)
- Adaptive Defense Score (25%)
- Retake Utility Coordination (20%)
- Anti-Execute Success (15%)

**Support**
- Utility Effectiveness (35%)
- Team Backup Success (30%)
- Flash Coordination (20%)
- Economic Support (15%)

**AWPer**
- Pick Efficiency (40%)
- Map Control Denial (25%)
- Economy Impact (20%)
- Long-Range Hold Success (15%)

## Feature Requirements

### 1. Player Analytics Dashboard
- **PIV Rankings**: Sortable list with role breakdowns
- **Individual Player Profiles**: Detailed metrics, role analysis, performance trends
- **Role Comparison**: Compare players within same role
- **Performance Trends**: Historical PIV evolution

### 2. Team Analytics
- **Team Impact Rating (TIR)**: Aggregate team performance
- **Role Distribution Analysis**: Team composition effectiveness
- **Synergy Metrics**: Inter-player cooperation scores
- **Strategic Analysis**: T/CT side performance breakdown

### 3. Advanced Analytics
- **Role Optimization**: Suggest optimal role assignments
- **Player Comparison Tool**: Side-by-side statistical analysis
- **Performance Prediction**: Match outcome forecasting
- **Meta Analysis**: Tournament-wide trends and insights

### 4. Scout Feature
- **Player Discovery**: Find players by role, performance metrics
- **Team Fit Analysis**: Evaluate player compatibility with existing teams
- **Market Value Assessment**: Performance-based player valuation
- **Transfer Recommendations**: Suggest optimal roster changes

### 5. Interactive Visualizations
- **Performance Charts**: PIV trends, role effectiveness over time
- **Team Chemistry Diagrams**: Visual synergy representations
- **Map-Specific Analytics**: Performance by map/position
- **Statistical Comparisons**: Interactive player/team comparisons

### 6. XYZ Positional Analytics (Advanced)
- **Movement Patterns**: Player positioning and rotation analysis
- **Map Control Visualization**: Territory influence mapping
- **Tactical Positioning**: Role-specific positioning effectiveness
- **Team Coordination Metrics**: Synchronized movement analysis

## Data Processing Pipeline

### 1. Data Ingestion
```
Supabase Database → Raw SQL Adapter → Data Transformation → PIV Calculation
```

### 2. Real-Time Processing
- Fetch player statistics from Supabase
- Join with role assignments using steam_id
- Calculate role-specific metrics
- Compute PIV components (RCS, ICF, SC, OSM)
- Return enriched player objects

### 3. Caching Strategy
- Cache calculated PIV values for performance
- Refresh data every 24 hours
- Real-time recalculation on demand

## API Endpoints

### Core Endpoints
```
GET /api/players - List all players with PIV calculations
GET /api/players/:steamId - Individual player details
GET /api/teams - Team listings with TIR scores
GET /api/teams/:teamId - Team details with player breakdowns
GET /api/analytics/roles - Role-based performance analysis
GET /api/scout/search - Player discovery with filters
```

### Authentication
```
POST /api/register - User registration
POST /api/login - User authentication
POST /api/logout - Session termination
GET /api/user - Current user info
```

## Implementation Phases

### Phase 1: Core Infrastructure
1. Clean Supabase database schema setup
2. Authentication system implementation
3. Basic player listing with PIV calculations
4. Role assignment integration

### Phase 2: Analytics Engine
1. Complete PIV calculation system
2. Team Impact Rating (TIR) implementation
3. Role-specific metric calculations
4. Performance comparison tools

### Phase 3: Advanced Features
1. Scout feature development
2. Interactive visualizations
3. Performance prediction models
4. XYZ positional analytics

### Phase 4: Polish & Optimization
1. Performance optimization
2. Advanced caching strategies
3. Real-time data updates
4. Mobile responsiveness

## Testing Strategy

### Data Integrity
- Validate PIV calculations against known benchmarks
- Cross-reference role assignments with actual gameplay
- Ensure statistical accuracy across all metrics

### Performance Testing
- Load testing with full dataset
- API response time optimization
- Frontend rendering performance

### User Acceptance
- Analytics accuracy validation with CS2 experts
- Interface usability testing
- Feature completeness verification

## Success Metrics

### Technical KPIs
- PIV calculation accuracy (>95%)
- API response times (<500ms)
- Data refresh reliability (99.9% uptime)

### User Experience KPIs
- Analytics insight accuracy
- User engagement with features
- Performance prediction reliability

## Documentation Requirements

### Technical Documentation
- Database schema documentation
- API endpoint specifications
- PIV calculation methodology
- Deployment procedures

### User Documentation
- Feature usage guides
- Analytics interpretation help
- Role optimization strategies
- Performance improvement recommendations

## Future Enhancements

### Advanced Analytics
- Machine learning performance prediction
- Real-time match analysis
- Advanced team chemistry modeling
- Meta-game trend analysis

### Integration Possibilities
- Steam Workshop integration
- Third-party tournament data
- Professional team partnerships
- Community-driven analytics

---

This PRD serves as the foundation for rebuilding the CS2 Analytics Platform with proper Supabase integration, ensuring clean architecture, accurate calculations, and scalable feature development.