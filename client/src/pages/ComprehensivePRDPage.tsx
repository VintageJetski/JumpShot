import React from 'react';

export default function ComprehensivePRDPage() {
  return (
    <div className="container mx-auto px-6 py-8 max-w-none">
      <div className="prose prose-lg max-w-none">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">CS2 Performance Analytics Platform</h1>
          <h2 className="text-2xl text-gray-600 mb-4">Complete Product Requirements Document</h2>
          <p className="text-lg text-gray-500">Comprehensive Technical Specification & Feature Documentation</p>
        </div>

        <div className="space-y-12">
          {/* Platform Overview */}
          <section>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">PLATFORM OVERVIEW</h2>
            <p className="text-lg leading-relaxed mb-4">
              A revolutionary Counter-Strike 2 performance analytics ecosystem that transforms raw competitive match data into actionable intelligence through advanced statistical modeling, machine learning algorithms, and comprehensive visualization tools. The platform serves professional teams, coaches, analysts, scouts, and esports organizations with deep insights into player performance, team dynamics, match prediction, and strategic optimization.
            </p>
            
            <h3 className="text-2xl font-semibold mb-4">CORE TECHNOLOGY ARCHITECTURE</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Frontend Framework:</strong> React.js 18+ with TypeScript, Framer Motion animations, Recharts visualization library</li>
              <li><strong>Backend Infrastructure:</strong> Node.js/Express server with TypeScript, real-time WebSocket connections</li>
              <li><strong>Primary Database:</strong> Supabase (PostgreSQL) with complete relational schema and foreign key constraints</li>
              <li><strong>Authentication System:</strong> Session-based authentication with role-based access control</li>
              <li><strong>Data Processing Engine:</strong> Real-time PIV calculation system with role-specific metric evaluation</li>
              <li><strong>Deployment Platform:</strong> Replit with automatic scaling and monitoring</li>
              <li><strong>API Architecture:</strong> RESTful endpoints with comprehensive error handling and data validation</li>
            </ul>
          </section>

          {/* Database Schema */}
          <section>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">COMPREHENSIVE DATABASE SCHEMA (SUPABASE POSTGRESQL)</h2>
            
            <h3 className="text-2xl font-semibold mb-4">CORE RELATIONAL STRUCTURE</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold mb-3">events Table</h4>
                <ul className="text-sm space-y-1">
                  <li>• event_id (SERIAL PRIMARY KEY)</li>
                  <li>• name (VARCHAR, e.g., "IEM_Katowice_2025")</li>
                  <li>• start_date (TIMESTAMP)</li>
                  <li>• end_date (TIMESTAMP)</li>
                  <li>• location (VARCHAR)</li>
                  <li>• prize_pool (DECIMAL)</li>
                  <li>• tier (VARCHAR: "S-Tier", "A-Tier", "B-Tier")</li>
                  <li>• status (VARCHAR: "upcoming", "ongoing", "completed")</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold mb-3">teams Table</h4>
                <ul className="text-sm space-y-1">
                  <li>• id (SERIAL PRIMARY KEY)</li>
                  <li>• name (VARCHAR)</li>
                  <li>• logo_url (TEXT)</li>
                  <li>• country (VARCHAR)</li>
                  <li>• region (VARCHAR: "EU", "NA", "CIS", "ASIA", "OCE", "SA")</li>
                  <li>• world_ranking (INTEGER)</li>
                  <li>• event_id (INTEGER FOREIGN KEY → events.event_id)</li>
                  <li>• coach_name (VARCHAR)</li>
                  <li>• organization (VARCHAR)</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-bold mb-3">players Table</h4>
                <ul className="text-sm space-y-1">
                  <li>• steam_id (BIGINT PRIMARY KEY)</li>
                  <li>• user_name (VARCHAR)</li>
                  <li>• real_name (VARCHAR)</li>
                  <li>• country (VARCHAR)</li>
                  <li>• age (INTEGER)</li>
                  <li>• team_id (INTEGER FOREIGN KEY → teams.id)</li>
                  <li>• event_id (INTEGER FOREIGN KEY → events.event_id)</li>
                  <li>• is_active (BOOLEAN DEFAULT true)</li>
                  <li>• primary_weapon_preference (VARCHAR)</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-bold mb-3">roles Table (CRITICAL FOR PIV)</h4>
                <ul className="text-sm space-y-1">
                  <li>• steam_id (BIGINT FOREIGN KEY → players.steam_id)</li>
                  <li>• in_game_leader (BOOLEAN DEFAULT false)</li>
                  <li>• t_role (VARCHAR: "Entry Fragger", "Support", "Lurker", "AWPer", "IGL")</li>
                  <li>• ct_role (VARCHAR: "Anchor", "Rotator", "Support", "AWPer", "IGL")</li>
                  <li>• secondary_awp (BOOLEAN DEFAULT false)</li>
                  <li>• role_flexibility_score (DECIMAL 0.0-1.0)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* PIV Calculation System */}
          <section>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">COMPLETE PIV (PLAYER IMPACT VALUE) MATHEMATICAL FRAMEWORK</h2>
            
            <div className="bg-gray-100 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-semibold mb-4">FUNDAMENTAL CALCULATION ARCHITECTURE</h3>
              <p className="mb-4">PIV represents the most comprehensive player evaluation metric in competitive Counter-Strike 2 analytics, incorporating role-specific performance, individual consistency, team synergy contribution, and contextual factors.</p>
              
              <div className="bg-white p-4 rounded border">
                <h4 className="font-mono text-lg mb-2">Master Formula:</h4>
                <code className="block text-sm bg-gray-50 p-3 rounded">
                  PIV = (RCS × ICF × SC × OSM) + Basic_Metrics_Bonus + Situational_Modifiers + Map_Specific_Adjustments
                  <br />Where:
                  <br />- RCS = Role Core Score (0.0 to 1.0)
                  <br />- ICF = Individual Consistency Factor (0.0 to 2.0)
                  <br />- SC = Synergy Contribution (0.0 to 1.0)
                  <br />- OSM = Opponent Strength Multiplier (0.8 to 1.2)
                  <br />- Basic_Metrics_Bonus = Fundamental statistical performance bonus (0.0 to 0.5)
                  <br />- Situational_Modifiers = Context-based adjustments (-0.2 to +0.3)
                  <br />- Map_Specific_Adjustments = Map performance variance (-0.1 to +0.1)
                </code>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">T-SIDE ROLE DEFINITIONS & WEIGHTINGS</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-red-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3 text-red-800">ENTRY FRAGGER (T-Side Primary Initiator)</h4>
                <p className="text-sm mb-3 text-red-700">Role Responsibility: First contact engagement, site execution leadership, creating space for team advancement</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Opening Kill Success Rate</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Multi-Kill Rounds</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trade Kill Efficiency</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Site Penetration Success</span>
                    <span className="font-semibold">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economy Impact</span>
                    <span className="font-semibold">10%</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3 text-green-800">SUPPORT (T-Side Utility Coordinator)</h4>
                <p className="text-sm mb-3 text-green-700">Role Responsibility: Utility deployment, teammate assistance, trade fragging, tactical setup</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Flash Assist Efficiency</span>
                    <span className="font-semibold">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trade Kill Success</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Utility Coordination Score</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team Setup Contribution</span>
                    <span className="font-semibold">15%</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3 text-blue-800">LURKER (T-Side Information & Flanking Specialist)</h4>
                <p className="text-sm mb-3 text-blue-700">Role Responsibility: Information gathering, flanking maneuvers, late-round impact, map control</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Information Gathering Efficiency</span>
                    <span className="font-semibold">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Flank Success Rate</span>
                    <span className="font-semibold">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zone Influence Stability</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delayed Timing Effectiveness</span>
                    <span className="font-semibold">10%</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3 text-yellow-800">AWPER (T-Side Precision Marksman)</h4>
                <p className="text-sm mb-3 text-yellow-700">Role Responsibility: Long-range eliminations, pick generation, map control establishment, economic impact</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Pick Efficiency</span>
                    <span className="font-semibold">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economy Impact</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Map Control Contribution</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Long-Range Accuracy</span>
                    <span className="font-semibold">15%</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-2xl font-semibold mb-4">CT-SIDE ROLE DEFINITIONS & WEIGHTINGS</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-indigo-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3 text-indigo-800">ANCHOR (CT-Side Site Specialist)</h4>
                <p className="text-sm mb-3 text-indigo-700">Role Responsibility: Site defense, solo holds, retake coordination, economic preservation</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Site Hold Success Rate</span>
                    <span className="font-semibold">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retake Efficiency</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economic Conservation</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clutch Performance</span>
                    <span className="font-semibold">20%</span>
                  </div>
                </div>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3 text-teal-800">ROTATOR (CT-Side Adaptive Defender)</h4>
                <p className="text-sm mb-3 text-teal-700">Role Responsibility: Map rotation, backup support, flexible positioning, anti-execute defense</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Rotation Efficiency Index</span>
                    <span className="font-semibold">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adaptive Defense Score</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Retake Utility Coordination</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Anti-Execute Success</span>
                    <span className="font-semibold">15%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Complete Feature List */}
          <section>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">COMPREHENSIVE FEATURE SPECIFICATION</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">1. PLAYERS PAGE</h4>
                <ul className="text-sm space-y-1">
                  <li>• Real-time PIV calculations from Supabase</li>
                  <li>• Advanced filtering by role, team, PIV range</li>
                  <li>• Role-based color coding and hierarchy</li>
                  <li>• Search with autocomplete</li>
                  <li>• Export capabilities (CSV, PDF)</li>
                  <li>• Performance heat maps per card</li>
                  <li>• Batch comparison (up to 6 players)</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">2. TEAMS PAGE</h4>
                <ul className="text-sm space-y-1">
                  <li>• Team Impact Rating (TIR) calculations</li>
                  <li>• Roster composition visualization</li>
                  <li>• Team synergy metrics</li>
                  <li>• Recent match results</li>
                  <li>• Role distribution analysis</li>
                  <li>• Map pool analysis</li>
                  <li>• Strategic preferences breakdown</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">3. PLAYER DETAIL PAGE</h4>
                <ul className="text-sm space-y-1">
                  <li>• PIV timeline with interactive details</li>
                  <li>• Component breakdown (RCS, ICF, SC, OSM)</li>
                  <li>• Performance radar charts</li>
                  <li>• Match-by-match performance grid</li>
                  <li>• Career highlights timeline</li>
                  <li>• Role-specific metric breakdowns</li>
                  <li>• Predictive analytics integration</li>
                </ul>
              </div>

              <div className="bg-red-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">4. TEAM DETAIL PAGE</h4>
                <ul className="text-sm space-y-1">
                  <li>• Current roster with detailed cards</li>
                  <li>• Role assignment optimization</li>
                  <li>• Player chemistry matrix</li>
                  <li>• Tactical analysis dashboard</li>
                  <li>• Economic efficiency metrics</li>
                  <li>• Anti-strat analysis</li>
                  <li>• Performance impact of changes</li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">5. ROLE WEIGHTINGS PAGE</h4>
                <ul className="text-sm space-y-1">
                  <li>• Complete PIV formula explanations</li>
                  <li>• Role-specific weight breakdowns</li>
                  <li>• Interactive calculation tools</li>
                  <li>• Component calculation methods</li>
                  <li>• Normalization procedures</li>
                  <li>• Update history tracking</li>
                  <li>• A/B testing framework</li>
                </ul>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">6. DOCUMENTATION PAGE</h4>
                <ul className="text-sm space-y-1">
                  <li>• Database schema explanations</li>
                  <li>• API endpoint documentation</li>
                  <li>• Data collection methodologies</li>
                  <li>• User guides with tutorials</li>
                  <li>• Advanced analytics interpretation</li>
                  <li>• Troubleshooting guides</li>
                  <li>• Methodology research papers</li>
                </ul>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">7. PLAYER COMPARISONS</h4>
                <ul className="text-sm space-y-1">
                  <li>• Side-by-side player cards</li>
                  <li>• Interactive metric selection</li>
                  <li>• Performance timeline comparison</li>
                  <li>• Role-adjusted comparisons</li>
                  <li>• Radar chart overlays</li>
                  <li>• Statistical significance testing</li>
                  <li>• Market value analysis</li>
                </ul>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">8. MATCH PREDICTOR</h4>
                <ul className="text-sm space-y-1">
                  <li>• Pre-match analysis algorithms</li>
                  <li>• Team composition analysis</li>
                  <li>• Map pool analysis with veto prediction</li>
                  <li>• Live match integration</li>
                  <li>• Real-time PIV updates</li>
                  <li>• Prediction accuracy tracking</li>
                  <li>• Post-match analysis</li>
                </ul>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">9. MATCH INFOGRAPHIC</h4>
                <ul className="text-sm space-y-1">
                  <li>• Automated infographic generation</li>
                  <li>• Match summary with highlights</li>
                  <li>• Player performance spotlights</li>
                  <li>• Timeline of key moments</li>
                  <li>• Social media optimization</li>
                  <li>• Brand integration capabilities</li>
                  <li>• Real-time generation</li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">10. SCOUT PAGE</h4>
                <ul className="text-sm space-y-1">
                  <li>• Advanced player discovery</li>
                  <li>• Hidden gem identification</li>
                  <li>• Team fit analysis</li>
                  <li>• Budget-based search</li>
                  <li>• Comprehensive scouting reports</li>
                  <li>• Risk assessment for transfers</li>
                  <li>• Development potential analysis</li>
                </ul>
              </div>

              <div className="bg-lime-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">11. SEARCH PLAYERS</h4>
                <ul className="text-sm space-y-1">
                  <li>• Multi-criteria filtering</li>
                  <li>• Performance range sliders</li>
                  <li>• Geographic filtering</li>
                  <li>• AI-powered recommendations</li>
                  <li>• Similar player suggestions</li>
                  <li>• Saved search functionality</li>
                  <li>• Export capabilities</li>
                </ul>
              </div>

              <div className="bg-cyan-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">12. STATISTICAL ANALYSIS</h4>
                <ul className="text-sm space-y-1">
                  <li>• Correlation analysis tools</li>
                  <li>• Regression modeling</li>
                  <li>• Cluster analysis</li>
                  <li>• Time series analysis</li>
                  <li>• Hypothesis testing framework</li>
                  <li>• Interactive statistical plots</li>
                  <li>• Research tools</li>
                </ul>
              </div>

              <div className="bg-violet-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">13. DATA VISUALIZATION</h4>
                <ul className="text-sm space-y-1">
                  <li>• Real-time dashboard KPIs</li>
                  <li>• Interactive timeline visualization</li>
                  <li>• Geographic heat maps</li>
                  <li>• Network diagrams</li>
                  <li>• Customizable layouts</li>
                  <li>• Export options</li>
                  <li>• Mobile-optimized viewing</li>
                </ul>
              </div>

              <div className="bg-rose-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">14. ADVANCED ANALYTICS</h4>
                <ul className="text-sm space-y-1">
                  <li>• Machine learning integration</li>
                  <li>• Performance prediction models</li>
                  <li>• Meta game evolution tracking</li>
                  <li>• Strategic trend analysis</li>
                  <li>• Competitive intelligence</li>
                  <li>• Experimental features</li>
                  <li>• Blockchain integration</li>
                </ul>
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">15. DASHBOARD PAGE</h4>
                <ul className="text-sm space-y-1">
                  <li>• Personalized widget arrangement</li>
                  <li>• Favorite players tracking</li>
                  <li>• Custom metric calculations</li>
                  <li>• Real-time updates</li>
                  <li>• Live match integration</li>
                  <li>• Cross-platform synchronization</li>
                  <li>• Performance alerts</li>
                </ul>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border">
                <h4 className="font-bold text-lg mb-3">16. TESTING ENVIRONMENT</h4>
                <ul className="text-sm space-y-1">
                  <li>• XYZ positional data analysis</li>
                  <li>• 3D movement visualization</li>
                  <li>• Heat map generation</li>
                  <li>• Alternative PIV testing</li>
                  <li>• Machine learning experimentation</li>
                  <li>• Performance optimization</li>
                  <li>• Development tools</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Implementation Roadmap */}
          <section>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">COMPLETE IMPLEMENTATION ROADMAP</h2>
            
            <div className="space-y-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">PHASE 1: CORE INFRASTRUCTURE (WEEKS 1-4)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Week 1: Database Architecture</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Supabase schema implementation</li>
                      <li>• Foreign key constraints</li>
                      <li>• Data migration scripts</li>
                      <li>• Query optimization</li>
                      <li>• Backup procedures</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Week 2: Authentication & Security</h4>
                    <ul className="text-sm space-y-1">
                      <li>• User authentication system</li>
                      <li>• Role-based access control</li>
                      <li>• API security implementation</li>
                      <li>• Password hashing</li>
                      <li>• Admin panel creation</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Week 3: Core API Development</h4>
                    <ul className="text-sm space-y-1">
                      <li>• RESTful API endpoints</li>
                      <li>• Database optimization</li>
                      <li>• Error handling systems</li>
                      <li>• API documentation</li>
                      <li>• Testing framework</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Week 4: PIV Calculation Engine</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Complete PIV algorithm</li>
                      <li>• Role-specific calculations</li>
                      <li>• Data normalization</li>
                      <li>• Performance optimization</li>
                      <li>• Accuracy testing</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-4">PHASE 2: CORE FEATURES (WEEKS 5-8)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Week 5: Players Page</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Real-time PIV calculations</li>
                      <li>• Advanced filtering</li>
                      <li>• Search implementation</li>
                      <li>• Player card design</li>
                      <li>• Performance optimization</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Week 6: Teams Page</h4>
                    <ul className="text-sm space-y-1">
                      <li>• TIR calculations</li>
                      <li>• Team detail pages</li>
                      <li>• Roster analysis</li>
                      <li>• Team comparisons</li>
                      <li>• Strategic visualization</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Week 7: Player Detail Pages</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Individual analysis</li>
                      <li>• Performance timelines</li>
                      <li>• Role breakdowns</li>
                      <li>• Historical tracking</li>
                      <li>• Predictive analytics</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Week 8: Visualization System</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Chart integration</li>
                      <li>• Timeline visualization</li>
                      <li>• Radar charts</li>
                      <li>• Comparison tools</li>
                      <li>• Export functionality</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Success Metrics */}
          <section>
            <h2 className="text-3xl font-bold mb-6 border-b-2 border-gray-200 pb-2">SUCCESS METRICS & KPIs</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold mb-3">Technical Performance</h4>
                <ul className="text-sm space-y-2">
                  <li>• PIV accuracy: 95%+ correlation</li>
                  <li>• API response: under 500ms (95th percentile)</li>
                  <li>• Database queries: under 100ms average</li>
                  <li>• System uptime: 99.9%</li>
                  <li>• User sessions: 15min+ average</li>
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-bold mb-3">Business Metrics</h4>
                <ul className="text-sm space-y-2">
                  <li>• User adoption rate growth</li>
                  <li>• Feature usage analytics</li>
                  <li>• User satisfaction scores</li>
                  <li>• Professional community adoption</li>
                  <li>• Revenue generation potential</li>
                </ul>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-bold mb-3">Analytical Accuracy</h4>
                <ul className="text-sm space-y-2">
                  <li>• Prediction accuracy tracking</li>
                  <li>• Expert validation correlation</li>
                  <li>• Community feedback integration</li>
                  <li>• Peer review validation</li>
                  <li>• Academic research integration</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer */}
          <section className="text-center py-8 border-t-2 border-gray-200">
            <p className="text-lg text-gray-600">
              This comprehensive PRD provides complete technical specification for rebuilding the CS2 Analytics Platform with proper Supabase integration, ensuring accurate PIV calculations, robust feature set, and scalable architecture for professional esports analytics.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}