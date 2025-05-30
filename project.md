# CS2 Analytics Platform - Complete Project Context

A revolutionary Counter-Strike 2 performance analytics ecosystem that transforms raw competitive match data into actionable intelligence through advanced statistical modeling and comprehensive visualization tools.

## CRITICAL PROJECT GUIDELINES

### Editor Behavior Requirements
- **ASK PERMISSION**: Never make changes without explicit user approval
- **READ-ONLY DATABASE**: Supabase database is strictly read-only - NO modifications allowed
- **AUTHENTIC DATA ONLY**: Use only real tournament data from IEM Katowice 2025 and PGL Bucharest 2025
- **FOLLOW PRD EXACTLY**: All features must match PRD specifications precisely
- **UI RESTORATION**: Restore from deployed version at https://csjumpshot.replit.app/ when needed
- **CLIENT-SIDE CALCULATIONS**: All PIV/TIR/RCS metrics calculated in browser, not server

### Authentication Credentials
- Username: Admin
- Password: @Jumpshot123

## CORE DATABASE STRUCTURE (SUPABASE - READ ONLY)

### Key Tables & Relationships
- **events**: Tournament information (IEM_Katowice_2025, PGL_Bucharest_2025)
- **teams**: Team details with event associations
- **players**: Player roster with steam_id as primary key
- **roles**: Critical for PIV - contains in_game_leader, t_role, ct_role
- **matches**: Match details linked to events and teams
- **player_match_summary**: Player performance per match
- **kill_stats**: Comprehensive kill metrics (headshots, wallbang_kills, etc.)
- **general_stats**: Core performance (adr, kast, rating_2_0, kd_ratio, etc.)
- **utility_stats**: Tactical utility effectiveness (flash_assists, utility_damage, etc.)

### Data Ingestion Pipeline
```
Supabase Database → Raw SQL Adapter → Client-Side Processing → PIV Calculation
```

## PIV CALCULATION SYSTEM (CLIENT-SIDE ONLY)

### Master Formula
```
PIV = (RCS × ICF × SC × OSM) + Basic_Metrics_Bonus + Situational_Modifiers + Map_Specific_Adjustments
```

### Components
- **RCS (Role Core Score)**: Role-specific performance metrics (0.0-1.0)
- **ICF (Individual Consistency Factor)**: Performance stability (0.0-2.0)
- **SC (Synergy Contribution)**: Team chemistry impact (0.0-1.0)
- **OSM (Opponent Strength Multiplier)**: Difficulty scaling (0.8-1.2)

### Role Definitions & Weights

#### T-Side Roles
- **Entry Fragger**: Opening kills (30%), Multi-kills (25%), Trade efficiency (20%)
- **Support**: Flash assists (35%), Trade kills (30%), Utility coordination (20%)
- **Lurker**: Information gathering (40%), Flank success (30%), Zone control (20%)
- **AWPer**: Pick efficiency (40%), Economic impact (25%), Map control (20%)
- **IGL**: Strategy wins (30%), Team coordination (25%), Adaptive calling (20%)

#### CT-Side Roles
- **Anchor**: Site holds (35%), Retakes (25%), Economic conservation (20%)
- **Rotator**: Rotation efficiency (40%), Adaptive defense (25%), Retake utility (20%)
- **Support**: Utility effectiveness (35%), Team backup (30%), Flash coordination (20%)
- **AWPer**: Pick efficiency (40%), Map control denial (25%), Economic impact (20%)

## TECHNOLOGY ARCHITECTURE

### Frontend
- React.js 18+ with TypeScript
- Framer Motion for animations
- Recharts for data visualization
- Wouter for routing
- TanStack Query for data fetching
- Shadcn/UI components with Tailwind CSS

### Backend
- Node.js/Express with TypeScript
- Session-based authentication
- Raw SQL adapter for Supabase queries
- RESTful API endpoints
- Real-time data processing

### Database Integration
- Supabase PostgreSQL (READ-ONLY)
- Raw SQL queries via adapter
- 24-hour data refresh cycles
- No database modifications allowed

## CORE FEATURES (FROM PRD)

### 1. Players Page
- Master player database with real-time PIV calculations
- Advanced filtering: role, team, event, PIV range
- Player cards with team-colored headers, role chips, PIV progress bars
- Search functionality with autocomplete
- Export capabilities

### 2. Teams Page
- Team Impact Rating (TIR) calculations
- Roster composition analysis
- Team synergy metrics
- Map pool analysis

### 3. Player Detail Page
- PIV timeline with component breakdown
- Performance radar charts
- Match-by-match performance grid
- Situational analysis (clutch, eco rounds)

### 4. Team Detail Page
- Roster management interface
- Tactical analysis dashboard
- Role distribution effectiveness
- Strategic intelligence

### 5. Scout Feature
- Advanced player discovery
- Performance prediction
- Market value assessment
- Skill ceiling estimation

## API ENDPOINTS

### Core Routes
- `GET /api/players` - All players with PIV calculations
- `GET /api/players/:steamId` - Individual player details
- `GET /api/teams` - Team listings with TIR scores
- `GET /api/teams/:teamId` - Team details with breakdowns
- `GET /api/analytics/roles` - Role-based analysis

### Authentication
- `POST /api/login` - User authentication
- `POST /api/logout` - Session termination
- `GET /api/user` - Current user info

## UI SPECIFICATIONS (RESTORE FROM DEPLOYED VERSION)

### Design Requirements
- Team-colored gradients for player cards
- Role chips with icons (T-side/CT-side roles)
- PIV display with progress bars
- Search and filter controls
- Interactive data visualizations
- Responsive grid layouts
- Dark theme with professional appearance

### Color Scheme
- Primary: Professional blue/purple gradients
- Team colors: Unique gradients per team
- Success: Green for positive metrics
- Warning: Orange for moderate performance
- Error: Red for negative indicators

## CURRENT IMPLEMENTATION STATUS

### Completed
- Supabase database with 161 players (81 IEM Katowice, 80 PGL Bucharest)
- Raw SQL adapter for data retrieval
- Authentication system
- Basic PIV calculation framework

### In Progress
- UI restoration to match deployed version
- Complete PIV calculation implementation
- Player card components with proper styling
- Data filtering and search functionality

### Priority Tasks
1. Restore original UI from deployed site
2. Fix data ingestion pipeline per PRD specifications
3. Implement complete PIV calculation system
4. Add role-based filtering and search

## TESTING & VALIDATION

### Data Integrity
- Validate PIV calculations against benchmarks
- Cross-reference role assignments with gameplay
- Ensure statistical accuracy across metrics
- Test with authentic tournament data only

### Performance Targets
- API response time: <500ms (95th percentile)
- Database queries: <100ms average
- System uptime: 99.9%
- PIV calculation accuracy: >95% correlation with expert analysis