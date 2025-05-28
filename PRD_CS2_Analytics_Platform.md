# CS2 Performance Analytics Platform - Complete Product Requirements Document
## Comprehensive Technical Specification & Feature Documentation

### PLATFORM OVERVIEW
A revolutionary Counter-Strike 2 performance analytics ecosystem that transforms raw competitive match data into actionable intelligence through advanced statistical modeling, machine learning algorithms, and comprehensive visualization tools. The platform serves professional teams, coaches, analysts, scouts, and esports organizations with deep insights into player performance, team dynamics, match prediction, and strategic optimization.

### CORE TECHNOLOGY ARCHITECTURE
- **Frontend Framework**: React.js 18+ with TypeScript, Framer Motion animations, Recharts visualization library
- **Backend Infrastructure**: Node.js/Express server with TypeScript, real-time WebSocket connections
- **Primary Database**: Supabase (PostgreSQL) with complete relational schema and foreign key constraints
- **Authentication System**: Session-based authentication with role-based access control
- **Data Processing Engine**: Real-time PIV calculation system with role-specific metric evaluation
- **Deployment Platform**: Replit with automatic scaling and monitoring
- **API Architecture**: RESTful endpoints with comprehensive error handling and data validation

## COMPREHENSIVE DATABASE SCHEMA (SUPABASE POSTGRESQL)

### CORE RELATIONAL STRUCTURE

#### events Table
- event_id (SERIAL PRIMARY KEY)
- name (VARCHAR, e.g., "IEM_Katowice_2025", "PGL_Bucharest_2025")
- start_date (TIMESTAMP)
- end_date (TIMESTAMP)
- location (VARCHAR)
- prize_pool (DECIMAL)
- tier (VARCHAR: "S-Tier", "A-Tier", "B-Tier")
- status (VARCHAR: "upcoming", "ongoing", "completed")

#### teams Table  
- id (SERIAL PRIMARY KEY)
- name (VARCHAR)
- logo_url (TEXT)
- country (VARCHAR)
- region (VARCHAR: "EU", "NA", "CIS", "ASIA", "OCE", "SA")
- world_ranking (INTEGER)
- event_id (INTEGER FOREIGN KEY → events.event_id)
- coach_name (VARCHAR)
- organization (VARCHAR)

#### players Table
- steam_id (BIGINT PRIMARY KEY)
- user_name (VARCHAR)
- real_name (VARCHAR)
- country (VARCHAR)
- age (INTEGER)
- team_id (INTEGER FOREIGN KEY → teams.id)
- event_id (INTEGER FOREIGN KEY → events.event_id)
- is_active (BOOLEAN DEFAULT true)
- primary_weapon_preference (VARCHAR: "rifle", "awp", "hybrid")

#### roles Table (CRITICAL FOR PIV CALCULATIONS)
- steam_id (BIGINT FOREIGN KEY → players.steam_id)
- in_game_leader (BOOLEAN DEFAULT false)
- t_role (VARCHAR: "Entry Fragger", "Support", "Lurker", "AWPer", "IGL")
- ct_role (VARCHAR: "Anchor", "Rotator", "Support", "AWPer", "IGL")
- secondary_awp (BOOLEAN DEFAULT false)
- role_flexibility_score (DECIMAL 0.0-1.0)

#### matches Table
- file_id (INTEGER PRIMARY KEY)
- event_id (INTEGER FOREIGN KEY → events.event_id)
- team1_id (INTEGER FOREIGN KEY → teams.id)
- team2_id (INTEGER FOREIGN KEY → teams.id)
- map_name (VARCHAR)
- match_date (TIMESTAMP)
- winner_team_id (INTEGER FOREIGN KEY → teams.id)
- team1_score (INTEGER)
- team2_score (INTEGER)
- match_type (VARCHAR: "group", "playoff", "final")
- overtime_rounds (INTEGER DEFAULT 0)

#### player_match_summary Table
- steam_id (BIGINT FOREIGN KEY → players.steam_id)
- file_id (INTEGER FOREIGN KEY → matches.file_id)
- team_id (INTEGER FOREIGN KEY → teams.id)
- event_id (INTEGER FOREIGN KEY → events.event_id)
- PRIMARY KEY (steam_id, file_id, event_id)

#### rounds Table (DETAILED ROUND-BY-ROUND DATA)
- id (SERIAL PRIMARY KEY)
- file_id (INTEGER FOREIGN KEY → matches.file_id)
- round_num (INTEGER)
- start_tick (INTEGER)
- freeze_end_tick (INTEGER)
- end_tick (INTEGER)
- official_end_tick (INTEGER)
- winner_side (VARCHAR: "T", "CT")
- reason (VARCHAR: "elimination", "bomb_exploded", "bomb_defused", "time")
- bomb_plant_tick (INTEGER)
- bomb_site (VARCHAR: "A", "B")
- ct_team_clan_name (VARCHAR)
- t_team_clan_name (VARCHAR)
- winner_clan_name (VARCHAR)
- ct_team_current_equip_value (DECIMAL)
- t_team_current_equip_value (DECIMAL)
- ct_losing_streak (INTEGER)
- t_losing_streak (INTEGER)
- ct_buy_type (VARCHAR: "eco", "force", "full", "mixed")
- t_buy_type (VARCHAR: "eco", "force", "full", "mixed")
- advantage_5v4 (VARCHAR)
- event_id (INTEGER)
- match_name (VARCHAR)

### STATISTICAL DATA TABLES

#### kill_stats Table (COMPREHENSIVE KILL METRICS)
- steam_id (BIGINT FOREIGN KEY → players.steam_id)
- kills (INTEGER)
- deaths (INTEGER)
- headshots (INTEGER)
- headshot_percentage (DECIMAL)
- wallbang_kills (INTEGER)
- no_scope_kills (INTEGER)
- through_smoke_kills (INTEGER)
- airborne_kills (INTEGER)
- blind_kills (INTEGER)
- victim_blind_kills (INTEGER)
- awp_kills (INTEGER)
- pistol_kills (INTEGER)
- rifle_kills (INTEGER)
- smg_kills (INTEGER)
- first_kills (INTEGER)
- last_kills (INTEGER)
- trade_kills (INTEGER)
- multi_kill_rounds (INTEGER)
- ace_rounds (INTEGER)
- clutch_kills (INTEGER)
- opening_kills (INTEGER)
- opening_deaths (INTEGER)
- opening_kill_rating (DECIMAL)

