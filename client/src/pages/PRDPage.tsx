import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function PRDPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            CS2 Performance Analytics Platform
          </h1>
          <p className="text-xl text-muted-foreground">Product Requirements Document</p>
          <Badge variant="outline" className="text-sm">Version 2.0 - Supabase Architecture</Badge>
        </div>

        {/* Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              A comprehensive Counter-Strike 2 player and team performance analytics platform that transforms 
              raw match data into actionable insights through advanced metrics, predictive modeling, and interactive visualizations.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Frontend</h4>
                <p className="text-sm text-blue-700">React.js, TypeScript, Framer Motion</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Backend</h4>
                <p className="text-sm text-green-700">Node.js/Express, TypeScript</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900">Database</h4>
                <p className="text-sm text-purple-700">Supabase (PostgreSQL)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PIV System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">PIV (Player Impact Value) System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-mono text-lg mb-2">Core Formula:</h4>
              <code className="text-sm bg-white p-2 rounded border">
                PIV = (RCS × ICF × SC × OSM) + Basic_Metrics_Bonus
              </code>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-lg mb-3">PIV Components</h4>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-medium">RCS (Role Core Score)</h5>
                    <p className="text-sm text-muted-foreground">Range: 0.0-1.0</p>
                    <p className="text-sm">Measures role-specific performance effectiveness</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-4">
                    <h5 className="font-medium">ICF (Individual Consistency Factor)</h5>
                    <p className="text-sm text-muted-foreground">Range: 0.0-2.0</p>
                    <p className="text-sm">Rewards consistent high performance</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-4">
                    <h5 className="font-medium">SC (Synergy Contribution)</h5>
                    <p className="text-sm text-muted-foreground">Range: 0.0-1.0</p>
                    <p className="text-sm">Role-specific team contribution</p>
                  </div>
                  <div className="border-l-4 border-orange-500 pl-4">
                    <h5 className="font-medium">OSM (Opponent Strength Multiplier)</h5>
                    <p className="text-sm text-muted-foreground">Range: 0.8-1.2</p>
                    <p className="text-sm">Adjusts for opposition quality</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-lg mb-3">Database Integration</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <h5 className="font-medium text-blue-900">Steam ID Matching</h5>
                    <p className="text-sm text-blue-700">Primary key for player identification</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <h5 className="font-medium text-green-900">Role Assignment</h5>
                    <p className="text-sm text-green-700">T-side and CT-side roles from Supabase</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <h5 className="font-medium text-purple-900">Real-time Calculation</h5>
                    <p className="text-sm text-purple-700">Live PIV computation from database</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Weights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Role Weights & Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* T-Side Roles */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-red-600">T-Side Roles</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-2">Entry Fragger</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Opening Kill Success Rate</span>
                        <Badge variant="secondary">30%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Multi-Kill Rounds</span>
                        <Badge variant="secondary">25%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Trade Kill Efficiency</span>
                        <Badge variant="secondary">20%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Site Penetration Success</span>
                        <Badge variant="secondary">15%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Economy Impact</span>
                        <Badge variant="secondary">10%</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-2">Support</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Flash Assist Efficiency</span>
                        <Badge variant="secondary">35%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Trade Kill Success</span>
                        <Badge variant="secondary">30%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Utility Coordination</span>
                        <Badge variant="secondary">20%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Team Setup Contribution</span>
                        <Badge variant="secondary">15%</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-2">Lurker</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Information Gathering Efficiency</span>
                        <Badge variant="secondary">40%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Flank Success Rate</span>
                        <Badge variant="secondary">30%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Zone Influence Stability</span>
                        <Badge variant="secondary">20%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Delayed Timing Effectiveness</span>
                        <Badge variant="secondary">10%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CT-Side Roles */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-blue-600">CT-Side Roles</h3>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-2">Anchor</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Site Hold Success Rate</span>
                        <Badge variant="secondary">35%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Retake Efficiency</span>
                        <Badge variant="secondary">25%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Economic Conservation</span>
                        <Badge variant="secondary">20%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Clutch Performance</span>
                        <Badge variant="secondary">20%</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-2">Rotator</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Rotation Efficiency Index</span>
                        <Badge variant="secondary">40%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Adaptive Defense Score</span>
                        <Badge variant="secondary">25%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Retake Utility Coordination</span>
                        <Badge variant="secondary">20%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Anti-Execute Success</span>
                        <Badge variant="secondary">15%</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-lg mb-2">AWPer (Both Sides)</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Pick Efficiency</span>
                        <Badge variant="secondary">40%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Economy Impact</span>
                        <Badge variant="secondary">25%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Map Control Contribution</span>
                        <Badge variant="secondary">20%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Long-Range Accuracy</span>
                        <Badge variant="secondary">15%</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Schema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Supabase Database Schema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Core Tables</h4>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded border">
                    <h5 className="font-medium text-blue-900">players</h5>
                    <p className="text-sm text-blue-700">steam_id (PK), user_name, team_id, event_id</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border">
                    <h5 className="font-medium text-green-900">roles</h5>
                    <p className="text-sm text-green-700">steam_id (FK), in_game_leader, t_role, ct_role</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border">
                    <h5 className="font-medium text-purple-900">teams</h5>
                    <p className="text-sm text-purple-700">id (PK), name, logo_url, event_id</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded border">
                    <h5 className="font-medium text-orange-900">events</h5>
                    <p className="text-sm text-orange-700">event_id (PK), name, start_date, end_date</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Statistical Tables</h4>
                <div className="space-y-3">
                  <div className="bg-red-50 p-3 rounded border">
                    <h5 className="font-medium text-red-900">kill_stats</h5>
                    <p className="text-sm text-red-700">kills, headshots, wallbang_kills, awp_kills, etc.</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded border">
                    <h5 className="font-medium text-yellow-900">general_stats</h5>
                    <p className="text-sm text-yellow-700">deaths, assists, adr, kast, rating, etc.</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded border">
                    <h5 className="font-medium text-indigo-900">utility_stats</h5>
                    <p className="text-sm text-indigo-700">flash_assists, he_damage, smoke_success, etc.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Implementation Phases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Implementation Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-900 mb-2">Phase 1</h4>
                  <h5 className="font-medium text-blue-800">Core Infrastructure</h5>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1">
                    <li>• Clean Supabase schema</li>
                    <li>• Authentication system</li>
                    <li>• Basic PIV calculations</li>
                    <li>• Role integration</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-900 mb-2">Phase 2</h4>
                  <h5 className="font-medium text-green-800">Analytics Engine</h5>
                  <ul className="text-sm text-green-700 mt-2 space-y-1">
                    <li>• Complete PIV system</li>
                    <li>• Team Impact Rating</li>
                    <li>• Role-specific metrics</li>
                    <li>• Comparison tools</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-900 mb-2">Phase 3</h4>
                  <h5 className="font-medium text-purple-800">Advanced Features</h5>
                  <ul className="text-sm text-purple-700 mt-2 space-y-1">
                    <li>• Scout feature</li>
                    <li>• Interactive visualizations</li>
                    <li>• Prediction models</li>
                    <li>• XYZ analytics</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                  <h4 className="font-semibold text-orange-900 mb-2">Phase 4</h4>
                  <h5 className="font-medium text-orange-800">Polish & Scale</h5>
                  <ul className="text-sm text-orange-700 mt-2 space-y-1">
                    <li>• Performance optimization</li>
                    <li>• Advanced caching</li>
                    <li>• Real-time updates</li>
                    <li>• Mobile responsive</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            This PRD serves as the foundation for rebuilding the CS2 Analytics Platform with proper Supabase integration, 
            ensuring clean architecture, accurate calculations, and scalable feature development.
          </p>
        </div>
      </div>
    </div>
  );
}