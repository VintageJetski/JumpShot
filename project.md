# JumpShot CS2 Performance Analytics Platform
## Project Source of Truth

### Current Status: RESET & REBUILD PHASE
**Goal**: Build a fully functional CS2 analytics platform using existing Supabase data

### Architecture Overview
- **Frontend**: React.js 18+ with TypeScript, Framer Motion, Recharts
- **Backend**: Node.js/Express with TypeScript
- **Database**: Supabase (PostgreSQL) - READ ONLY, no modifications allowed
- **Authentication**: Session-based with role-based access
- **Real-time**: WebSocket connections for live updates

### Database Schema (Supabase)
**Tables Available**:
- `kill_stats` - Player kill metrics per event
- `general_stats` - Core performance metrics (K/D, ADR, KAST)
- `utility_stats` - Utility usage statistics
- `teams` - Team information
- `players` - Player profiles
- `player_match_summary` - Match participation records
- `rounds` - Round-by-round data
- `matches` - Match metadata
- `events` - Tournament/event information
- `player_history` - Team membership history

### Core Features to Implement

#### 1. Authentication System
- [x] Basic login/logout functionality
- [ ] Role-based access control
- [ ] Session management

#### 2. Player Analytics Dashboard
- [ ] PIV (Player Impact Value) calculation engine
- [ ] Role-based performance metrics
- [ ] Individual player profiles
- [ ] Performance trends and comparisons

#### 3. Team Analysis
- [ ] Team composition analysis
- [ ] Chemistry simulation
- [ ] Performance benchmarking
- [ ] Strategic insights

#### 4. Scout System
- [ ] Player search and filtering
- [ ] Performance projections
- [ ] Replacement recommendations
- [ ] Market value analysis

#### 5. Data Visualization
- [ ] Interactive charts and graphs
- [ ] Real-time performance dashboards
- [ ] Comparative analysis tools
- [ ] Export capabilities

### Technical Implementation Plan

#### Phase 1: Data Layer Foundation
1. **Supabase Integration**
   - Verify connection with provided secrets
   - Test data retrieval from all tables
   - Implement proper error handling
   - Create TypeScript interfaces for all data models

2. **PIV Calculation Engine**
   - Port existing PIV logic to work with Supabase schema
   - Implement role-specific metrics calculation
   - Add performance normalization
   - Create caching layer for expensive calculations

#### Phase 2: Core Features
1. **Player Dashboard**
   - Real player data visualization
   - Performance metrics display
   - Historical trend analysis
   - Role assignment and analysis

2. **Team Analysis**
   - Team roster management
   - Chemistry calculations
   - Performance benchmarking
   - Strategic recommendations

#### Phase 3: Advanced Features
1. **Scout System**
   - Advanced player search
   - Performance predictions
   - Market analysis tools
   - Replacement suggestions

2. **Data Export & Reporting**
   - PDF report generation
   - Data export capabilities
   - Custom analytics dashboards

### Current Issues to Address
1. **Teams mapping error** - ✅ Fixed: Added proper array checking
2. **Missing key props** - Need to fix in player lists
3. **Authentication system** - Current auth expects local "users" table that doesn't exist
4. **API routing** - Development server intercepting API endpoints
5. **Real data integration** - Supabase connection verified, need proper frontend integration

### Verified Working Components
- ✅ Supabase connection with real tournament data
- ✅ Professional player data (ZywOo, Team Vitality, etc.)
- ✅ Database queries returning authentic statistics
- ✅ 108 players across IEM Katowice 2025 and PGL Bucharest 2025

### Key Constraints
- **NO DATABASE MODIFICATIONS** - Read-only access only
- **NO MOCK DATA** - Use only real Supabase data
- **COMPLETE FEATURES** - No placeholder implementations
- **PROPER ERROR HANDLING** - All states must be handled

### Next Immediate Actions
1. Verify Supabase connection with new secrets
2. Test data retrieval from all tables
3. Fix remaining UI errors (keys, animations)
4. Implement proper loading and error states
5. Build complete PIV calculation with real data

### Success Criteria
- All features work with real Supabase data
- No TypeScript compilation errors
- Proper error handling throughout
- Responsive UI that handles all states
- Complete PIV calculations showing meaningful insights