#### general_stats Table (CORE PERFORMANCE METRICS)
- steam_id (BIGINT FOREIGN KEY → players.steam_id)
- rounds_played (INTEGER)
- assists (INTEGER)
- adr (DECIMAL) -- Average Damage per Round
- kast (DECIMAL) -- Kill/Assist/Survive/Trade percentage
- rating_1_0 (DECIMAL) -- HLTV 1.0 Rating
- rating_2_0 (DECIMAL) -- HLTV 2.0 Rating
- kd_ratio (DECIMAL)
- adr_per_death (DECIMAL)
- survival_rate (DECIMAL)
- round_impact_rating (DECIMAL)
- entry_kills (INTEGER)
- entry_deaths (INTEGER)
- entry_success_rate (DECIMAL)
- multi_kills (INTEGER)
- clutch_wins (INTEGER)
- clutch_attempts (INTEGER)
- clutch_success_rate (DECIMAL)
- save_rate (DECIMAL)
- first_death_rate (DECIMAL)
- rounds_with_multiple_kills (INTEGER)
- damage_per_round (DECIMAL)
- utility_damage (DECIMAL)
- total_damage (INTEGER)

#### utility_stats Table (TACTICAL UTILITY EFFECTIVENESS)
- steam_id (BIGINT FOREIGN KEY → players.steam_id)
- flash_assists (INTEGER)
- flash_success_rate (DECIMAL)
- flash_duration_per_assist (DECIMAL)
- he_damage (INTEGER)
- he_kills (INTEGER)
- he_multi_damage_rounds (INTEGER)
- smoke_success_rate (DECIMAL)
- smoke_lineup_accuracy (DECIMAL)
- molotov_damage (INTEGER)
- molotov_kills (INTEGER)
- molotov_multi_damage_rounds (INTEGER)
- decoy_assists (INTEGER)
- utility_kills (INTEGER)
- utility_damage_per_round (DECIMAL)
- team_flash_rate (DECIMAL)
- enemy_flash_rate (DECIMAL)
- utility_usage_efficiency (DECIMAL)
- nade_damage_ratio (DECIMAL)
- flash_per_round (DECIMAL)
- smoke_per_round (DECIMAL)
- he_per_round (DECIMAL)
- molotov_per_round (DECIMAL)

#### positional_stats Table (XYZ COORDINATE ANALYSIS)
- steam_id (BIGINT FOREIGN KEY → players.steam_id)
- file_id (INTEGER FOREIGN KEY → matches.file_id)
- round_num (INTEGER)
- tick (INTEGER)
- x_coordinate (DECIMAL)
- y_coordinate (DECIMAL)
- z_coordinate (DECIMAL)
- view_angle_x (DECIMAL)
- view_angle_y (DECIMAL)
- velocity (DECIMAL)
- is_alive (BOOLEAN)
- current_weapon (VARCHAR)
- armor_value (INTEGER)
- health (INTEGER)
- money (INTEGER)
- side (VARCHAR: "T", "CT")
- area_name (VARCHAR)
- site_proximity (VARCHAR: "A", "B", "mid", "connector")

#### economic_stats Table (ECONOMY MANAGEMENT METRICS)
- steam_id (BIGINT FOREIGN KEY → players.steam_id)
- total_money_earned (INTEGER)
- total_money_spent (INTEGER)
- equipment_value_destroyed (INTEGER)
- equipment_value_lost (INTEGER)
- eco_round_performance (DECIMAL)
- force_buy_performance (DECIMAL)
- full_buy_performance (DECIMAL)
- save_success_rate (DECIMAL)
- weapon_upgrade_efficiency (DECIMAL)
- utility_investment_roi (DECIMAL)

## COMPLETE PIV (PLAYER IMPACT VALUE) MATHEMATICAL FRAMEWORK

### FUNDAMENTAL CALCULATION ARCHITECTURE
PIV represents the most comprehensive player evaluation metric in competitive Counter-Strike 2 analytics, incorporating role-specific performance, individual consistency, team synergy contribution, and contextual factors.

**Master Formula:**
```
PIV = (RCS × ICF × SC × OSM) + Basic_Metrics_Bonus + Situational_Modifiers + Map_Specific_Adjustments
Where:
- RCS = Role Core Score (0.0 to 1.0)
- ICF = Individual Consistency Factor (0.0 to 2.0) 
- SC = Synergy Contribution (0.0 to 1.0)
- OSM = Opponent Strength Multiplier (0.8 to 1.2)
- Basic_Metrics_Bonus = Fundamental statistical performance bonus (0.0 to 0.5)
- Situational_Modifiers = Context-based adjustments (-0.2 to +0.3)
- Map_Specific_Adjustments = Map performance variance (-0.1 to +0.1)
```

### DETAILED COMPONENT BREAKDOWN

#### RCS (ROLE CORE SCORE) - COMPREHENSIVE SPECIFICATION

**Mathematical Foundation:**
RCS = Σ(metric_value × role_weight × normalization_factor) / total_role_weights

**T-SIDE ROLE DEFINITIONS & WEIGHTINGS:**

**ENTRY FRAGGER (T-Side Primary Initiator)**
Role Responsibility: First contact engagement, site execution leadership, creating space for team advancement

Metric Calculations:
- Opening Kill Success Rate: (opening_kills / opening_duels) × 100
  Weight: 30% | Calculation: opening_kills / (opening_kills + opening_deaths)
- Multi-Kill Rounds: rounds with 2+ kills / total_rounds
  Weight: 25% | Threshold: 2+ kills per round minimum
- Trade Kill Efficiency: successful_trades / total_trade_opportunities  
  Weight: 20% | Window: within 5 seconds of teammate death
- Site Penetration Success: successful_site_entries / total_site_attempts
  Weight: 15% | Defined as surviving first 10 seconds on site
- Economy Impact: damage_per_dollar_invested / team_average
  Weight: 10% | Equipment value efficiency metric

