import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Users, 
  BarChart3, 
  Layers, 
  BarChart2, 
  GitPullRequest, 
  Scale
} from "lucide-react";

export default function DocumentationPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-gradient">CS2 Analytics Documentation</h1>
      <p className="text-gray-400 mb-8">
        This page documents the methodology and development of the CS2 Analytics system.
      </p>
      
      <Tabs defaultValue="piv" className="mb-12">
        <TabsList className="grid w-full md:w-auto md:inline-flex grid-cols-3 md:grid-cols-none mb-6">
          <TabsTrigger value="piv" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>PIV Formula</span>
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Role System</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Key Metrics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="piv" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Player Impact Value (PIV) Formula
              </CardTitle>
              <CardDescription>
                A comprehensive rating system for player performance in CS2.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Core Formula</h3>
              <div className="bg-black/20 p-4 rounded-md font-mono text-sm">
                PIV = (RCS * ICF * SC * OSM) * (K/D Multiplier)
              </div>
              <p>Where:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>RCS (Role Core Score):</strong> Measures how well a player executes their role-specific responsibilities.
                </li>
                <li>
                  <strong>ICF (Individual Consistency Factor):</strong> Rewards consistency and high performance across matches. Recently improved to better value high K/D players.
                </li>
                <li>
                  <strong>SC (Synergy Contribution):</strong> Measures how a player contributes to team synergy through role-specific actions.
                </li>
                <li>
                  <strong>OSM (Opponent Strength Multiplier):</strong> Adjusts scores based on the quality of opposition.
                </li>
                <li>
                  <strong>K/D Multiplier:</strong> An additional factor that rewards exceptional K/D ratios. Enhanced in v1.2 to better recognize star players.
                </li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-8">Recent Improvements</h3>
              <div className="space-y-4">
                <div className="border border-gray-700 rounded-md p-3">
                  <h4 className="font-medium text-primary mb-2">Enhanced K/D Multiplier</h4>
                  <p className="text-sm">The K/D threshold for multiplier activation was lowered from 1.5 to 1.2, better rewarding good fraggers. The multiplier scale was also adjusted to provide more value to exceptional performers like ZywOo (1.47x) and donk (1.36x).</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-3">
                  <h4 className="font-medium text-primary mb-2">ICF Calculation Refinement</h4>
                  <p className="text-sm">The ICF formula was refined to prevent penalizing high-performing players. The sigma value calculation now better accommodates consistent star performers, resulting in more accurate reflection of their contributions.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-3">
                  <h4 className="font-medium text-primary mb-2">Role-Specific Metric Adjustments</h4>
                  <p className="text-sm">Weights for AWPer metrics were increased to better value their impact. Similarly, Spacetaker and Lurker metrics were recalibrated to ensure proper valuation of their unique contributions.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-400">
              Last updated: April 24, 2024
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                CS2 Role System
              </CardTitle>
              <CardDescription>
                Understanding the role classification system used in CS2 Analytics.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Role Structure</h3>
              <p>Our analytics system uses a dual-role approach, recognizing that players perform different functions on T and CT sides:</p>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-yellow-400 mb-2">T-Side Roles</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Support:</strong> Utility and teamplay specialists</li>
                    <li><strong>Spacetaker:</strong> Entry fraggers and map control specialists</li>
                    <li><strong>Lurker:</strong> Solo map control and rotation specialists</li>
                    <li><strong>AWP(T):</strong> T-side snipers and pick specialists</li>
                  </ul>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-blue-400 mb-2">CT-Side Roles</h4>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Anchor:</strong> Site defenders and rotation specialists</li>
                    <li><strong>Rotator:</strong> Mobile defenders and support players</li>
                    <li><strong>AWP(CT):</strong> CT-side snipers and angle holders</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-black/20 p-4 rounded-md mt-6">
                <h4 className="font-medium text-primary mb-2">IGL Role Weighting</h4>
                <p className="text-sm">In-Game Leaders (IGLs) have a special role weighting:</p>
                <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
                  <li>50% weight on IGL metrics</li>
                  <li>25% weight on CT-side role</li>
                  <li>25% weight on T-side role</li>
                </ul>
                <p className="text-sm mt-2">Non-IGLs have a 50/50 split between T and CT side metrics.</p>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Role Assignment</h3>
              <p>Players are assigned roles based on:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Explicit role assignments from team data (when available)</li>
                <li>Statistical analysis of play patterns (when role data is unavailable)</li>
                <li>Special consideration for IGL identification based on team structure</li>
              </ul>
              
              <div className="bg-primary/10 p-4 rounded-md mt-6">
                <h4 className="font-medium text-primary mb-2">Role Metric Weighting</h4>
                <p className="text-sm">Each role has specific metrics that are weighted to calculate the Role Core Score (RCS). These weights can be customized in the Role Weightings page of the application.</p>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-400">
              Last updated: April 24, 2024
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Key Metrics & Calculations
              </CardTitle>
              <CardDescription>
                Understanding the metrics used in the CS2 Analytics system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Player Impact Value (PIV)</h3>
              <p>PIV is our primary player rating system, displayed as a score from 0-100:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>90-100:</strong> Exceptional (world-class star player)</li>
                <li><strong>80-89:</strong> Elite (top tier player)</li>
                <li><strong>70-79:</strong> Very Good (strong team contributor)</li>
                <li><strong>60-69:</strong> Good (solid performer)</li>
                <li><strong>50-59:</strong> Average (meets role expectations)</li>
                <li><strong>Below 50:</strong> Below average (underperforming)</li>
              </ul>
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">RCS (Role Core Score)</h4>
                  <p className="text-sm">Measures how well a player fulfills their role-specific responsibilities. Calculated as a weighted average of normalized role-specific metrics.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">ICF (Individual Consistency Factor)</h4>
                  <p className="text-sm">Measures a player's consistency and raw performance. Takes into account K/D ratio, kills per round, and performance variation (sigma).</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">SC (Synergy Contribution)</h4>
                  <p className="text-sm">Measures how a player contributes to team success through role-specific actions like assists, flash assists, and utility usage.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">OSM (Opponent Strength Multiplier)</h4>
                  <p className="text-sm">Adjusts ratings based on the quality of opposition faced. Currently using a placeholder value until more match data is available.</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Team Impact Rating (TIR)</h3>
              <p>TIR evaluates overall team performance:</p>
              <div className="bg-black/20 p-4 rounded-md mt-2 font-mono text-sm">
                TIR = (Sum of player PIVs) * (Team Synergy Factor)
              </div>
              <p className="mt-4">The Team Synergy Factor is calculated based on:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Role coverage and balance within the team</li>
                <li>Complementary skill distribution</li>
                <li>Performance variance across players</li>
              </ul>
              
              <div className="border border-primary/20 rounded-md p-4 mt-6">
                <h4 className="font-medium text-primary mb-2">Data Sources</h4>
                <p className="text-sm">Current analysis is based on data from IEM Katowice 2025, with player role information sourced from team rosters and historical play patterns.</p>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-400">
              Last updated: April 24, 2024
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5 text-primary" />
                Development Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="font-medium">PIV Formula Enhancements</h4>
                    <p className="text-sm text-gray-400">Improved K/D multiplier and ICF calculations</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="font-medium">Role-Specific Metrics Tuning</h4>
                    <p className="text-sm text-gray-400">Balanced weights for role-specific metrics</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="font-medium">Custom Weighting Controls</h4>
                    <p className="text-sm text-gray-400">Added ability to adjust metric weights</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs mt-0.5">→</div>
                  <div>
                    <h4 className="font-medium">Match Prediction System</h4>
                    <p className="text-sm text-gray-400">Upcoming feature to predict match outcomes</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs mt-0.5">→</div>
                  <div>
                    <h4 className="font-medium">Player Development Tracking</h4>
                    <p className="text-sm text-gray-400">Track player growth over time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Recent Balance Changes
          </CardTitle>
          <CardDescription>
            Recent adjustments to the rating system to improve accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-3 py-1">
              <h4 className="font-medium">April 24, 2024 Update</h4>
              <ul className="list-disc pl-6 space-y-1 mt-1 text-sm">
                <li>Lowered K/D multiplier threshold from 1.5 to 1.2</li>
                <li>Enhanced ICF formula to better reward high K/D players</li>
                <li>Increased weight of AWPer metrics to properly value snipers</li>
                <li>Adjusted formula to display PIV values from 0-100 instead of 0-1</li>
                <li>Fixed PIV display inconsistencies throughout the application</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-3 py-1">
              <h4 className="font-medium">April 15, 2024 Update</h4>
              <ul className="list-disc pl-6 space-y-1 mt-1 text-sm">
                <li>Implemented separate T-side and CT-side role assignments</li>
                <li>Added special IGL metrics and weighting (50% IGL / 25% T / 25% CT)</li>
                <li>Added initial role weighting controls</li>
                <li>Implemented basic team synergy calculations</li>
              </ul>
            </div>
            
            <div className="border-l-4 border-gray-500 pl-3 py-1">
              <h4 className="font-medium">April 1, 2024 Release</h4>
              <ul className="list-disc pl-6 space-y-1 mt-1 text-sm">
                <li>Initial release of CS2 Analytics platform</li>
                <li>Basic PIV calculations and role assignments</li>
                <li>Player and team comparison functionality</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}