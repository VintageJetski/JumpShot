import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function DocumentationPage() {
  return (
    <div className="container mx-auto p-4 lg:p-8 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-teal-400 text-transparent bg-clip-text">CS2 Analytics Documentation</h1>
        <p className="text-gray-400 text-lg">Comprehensive documentation of our player and team rating methodology</p>
      </div>

      <Tabs defaultValue="methodology" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="methodology">Rating Methodology</TabsTrigger>
          <TabsTrigger value="roles">Role System</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>
        
        <TabsContent value="methodology" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">PIV (Player Impact Value) Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Player Impact Value (PIV) is our comprehensive player rating system that combines multiple factors to create a single score that represents a player's overall impact.
              </p>
              
              <h3 className="text-xl font-semibold mt-4">PIV Formula Components</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Weighting</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>RCS (Role Core Score)</TableCell>
                    <TableCell>Measures how well a player performs in their specific role</TableCell>
                    <TableCell>50% RCS + 50% Basic Metrics Score</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>ICF (Individual Consistency Factor)</TableCell>
                    <TableCell>Measures a player's consistency based on K/D and other factors</TableCell>
                    <TableCell>Weighted by role (higher for star roles)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>SC (Synergy Contribution)</TableCell>
                    <TableCell>Measures how a player contributes to team synergy</TableCell>
                    <TableCell>Role-specific calculation</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>OSM (Opponent Strength Multiplier)</TableCell>
                    <TableCell>Adjusts ratings based on opponent quality</TableCell>
                    <TableCell>Currently fixed at 1.0</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>K/D Multiplier</TableCell>
                    <TableCell>Applies additional weight to K/D ratio</TableCell>
                    <TableCell>Varies by K/D value with higher scaling for stars</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <h3 className="text-xl font-semibold mt-6">Final PIV Calculation</h3>
              <div className="bg-gray-800 p-4 rounded-md">
                <p className="font-mono">PIV = ((RCS × ICF) + SC) × OSM × K/D_Multiplier</p>
                <p className="mt-2 text-sm text-gray-400">Where:</p>
                <ul className="list-disc list-inside text-sm text-gray-400 mt-1 space-y-1">
                  <li>RCS = 50% Advanced Metrics + 50% Basic Metrics</li>
                  <li>K/D_Multiplier includes standard and superstar bonuses</li>
                  <li>Final PIV is displayed as PIV × 100 (e.g., 0.82 → 82)</li>
                </ul>
              </div>
              
              <h3 className="text-xl font-semibold mt-6">Role Weighting System</h3>
              <div className="bg-gray-800 p-4 rounded-md">
                <p className="font-medium">For non-IGLs:</p>
                <p className="font-mono">PIV = (T-side PIV × 0.5) + (CT-side PIV × 0.5)</p>
                
                <p className="font-medium mt-3">For IGLs:</p>
                <p className="font-mono">PIV = (IGL PIV × 0.5) + (T-side PIV × 0.25) + (CT-side PIV × 0.25)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">TIR (Team Impact Rating) Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Team Impact Rating (TIR) combines the individual PIV scores of all players on a team with a team synergy component.
              </p>
              
              <h3 className="text-xl font-semibold mt-4">TIR Formula Components</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Calculation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Sum PIV</TableCell>
                    <TableCell>Sum of all player PIV values</TableCell>
                    <TableCell>∑ PIV for all players</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Average PIV</TableCell>
                    <TableCell>Average PIV across all players</TableCell>
                    <TableCell>Sum PIV ÷ Player Count</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Synergy Factor</TableCell>
                    <TableCell>Measures how well the team works together</TableCell>
                    <TableCell>Role balance + complementary play styles</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              
              <h3 className="text-xl font-semibold mt-6">Final TIR Calculation</h3>
              <div className="bg-gray-800 p-4 rounded-md">
                <p className="font-mono">TIR = Sum PIV × (1 + Synergy Factor)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="roles" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">CS2 Role System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our role system assigns each player both a CT-side and T-side role, plus an optional IGL designation.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div>
                  <h3 className="text-xl font-semibold">T-Side Roles</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-500">Spacetaker</Badge>
                        </TableCell>
                        <TableCell>Entry fraggers who create space for the team</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-500">Lurker</Badge>
                        </TableCell>
                        <TableCell>Flankers and late-round clutch players</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-500">Support</Badge>
                        </TableCell>
                        <TableCell>Utility-focused players who support entry fraggers</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-900/30 text-amber-400 border-amber-500">AWP (T)</Badge>
                        </TableCell>
                        <TableCell>Primary AWPer on T-side</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold">CT-Side Roles</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500">Anchor</Badge>
                        </TableCell>
                        <TableCell>Site defenders who hold positions</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline" className="bg-cyan-900/30 text-cyan-400 border-cyan-500">Rotator</Badge>
                        </TableCell>
                        <TableCell>Mobile players who move between sites</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <Badge variant="outline" className="bg-amber-900/30 text-amber-400 border-amber-500">AWP (CT)</Badge>
                        </TableCell>
                        <TableCell>Primary AWPer on CT-side</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-xl font-semibold">Special Role: IGL</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Special Treatment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-900/30 text-orange-400 border-orange-500">IGL</Badge>
                      </TableCell>
                      <TableCell>In-game leader who makes tactical decisions</TableCell>
                      <TableCell>
                        <ul className="list-disc list-inside text-sm">
                          <li>Has 3 roles: IGL + T + CT</li>
                          <li>PIV weighted 50% IGL, 25% T, 25% CT</li>
                          <li>ICF adjusted to account for IGL duties</li>
                        </ul>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
                            
              <h3 className="text-xl font-semibold mt-6">Primary Role Determination</h3>
              <p className="text-gray-400 mb-2">
                When displaying a player's primary role, we use these priority rules:
              </p>
              <div className="bg-gray-800 p-4 rounded-md">
                <ol className="list-decimal list-inside space-y-1">
                  <li>If player is an IGL → Primary Role = IGL</li>
                  <li>If player has AWP as either T or CT role → Primary Role = AWP</li>
                  <li>If T and CT roles are the same → Primary Role = that role</li>
                  <li>Otherwise → Primary Role = T-side role</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Key Metrics System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Our analytics system uses two sets of metrics: Advanced Role-Specific Metrics and Basic Consistency Metrics.
              </p>
              
              <div className="bg-gray-800 p-4 rounded-md mt-4">
                <h3 className="text-lg font-semibold">Metrics Weighting</h3>
                <p className="text-gray-400 mb-2">Current weights in PIV calculation:</p>
                <ul className="list-disc list-inside">
                  <li>Advanced Role-Specific Metrics: <span className="font-semibold text-blue-400">50%</span></li>
                  <li>Basic Consistency Metrics: <span className="font-semibold text-blue-400">50%</span></li>
                </ul>
                <p className="text-gray-400 mt-2 text-sm">These weights can be adjusted in the Role Weightings tab.</p>
              </div>
              
              <h3 className="text-xl font-semibold mt-6">Advanced Role-Specific Metrics</h3>
              <p className="text-gray-400 mb-4">
                Each role has its own set of metrics that measure performance specific to that role's responsibilities.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold">
                    <Badge variant="outline" className="bg-amber-900/30 text-amber-400 border-amber-500 mr-2">AWP</Badge>
                    Key Metrics
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Opening Pick Success Rate</li>
                    <li>Multi Kill Conversion</li>
                    <li>Site Lockdown Rate</li>
                    <li>Entry Denial Efficiency</li>
                    <li>Angle Hold Success</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold">
                    <Badge variant="outline" className="bg-red-900/30 text-red-400 border-red-500 mr-2">Spacetaker</Badge>
                    Key Metrics
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Opening Duel Success Rate</li>
                    <li>Aggression Efficiency Index</li>
                    <li>First Blood Impact</li>
                    <li>Trade Conversion Rate</li>
                    <li>Space Creation Index</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold">
                    <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-500 mr-2">Lurker</Badge>
                    Key Metrics
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Flank Success Rate</li>
                    <li>Clutch Conversion Rate</li>
                    <li>Information Gathering Efficiency</li>
                    <li>Rotation Disruption Impact</li>
                    <li>Delayed Timing Effectiveness</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold">
                    <Badge variant="outline" className="bg-orange-900/30 text-orange-400 border-orange-500 mr-2">IGL</Badge>
                    Key Metrics
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-300">
                    <li>Tactical Timeout Success</li>
                    <li>Team Economy Preservation</li>
                    <li>Kill Participation Index</li>
                    <li>Opening Play Success Rate</li>
                    <li>Adaptive Defense Score</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mt-6">Basic Consistency Metrics</h3>
              <p className="text-gray-400 mb-4">
                These basic metrics apply to all players regardless of role and measure fundamental consistency.
              </p>
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Importance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>K/D Ratio</TableCell>
                    <TableCell>Kills divided by deaths</TableCell>
                    <TableCell>Very High</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Headshot Percentage</TableCell>
                    <TableCell>Percentage of kills that are headshots</TableCell>
                    <TableCell>Medium</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Opening Duel Success</TableCell>
                    <TableCell>First kills minus first deaths</TableCell>
                    <TableCell>High</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Utility Efficiency</TableCell>
                    <TableCell>Flash assists divided by utility thrown</TableCell>
                    <TableCell>Medium</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>KAST Approximation</TableCell>
                    <TableCell>Estimated from kills, assists per round</TableCell>
                    <TableCell>High</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="changelog" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Development Changelog</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold flex items-center">
                    <span className="text-gray-400 mr-2">v1.2</span>
                    April 24, 2024 - PIV Formula Rebalancing
                  </h3>
                  <Separator className="my-2" />
                  <ul className="list-disc list-inside space-y-2 pl-1">
                    <li>
                      <span className="font-semibold">Enhanced K/D multiplier system</span>
                      <p className="text-gray-400 ml-6 text-sm">Significantly increased K/D impact through double multiplier system: base multiplier for 1.2+ K/D and superstar multiplier for 1.5+ K/D</p>
                    </li>
                    <li>
                      <span className="font-semibold">Complete rewrite of ICF calculation</span>
                      <p className="text-gray-400 ml-6 text-sm">Star players (1.4+ K/D) now receive significantly higher consistency ratings than before</p>
                    </li>
                    <li>
                      <span className="font-semibold">Role-specific SC improvements</span>
                      <p className="text-gray-400 ml-6 text-sm">AWPers, Spacetakers and Lurkers now have metrics that better reflect their impact with higher weights for K/D and opening kills</p>
                    </li>
                    <li>
                      <span className="font-semibold">Additional K/D factor in PIV formula</span>
                      <p className="text-gray-400 ml-6 text-sm">Added special modifier for 1.4+ K/D players to ensure star players receive appropriate recognition</p>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold flex items-center">
                    <span className="text-gray-400 mr-2">v1.1</span>
                    April 23, 2024 - Rating System Adjustments
                  </h3>
                  <Separator className="my-2" />
                  <ul className="list-disc list-inside space-y-2 pl-1">
                    <li>
                      <span className="font-semibold">Integrated Basic Consistency Metrics</span>
                      <p className="text-gray-400 ml-6 text-sm">Added basic metrics set with 50% weighting while reducing existing advanced metrics to 50%</p>
                    </li>
                    <li>
                      <span className="font-semibold">Role Weighting Controls</span>
                      <p className="text-gray-400 ml-6 text-sm">Added weight adjustment sliders in Role Weightings page with Apply and Reset functionality</p>
                    </li>
                    <li>
                      <span className="font-semibold">PIV Calculation Logic Update</span>
                      <p className="text-gray-400 ml-6 text-sm">Updated weighting formula: non-IGLs (50% CT/50% T) and IGLs (50% IGL/25% CT/25% T)</p>
                    </li>
                    <li>
                      <span className="font-semibold">Display Format Standardization</span>
                      <p className="text-gray-400 ml-6 text-sm">Fixed PIV display inconsistencies to show properly scaled values (multiplied by 100)</p>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold flex items-center">
                    <span className="text-gray-400 mr-2">v1.0</span>
                    April 20, 2024 - Initial Release
                  </h3>
                  <Separator className="my-2" />
                  <ul className="list-disc list-inside space-y-2 pl-1">
                    <li>
                      <span className="font-semibold">Initial PIV Calculation System</span>
                      <p className="text-gray-400 ml-6 text-sm">Created base formula using RCS, ICF, SC, and OSM components</p>
                    </li>
                    <li>
                      <span className="font-semibold">Dual Role Assignment System</span>
                      <p className="text-gray-400 ml-6 text-sm">Implemented CT/T role separation with IGL detection</p>
                    </li>
                    <li>
                      <span className="font-semibold">TIR Team Rating</span>
                      <p className="text-gray-400 ml-6 text-sm">Implemented team rating system based on player PIVs and synergy</p>
                    </li>
                    <li>
                      <span className="font-semibold">CSV Data Integration</span>
                      <p className="text-gray-400 ml-6 text-sm">Added parsers for player stats, round data, and role assignment</p>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}