**SUPPORT (T-Side Utility Coordinator)**
Role Responsibility: Utility deployment, teammate assistance, trade fragging, tactical setup

Metric Calculations:
- Flash Assist Efficiency: effective_flashes / total_flashes_thrown
  Weight: 35% | Effective = enemy blinded for 1.5+ seconds resulting in team advantage
- Trade Kill Success: trade_kills / teammate_deaths_within_trade_window
  Weight: 30% | Window: 8 seconds maximum
- Utility Coordination Score: utility_multikills + utility_assists / utility_usage
  Weight: 20% | Multi-person utility effectiveness
- Team Setup Contribution: rounds_with_teammate_setup_kill / rounds_with_utility_usage
  Weight: 15% | Assists leading to teammate eliminations

**LURKER (T-Side Information & Flanking Specialist)**
Role Responsibility: Information gathering, flanking maneuvers, late-round impact, map control

Metric Calculations:
- Information Gathering Efficiency: enemy_positions_spotted / rounds_alive_behind_enemy_lines
  Weight: 40% | Requires positional data analysis
- Flank Success Rate: successful_flanks / total_flank_attempts
  Weight: 30% | Success = elimination or significant positional advantage
- Zone Influence Stability: consistent_map_control_areas / total_rounds
  Weight: 20% | Areas under player influence for 30+ seconds
- Delayed Timing Effectiveness: late_round_eliminations / late_round_opportunities  
  Weight: 10% | Eliminations after 1:30 round time

**AWPER (T-Side Precision Marksman)**
Role Responsibility: Long-range eliminations, pick generation, map control establishment, economic impact

Metric Calculations:
- Pick Efficiency: awp_kills / awp_shots_fired
  Weight: 40% | Primary weapon effectiveness
- Economy Impact: (equipment_value_destroyed - equipment_value_lost) / rounds_with_awp
  Weight: 25% | Net economic advantage generated
- Map Control Contribution: areas_cleared_with_awp / total_awp_rounds
  Weight: 20% | Map space creation through positioning threat
- Long-Range Accuracy: kills_beyond_1500_units / shots_beyond_1500_units
  Weight: 15% | Distance-based precision metric

**IGL (IN-GAME LEADER - T-SIDE TACTICAL COMMANDER)**
Role Responsibility: Strategic calling, team coordination, economic management, adaptive decision-making

Metric Calculations:
- Strategic Round Wins: called_strategy_success_rate
  Weight: 30% | Requires manual strategy tagging or pattern recognition
- Team Coordination Score: team_execution_efficiency during_called_rounds
  Weight: 25% | Team performance variance under leadership
- Adaptive Calling Effectiveness: mid_round_call_success_rate
  Weight: 20% | Strategy adjustments during round execution  
- Economic Management: team_economy_efficiency / league_average
  Weight: 15% | Buy round optimization and force/eco decisions
- Communication Impact: team_adr_boost_during_igl_alive vs igl_dead
  Weight: 10% | Quantifiable communication value

**CT-SIDE ROLE DEFINITIONS & WEIGHTINGS:**

**ANCHOR (CT-Side Site Specialist)**
Role Responsibility: Site defense, solo holds, retake coordination, economic preservation

Metric Calculations:
- Site Hold Success Rate: rounds_held_solo / rounds_defending_solo
  Weight: 35% | 1vX defensive success rate
- Retake Efficiency: successful_retakes / retake_attempts
  Weight: 25% | Post-plant recapture success
- Economic Conservation: equipment_preserved / total_equipment_value
  Weight: 20% | Gear retention in losing rounds
- Clutch Performance: clutch_wins / clutch_attempts (minimum 1v2)
  Weight: 20% | High-pressure situation success

**ROTATOR (CT-Side Adaptive Defender)**
Role Responsibility: Map rotation, backup support, flexible positioning, anti-execute defense

Metric Calculations:
- Rotation Efficiency Index: successful_rotations / total_rotation_calls
  Weight: 40% | Timing and positioning effectiveness
- Adaptive Defense Score: multi_site_impact_rounds / total_rounds
  Weight: 25% | Cross-map influence capability
- Retake Utility Coordination: utility_effectiveness_in_retakes / retake_attempts
  Weight: 20% | Tactical utility deployment in recapture scenarios
- Anti-Execute Success: stopped_executes / total_executes_faced
  Weight: 15% | Defense against coordinated T-side attacks

**SUPPORT (CT-Side Utility Specialist)**
Role Responsibility: Utility deployment, teammate assistance, flexible positioning, economy management

Metric Calculations:
- Utility Effectiveness: utility_damage + utility_assists / utility_items_used
  Weight: 35% | Overall utility impact efficiency
- Team Backup Success: teammate_assist_rate / rounds_with_backup_opportunity
  Weight: 30% | Support provision effectiveness
- Flash Coordination: team_flash_assists / team_flash_attempts
  Weight: 20% | Coordinated utility usage
- Economic Support: economy_sharing_efficiency + gear_distribution_effectiveness
  Weight: 15% | Team resource optimization

**AWPER (CT-Side Long-Range Defender)**
Role Responsibility: Long-range elimination, pick generation, map control denial, economic efficiency

Metric Calculations:
- Pick Efficiency: awp_kills / awp_shots_fired
  Weight: 40% | Primary weapon effectiveness
- Map Control Denial: t_side_map_control_prevented / total_defensive_rounds
  Weight: 25% | Territorial denial through positioning
- Economy Impact: (equipment_value_destroyed - equipment_value_lost) / rounds_with_awp
  Weight: 20% | Net economic advantage
- Long-Range Hold Success: long_range_duels_won / long_range_duels_attempted
  Weight: 15% | Distance engagement effectiveness

#### ICF (INDIVIDUAL CONSISTENCY FACTOR) - ADVANCED CALCULATION

**Mathematical Framework:**
```
Base Performance = sqrt(kills × adr) / (deaths + 1)
Consistency Multiplier = 1 + min(kd_ratio × 0.3, 0.6) + stability_bonus
ICF = Base_Performance × Consistency_Multiplier × performance_variance_adjustment
Performance Variance = standard_deviation(round_ratings) / mean(round_ratings)
Stability Bonus = max(0, 0.2 - Performance_Variance)
```

**Detailed Components:**
- Kill Efficiency Integration: Combines elimination count with damage output
- Death Penalty Mitigation: Reduces impact of unavoidable deaths
- Consistency Reward System: Bonuses for sustained performance levels
- Volatility Punishment: Penalties for inconsistent round-to-round performance
- Situational Adjustment: Context-based performance evaluation

#### SC (SYNERGY CONTRIBUTION) - TEAM CHEMISTRY QUANTIFICATION

**Core Philosophy:**
Measures individual contribution to team success beyond personal statistics, focusing on enablement of teammate performance and tactical execution effectiveness.

**Role-Specific SC Calculations:**

**Entry Fragger SC Metrics:**
- Teammate Setup Rating: eliminations_enabled / successful_entries
- Space Creation Value: team_follow_up_success_rate / total_entries
- Information Provision: callout_accuracy × callout_frequency
- Trade Facilitation: teammate_trade_opportunities_created / deaths

**Support SC Metrics:**
- Enablement Efficiency: teammate_performance_boost_with_support / without_support
- Utility Synergy: coordinated_utility_success_rate
- Backup Effectiveness: teammate_survival_rate_with_backup / solo_survival_rate
- Economic Facilitation: team_economy_improvement_through_support_plays

**Lurker SC Metrics:**
- Information Value: enemy_rotations_caused / information_callouts
- Timing Coordination: team_execute_success_with_lurker_presence / without_presence
- Pressure Generation: enemy_players_committed_to_lurker_watch / rounds_lurking
- Late Round Synergy: teammate_clutch_success_with_lurker_alive / dead

**AWPer SC Metrics:**
- Pick Impact on Team: team_round_win_rate_after_awp_pick / overall_win_rate
- Space Control Synergy: teammate_map_control_efficiency_with_awp_presence
- Economic Team Impact: team_economy_boost_from_awp_picks
- Psychological Pressure: enemy_team_strategic_adjustments_due_to_awp

**IGL SC Metrics:**
- Strategy Execution: team_performance_on_called_strategies / default_strategies
- Mid-Round Adaptation: team_comeback_rate_with_mid_round_calls
- Player Optimization: individual_player_performance_improvement_under_leadership
- Tactical Innovation: unique_strategy_success_rate / standard_strategy_success_rate

#### OSM (OPPONENT STRENGTH MULTIPLIER) - CONTEXTUAL DIFFICULTY SCALING

**Calculation Framework:**
```
Base OSM = 1.0
Team Ranking Adjustment = (opponent_world_ranking / 30) × 0.1
Recent Form Adjustment = opponent_recent_match_performance × 0.05
Map Proficiency Adjustment = opponent_map_win_rate × 0.05
Final OSM = Base_OSM + Team_Ranking_Adjustment + Recent_Form_Adjustment + Map_Proficiency_Adjustment
Bounds: min(0.8, max(1.2, Final_OSM))
```

**Detailed Adjustment Factors:**
- World Ranking Integration: HLTV or equivalent ranking system impact
- Recent Performance Weighting: Last 10 matches performance consideration
- Map-Specific Strength: Opponent proficiency on current map
- Head-to-Head Historical: Previous encounter performance adjustments
- Tournament Context: Major vs. minor event performance scaling

## COMPREHENSIVE FEATURE SPECIFICATION

### 1. PLAYERS PAGE - COMPLETE ANALYTICS DASHBOARD

**Core Functionality:**
- Master player database with real-time PIV calculations from Supabase
- Advanced filtering system: role, team, event, PIV range, performance metrics
- Sortable columns: PIV, RCS, ICF, SC, K/D, ADR, Rating 2.0, KAST
- Role-based color coding and visual hierarchy
- Search functionality with autocomplete and fuzzy matching
- Export capabilities for CSV, PDF reports

**Player Card Components:**
- Primary role display with T-side and CT-side role breakdown
- PIV score with component breakdown (RCS, ICF, SC, OSM)
- Key performance metrics: ADR, K/D, KAST, Rating 2.0
- Recent form indicator (last 5 matches performance trend)
- Team affiliation with logo and current event participation
- Quick action buttons: detailed view, comparison queue, scout evaluation

**Advanced Features:**
- Performance heat map visualization per player card
- Role effectiveness indicators with percentile rankings
- Interactive tooltips showing metric definitions and calculations
- Batch comparison selection (up to 6 players simultaneously)
- Performance prediction indicators based on recent trends
- Social sharing capabilities for player achievements

### 2. TEAMS PAGE - COMPREHENSIVE TEAM ANALYTICS

**Team Overview Section:**
- Team Impact Rating (TIR) calculation and display
- Roster composition with role distribution visualization
- Team synergy metrics and chemistry indicators
- Recent match results and upcoming fixtures
- World ranking and regional standing
- Coach information and organizational details

**Team Performance Analytics:**
- Aggregate PIV distributions across team members
- Role effectiveness analysis with strength/weakness identification
- Map pool analysis with win rates and preferred strategies
- Economic efficiency metrics and buy round success rates
- Team coordination scores based on synchronized plays
- Historical performance trends over time periods

**Individual Player Integration:**
- Player PIV contributions to overall TIR
- Role synergy compatibility analysis between players
- Individual vs. team performance correlation metrics
- Substitute and backup player evaluation
- Player development tracking over time
- Transfer market value assessment

**Strategic Analysis:**
- T-side and CT-side tactical preferences
- Anti-stratting effectiveness and adaptability
- Clutch round performance and high-pressure situations
- Comeback potential and mental resilience indicators
- Tournament-specific performance variations

### 3. PLAYER DETAIL PAGE - COMPREHENSIVE INDIVIDUAL ANALYSIS

**Performance Overview Dashboard:**
- PIV timeline with interactive hover details
- Component breakdown visualization (RCS, ICF, SC, OSM)
- Performance radar chart comparing to role averages
- Match-by-match performance grid with contextual information
- Career highlights and achievement timeline
- Performance comparison against top players in same role

**Advanced Metrics Section:**
- Detailed role-specific performance breakdown
- Situational performance analysis (clutch, eco, force-buy rounds)
- Map-specific performance variations with heat maps
- Weapon proficiency analysis and preferred loadouts
- Positioning analysis with movement patterns (XYZ data integration)
- Economic impact assessment and team contribution metrics

**Historical Analysis:**
- Performance evolution tracking over career
- Team performance correlation when player active vs. inactive
- Head-to-head matchup analysis against specific opponents
- Tournament performance variations and pressure handling
- Injury/break impact on performance metrics
- Skill development progression in specific areas

**Predictive Analytics:**
- Future performance projections based on current trends
- Optimal role assignment recommendations
- Team fit analysis for potential transfers
- Skill ceiling estimation and development potential
- Market value projection and contract optimization
- Performance sustainability indicators

### 4. TEAM DETAIL PAGE - DEEP TEAM ANALYSIS

**Roster Management Interface:**
- Current active roster with detailed player cards
- Substitute and backup player information
- Role assignment optimization suggestions
- Player chemistry matrix with compatibility scores
- Performance impact analysis of lineup changes
- Contract status and transfer market information

**Tactical Analysis Dashboard:**
- Strategy execution effectiveness by game phase
- Map pool strengths and weaknesses with detailed breakdowns
- Economic management efficiency across different scenarios
- Retake and anti-eco success rates with tactical breakdowns
- Coordination metrics and team play effectiveness
- Adaptation analysis against different opponent styles

**Performance Metrics:**
- Aggregate team statistics with individual contributions
- Role distribution effectiveness and balance analysis
- Team communication effectiveness (when data available)
- Pressure situation performance (important rounds, tournaments)
- Consistency metrics and performance variance analysis
- Opponent-specific performance variations

**Strategic Intelligence:**
- Anti-strat susceptibility analysis
- Tactical innovation tracking and meta adaptation
- Practice effectiveness correlation with match performance
- Coach impact analysis on team performance metrics
- Leadership influence measurement (IGL vs. other callers)
- Mental resilience and comeback capability assessment

### 5. ROLE WEIGHTINGS PAGE - METHODOLOGY DOCUMENTATION

**Mathematical Framework Display:**
- Complete PIV calculation formula with interactive explanations
- Role-specific weight breakdowns with visual representations
- Component calculation methods with example scenarios
- Normalization procedures and statistical methodologies
- Update history and version tracking for weight adjustments
- Peer review and validation process documentation

**Role Definition Comprehensive Guide:**
- Detailed responsibilities for each role across T and CT sides
- Performance expectations and benchmark standards
- Common variations and hybrid role considerations
- Meta evolution impact on role effectiveness
- Professional player role examples and case studies
- Training recommendations for role optimization

**Interactive Calculation Tools:**
- PIV calculator with real-time component adjustment
- Role weight modification interface for scenario testing
- Statistical significance testing for weight changes
- Performance impact prediction for role weight adjustments
- A/B testing framework for methodology improvements
- Expert feedback integration system

### 6. DOCUMENTATION PAGE - COMPLETE SYSTEM GUIDE

**Technical Documentation:**
- Database schema comprehensive explanation
- API endpoint documentation with examples
- Data collection methodologies and source verification
- Statistical validation procedures and accuracy testing
- Performance optimization techniques and caching strategies
- Error handling and data integrity protocols

**User Guides:**
- Feature walkthrough with interactive tutorials
- Advanced analytics interpretation guide
- Comparison tool usage and best practices
- Export functionality and report generation
- Mobile app usage and synchronization
- Troubleshooting and frequently asked questions

**Methodology Papers:**
- PIV development and validation research
- Statistical significance testing and peer review
- Comparison with existing rating systems
- Professional community feedback and adoption
- Academic research integration and citations
- Continuous improvement and update procedures

### 7. PLAYER COMPARISONS PAGE - ADVANCED ANALYTICAL TOOLS

**Comparison Interface:**
- Side-by-side player cards with synchronized scrolling
- Interactive metric selection and weighting adjustment
- Performance timeline comparison with synchronized time periods
- Role-adjusted comparison (same role vs. different roles)
- Situational performance comparison (clutch, eco, important rounds)
- Career phase comparison (rookie, prime, veteran years)

**Visualization Tools:**
- Radar chart overlays with customizable metrics
- Performance timeline graphs with event markers
- Heat map comparisons for map-specific performance
- Statistical distribution comparisons for consistency analysis
- Projection comparisons for future performance potential
- Market value and contract comparison analysis

**Advanced Analytics:**
- Statistical significance testing for performance differences
- Meta-analysis of head-to-head matchup history
- Team chemistry prediction when players are paired
- Optimal lineup generation with multiple player combinations
- Transfer impact analysis for both sending and receiving teams
- Salary efficiency comparison and contract optimization

### 8. MATCH PREDICTOR PAGE - ADVANCED FORECASTING SYSTEM

**Pre-Match Analysis:**
- Team composition analysis with role compatibility
- Recent form integration with performance trends
- Map pool analysis with veto prediction
- Player availability and substitute impact assessment
- Historical matchup analysis and head-to-head trends
- Meta game adaptation and strategy prediction

**Live Match Integration:**
- Real-time PIV updates during match progression
- Round-by-round prediction accuracy tracking
- Economic prediction and buy round forecasting
- Momentum analysis and comeback probability calculation
- Player performance prediction for remaining rounds
- Strategic adaptation recommendations

**Post-Match Analysis:**
- Prediction accuracy assessment and model improvement
- Performance variance analysis from expected values
- Key moment identification and impact assessment
- Player performance deviation from predicted values
- Team strategy effectiveness evaluation
- Learning integration for future prediction improvement

### 9. MATCH INFOGRAPHIC PAGE - VISUAL STORYTELLING

**Automated Infographic Generation:**
- Match summary with key statistics and highlights
- Player performance spotlights with standout achievements
- Team performance comparison with visual elements
- Timeline of key moments and round-winning plays
- Economic flow analysis throughout the match
- Tactical execution effectiveness visualization

**Customization Options:**
- Branding integration for teams and organizations
- Social media optimization for different platforms
- Interactive elements for web-based viewing
- Print-ready formats for physical distribution
- Video integration with highlight synchronization
- Multi-language support and localization

**Advanced Features:**
- Real-time generation during live matches
- Historical match infographic archive
- Tournament progression tracking with visual narratives
- Player career milestone celebration graphics
- Record-breaking performance special editions
- Comparative analysis between multiple matches

### 10. SCOUT PAGE - PROFESSIONAL TALENT EVALUATION

**Player Discovery Engine:**
- Advanced filtering system with role, performance, age, region
- Hidden gem identification using undervalued player algorithms
- Rising talent prediction based on performance trajectory
- Role-specific scouting with tactical fit analysis
- Budget-based search with salary efficiency optimization
- Contract situation analysis and availability assessment

**Team Fit Analysis:**
- Roster gap identification and optimal role filling
- Chemistry prediction with existing team members
- Playing style compatibility assessment
- Communication and language compatibility analysis
- Cultural fit evaluation and adaptation potential
- Performance projection in new team environment

**Evaluation Tools:**
- Comprehensive scouting reports with detailed analysis
- Video integration with performance highlight compilation
- Comparative analysis against current roster members
- Risk assessment for potential transfers
- Development potential and coaching requirement analysis
- Return on investment projection for contract negotiations

### 11. SEARCH PLAYERS PAGE - ADVANCED PLAYER DISCOVERY

**Comprehensive Search Interface:**
- Multi-criteria filtering with advanced boolean logic
- Performance range sliders with real-time result updates
- Role-specific search with T-side and CT-side preferences
- Geographic filtering with region and country options
- Age and experience level filtering for development targeting
- Availability status and contract situation filtering

**Results Display:**
- Grid view with customizable player cards
- List view with sortable columns and bulk actions
- Map view for geographic distribution analysis
- Performance visualization for quick comparison
- Saved search functionality and alert notifications
- Export capabilities for scouting databases

**Advanced Features:**
- AI-powered recommendation engine based on search patterns
- Similar player suggestions using machine learning algorithms
- Performance prediction for players under specific conditions
- Market value analysis and negotiation starting points
- Social media integration for additional player insights
- Professional network integration for reference checking

### 12. STATISTICAL ANALYSIS PAGE - ACADEMIC-LEVEL RESEARCH TOOLS

**Advanced Statistical Interface:**
- Correlation analysis between different performance metrics
- Regression modeling for performance prediction
- Cluster analysis for player archetype identification
- Time series analysis for performance trend identification
- Variance analysis for consistency measurement
- Distribution analysis for outlier identification

**Research Tools:**
- Hypothesis testing framework for strategic analysis
- A/B testing platform for tactical effectiveness
- Meta-analysis tools for cross-tournament comparison
- Longitudinal study support for career development tracking
- Control group analysis for training effectiveness
- Causal inference tools for factor impact assessment

**Visualization Suite:**
- Interactive statistical plots with customizable parameters
- Heat map generation for multi-dimensional analysis
- Scatter plot analysis with regression line fitting
- Box plot generation for distribution comparison
- Time series plotting with trend analysis
- Network analysis for team relationship mapping

### 13. DATA VISUALIZATION PAGE - INTERACTIVE ANALYTICS DASHBOARD

**Performance Visualization Tools:**
- Real-time dashboard with key performance indicators
- Interactive timeline visualization with event integration
- Geographic heat maps for regional performance analysis
- Network diagrams for team relationship visualization
- Flow charts for strategic execution analysis
- Comparative visualization for multi-entity analysis

**Customization Features:**
- Dashboard layout customization with drag-and-drop interface
- Color scheme personalization and theme selection
- Data range selection and time period filtering
- Export options for presentation and reporting
- Sharing capabilities with permission management
- Mobile-optimized viewing and interaction

**Advanced Analytics:**
- Machine learning model visualization and interpretation
- Prediction confidence intervals and uncertainty quantification
- Sensitivity analysis for model parameter variations
- Feature importance visualization for performance drivers
- Anomaly detection with automatic highlighting
- Pattern recognition with automated insight generation

### 14. ADVANCED ANALYTICS PAGE - CUTTING-EDGE ANALYSIS TOOLS

**Machine Learning Integration:**
- Performance prediction models with accuracy tracking
- Player development trajectory forecasting
- Team chemistry optimization algorithms
- Strategic effectiveness prediction models
- Injury risk assessment based on performance patterns
- Market value prediction with confidence intervals

**Competitive Intelligence:**
- Meta game evolution tracking and prediction
- Strategic trend analysis across professional scene
- Innovation adoption tracking among teams
- Performance benchmark evolution over time
- Tactical effectiveness lifecycle analysis
- Adaptation pattern recognition for teams

**Experimental Features:**
- Virtual reality integration for positional analysis
- Natural language processing for communication analysis
- Computer vision integration for movement pattern analysis
- Psychological profiling based on performance patterns
- Biometric integration for physiological performance correlation
- Blockchain integration for performance verification

### 15. DASHBOARD PAGE - PERSONALIZED ANALYTICS CENTER

**User Customization:**
- Personalized widget arrangement with drag-and-drop
- Favorite players and teams tracking with alerts
- Custom metric calculation and display
- Notification system for important events and updates
- Personal analytics goals and progress tracking
- Social features for sharing insights and discussions

**Real-Time Updates:**
- Live match integration with real-time PIV calculations
- Breaking news integration from professional scene
- Transfer rumors and confirmation tracking
- Tournament bracket updates with performance predictions
- Player status updates and availability changes
- Team announcement integration and impact analysis

**Analytics Integration:**
- Cross-platform data synchronization
- Mobile app connectivity and synchronization
- Third-party tool integration and data export
- API access for custom tool development
- Automated report generation and distribution
- Performance alert system with customizable thresholds

### 16. TESTING ENVIRONMENT PAGE - ADVANCED EXPERIMENTAL PLATFORM

**XYZ Positional Data Analysis:**
- 3D movement pattern visualization with interactive controls
- Heat map generation for positional preferences
- Rotation efficiency analysis with timing measurements
- Site control analysis with territorial influence mapping
- Communication pattern analysis with positioning correlation
- Tactical execution analysis with coordinate-based validation

**Experimental Features:**
- Alternative PIV calculation testing with A/B comparison
- New metric development and validation tools
- Machine learning model experimentation platform
- Data source integration testing and validation
- Performance optimization testing for calculation algorithms
- User interface testing with feedback integration

**Development Tools:**
- Database query optimization testing
- API performance monitoring and optimization
- Caching strategy testing and effectiveness measurement
- Security testing and vulnerability assessment
- Load testing for high-traffic scenarios
- Integration testing for external data sources

## COMPLETE API SPECIFICATION

### AUTHENTICATION ENDPOINTS
```
POST /api/register
Body: { username: string, password: string, email: string, role: "user"|"admin"|"analyst" }
Response: { user: UserObject, token: string }

POST /api/login
Body: { username: string, password: string }
Response: { user: UserObject, session: SessionObject }

POST /api/logout
Response: { success: boolean }

GET /api/user
Response: { user: UserObject | null }
```

### CORE DATA ENDPOINTS
```
GET /api/players
Query Parameters: 
  - event_id: number
  - team_id: number
  - role: "Entry Fragger"|"Support"|"Lurker"|"AWPer"|"IGL"|"Anchor"|"Rotator"
  - min_piv: number
  - max_piv: number
  - sort_by: "piv"|"rcs"|"icf"|"sc"|"adr"|"kd"
  - sort_order: "asc"|"desc"
  - limit: number (default 50)
  - offset: number (default 0)
Response: PlayerWithPIV[]

GET /api/players/:steamId
Response: {
  player: DetailedPlayerData,
  performance_history: PerformanceTimeline[],
  role_effectiveness: RoleMetrics,
  comparison_data: BenchmarkComparisons
}

GET /api/teams
Query Parameters:
  - event_id: number
  - region: "EU"|"NA"|"CIS"|"ASIA"|"OCE"|"SA"
  - min_tir: number
  - max_tir: number
Response: TeamWithTIR[]

GET /api/teams/:teamId
Response: {
  team: DetailedTeamData,
  roster: PlayerWithPIV[],
  performance_metrics: TeamMetrics,
  tactical_analysis: TacticalBreakdown
}

GET /api/matches
Query Parameters:
  - event_id: number
  - team_id: number
  - map_name: string
  - date_from: ISO_8601_date
  - date_to: ISO_8601_date
Response: MatchData[]

GET /api/matches/:fileId
Response: {
  match: DetailedMatchData,
  rounds: RoundData[],
  player_performances: PlayerMatchPerformance[],
  tactical_analysis: MatchTacticalAnalysis
}
```

### ANALYTICS ENDPOINTS
```
POST /api/analytics/compare-players
Body: { player_steam_ids: number[], metrics: string[], time_period: DateRange }
Response: PlayerComparisonData

POST /api/analytics/predict-match
Body: { 
  team1_id: number, 
  team2_id: number, 
  map_name: string,
  match_type: "group"|"playoff"|"final"
}
Response: MatchPrediction

GET /api/analytics/role-optimization/:teamId
Response: RoleOptimizationSuggestions

POST /api/scout/search
Body: {
  filters: ScoutFilters,
  team_context: number (team_id),
  budget_range: { min: number, max: number }
}
Response: ScoutedPlayer[]
```

### XYZ ANALYTICS ENDPOINTS
```
GET /api/xyz/player-positions/:steamId/:fileId
Query Parameters:
  - round_nums: number[] (optional)
  - side: "T"|"CT" (optional)
Response: PositionalData[]

GET /api/xyz/movement-patterns/:steamId
Query Parameters:
  - map_name: string
  - role: string
  - time_period: DateRange
Response: MovementPatternAnalysis

POST /api/xyz/team-coordination
Body: { team_id: number, file_ids: number[], analysis_type: "rotation"|"execution"|"retake" }
Response: TeamCoordinationMetrics
```

## COMPLETE IMPLEMENTATION ROADMAP

### PHASE 1: CORE INFRASTRUCTURE (WEEKS 1-4)
**Week 1: Database Architecture**
- Supabase schema implementation with all tables and relationships
- Foreign key constraints and indexing optimization
- Data migration scripts from existing CSV sources
- Database performance optimization and query testing
- Backup and recovery procedure establishment

**Week 2: Authentication & Security**
- User authentication system with session management
- Role-based access control implementation
- API security with rate limiting and input validation
- Password hashing and security protocol implementation
- Admin panel for user management

**Week 3: Core API Development**
- RESTful API endpoint implementation
- Database query optimization and connection pooling
- Error handling and logging system implementation
- API documentation with interactive examples
- Basic testing framework establishment

**Week 4: PIV Calculation Engine**
- Complete PIV algorithm implementation
- Role-specific metric calculation functions
- Data normalization and statistical processing
- Performance optimization for real-time calculations
- Accuracy testing and validation against known benchmarks

### PHASE 2: CORE FEATURES (WEEKS 5-8)
**Week 5: Players Page Development**
- Player listing with real-time PIV calculations
- Advanced filtering and sorting functionality
- Search implementation with autocomplete
- Player card design and interactive elements
- Performance optimization for large datasets

**Week 6: Teams Page Development**
- Team listing with TIR calculations
- Team detail pages with comprehensive analytics
- Roster management and role distribution analysis
- Team comparison functionality
- Strategic analysis visualization

**Week 7: Player Detail Pages**
- Comprehensive individual player analysis
- Performance timeline visualization
- Role-specific metric breakdowns
- Historical performance tracking
- Predictive analytics integration

**Week 8: Basic Visualization System**
- Chart.js/Recharts integration
- Performance timeline visualization
- Role effectiveness radar charts
- Comparison visualization tools
- Export functionality for reports

### PHASE 3: ADVANCED ANALYTICS (WEEKS 9-12)
**Week 9: Player Comparison System**
- Side-by-side comparison interface
- Statistical significance testing
- Advanced visualization for comparisons
- Batch comparison functionality
- Export and sharing capabilities

**Week 10: Match Prediction Engine**
- Pre-match analysis algorithm development
- Historical data integration for predictions
- Machine learning model training
- Prediction accuracy tracking
- Live prediction updates

**Week 11: Scout Feature Development**
- Advanced player discovery algorithms
- Team fit analysis calculations
- Market value assessment models
- Hidden gem identification systems
- Comprehensive scouting reports

**Week 12: Role Optimization System**
- Team role distribution analysis
- Optimal lineup generation algorithms
- Performance impact prediction
- Strategic recommendation engine
- A/B testing framework for recommendations

### PHASE 4: ADVANCED FEATURES (WEEKS 13-16)
**Week 13: XYZ Positional Analytics**
- 3D coordinate data processing
- Movement pattern analysis algorithms
- Heat map generation for positioning
- Team coordination analysis
- Interactive 3D visualization

**Week 14: Match Infographic System**
- Automated infographic generation
- Template system for different match types
- Social media optimization
- Brand integration capabilities
- Real-time generation during matches

**Week 15: Advanced Dashboard**
- Personalized dashboard creation
- Real-time data streaming
- Custom widget development
- Alert and notification system
- Mobile-responsive design

**Week 16: Testing Environment**
- Experimental feature testing platform
- A/B testing framework
- Performance benchmarking tools
- Data validation systems
- User feedback integration

### PHASE 5: OPTIMIZATION & POLISH (WEEKS 17-20)
**Week 17: Performance Optimization**
- Database query optimization
- API response time improvement
- Frontend rendering optimization
- Caching strategy implementation
- Load balancing and scaling

**Week 18: User Experience Enhancement**
- Interface usability testing
- Mobile responsiveness improvement
- Accessibility compliance
- User onboarding system
- Help and documentation integration

**Week 19: Integration & Testing**
- Third-party integration testing
- Data accuracy validation
- Security penetration testing
- Performance load testing
- User acceptance testing

**Week 20: Launch Preparation**
- Production deployment setup
- Monitoring and alerting systems
- Backup and disaster recovery
- Documentation finalization
- Community feedback integration

## DATA PROCESSING PIPELINE SPECIFICATION

### REAL-TIME CALCULATION FLOW
```
Supabase Database → Raw SQL Adapter → Data Transformation → PIV Calculator → Frontend API
```

**Step 1: Data Extraction**
- Steam ID-based player identification
- Role assignment from roles table
- Statistical data aggregation from multiple tables
- Performance normalization across player pool
- Team context integration for synergy calculations

**Step 2: Metric Calculation**
- Role-specific weight application
- Normalization factor calculation
- Component score computation (RCS, ICF, SC, OSM)
- Situational modifier application
- Final PIV score assembly

**Step 3: Data Enrichment**
- Historical performance integration
- Trend analysis and trajectory calculation
- Benchmark comparison generation
- Market value estimation
- Prediction confidence scoring

**Step 4: Cache Management**
- Redis-based caching for frequently accessed data
- Invalidation strategy for real-time updates
- Performance monitoring and optimization
- Memory usage optimization
- Cache hit rate tracking

### ERROR HANDLING & VALIDATION

**Data Integrity Checks:**
- Steam ID validation and duplicate detection
- Role assignment consistency verification
- Statistical data range validation
- Missing data handling and imputation
- Outlier detection and flagging

**Calculation Validation:**
- PIV component range verification
- Mathematical operation error handling
- Division by zero protection
- Infinite value detection and handling
- Precision maintenance throughout calculations

**API Error Responses:**
- Standardized error message format
- Detailed error logging for debugging
- User-friendly error descriptions
- Recovery suggestion provision
- Error tracking and monitoring

## TESTING STRATEGY SPECIFICATION

### UNIT TESTING (TARGET: 95% COVERAGE)
**PIV Calculation Testing:**
- Individual component calculation verification
- Edge case handling validation
- Performance benchmark testing
- Accuracy comparison against manual calculations
- Regression testing for algorithm changes

**Database Integration Testing:**
- Query performance validation
- Data integrity verification
- Foreign key constraint testing
- Transaction rollback testing
- Connection pooling effectiveness

**API Endpoint Testing:**
- Request/response validation
- Authentication and authorization testing
- Rate limiting effectiveness
- Error handling verification
- Performance under load

### INTEGRATION TESTING
**End-to-End Workflow Testing:**
- Complete user journey validation
- Cross-feature integration verification
- Data flow consistency checking
- Performance impact assessment
- User experience validation

**Third-Party Integration Testing:**
- Supabase connection reliability
- External API integration validation
- Authentication service testing
- Monitoring system integration
- Backup and recovery testing

### PERFORMANCE TESTING
**Load Testing Scenarios:**
- Concurrent user simulation (1000+ users)
- Database query performance under load
- API response time measurement
- Memory usage monitoring
- System stability assessment

**Stress Testing:**
- Peak load capacity determination
- Failure point identification
- Recovery time measurement
- Data consistency under stress
- Resource usage optimization

## DEPLOYMENT & OPERATIONS

### PRODUCTION ENVIRONMENT SETUP
**Infrastructure Requirements:**
- Replit deployment environment
- Supabase database cluster
- Redis cache implementation
- CDN for static assets
- SSL certificate configuration

**Monitoring & Alerting:**
- Application performance monitoring
- Database performance tracking
- Error rate monitoring
- User activity analytics
- Resource usage alerts

**Backup & Recovery:**
- Automated daily database backups
- Configuration backup procedures
- Disaster recovery testing
- Data retention policies
- Recovery time objectives

### MAINTENANCE PROCEDURES
**Regular Maintenance Tasks:**
- Database optimization and cleanup
- Cache performance monitoring
- Security update application
- Performance metric review
- User feedback analysis

**Update Deployment Process:**
- Staging environment testing
- Blue-green deployment strategy
- Rollback procedure implementation
- Database migration management
- User communication during updates

## SUCCESS METRICS & KPIs

### TECHNICAL PERFORMANCE METRICS
- PIV calculation accuracy (target: >95% correlation with expert analysis)
- API response time (target: <500ms for 95th percentile)
- Database query performance (target: <100ms average)
- System uptime (target: 99.9%)
- User session duration (target: >15 minutes average)

### BUSINESS METRICS
- User adoption rate and growth
- Feature usage analytics
- User satisfaction scores
- Professional community adoption
- Revenue generation (if applicable)

### ANALYTICAL ACCURACY METRICS
- Prediction accuracy tracking
- Expert validation correlation
- Community feedback integration
- Peer review validation
- Academic research integration

---

This comprehensive PRD provides complete technical specification for rebuilding the CS2 Analytics Platform with proper Supabase integration, ensuring accurate PIV calculations, robust feature set, and scalable architecture for professional esports analytics.

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