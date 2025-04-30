import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  Users, 
  BarChart3, 
  Layers, 
  BarChart2, 
  GitPullRequest, 
  Scale,
  ArrowRightLeft,
  Percent,
  Image,
  Code,
  Database,
  FileJson,
  Library,
  Search,
  Download,
  FileDown
} from "lucide-react";
import { ScoutDocumentation } from "@/components/documentation/ScoutDocumentation";
import exportToPDF from "@/lib/pdfExport";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState("piv");
  
  // Handle PDF export
  const handleExportToPDF = () => {
    const filename = `CS2_Analytics_Documentation_${activeTab}.pdf`;
    exportToPDF("documentation-content", filename);
  };
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2 text-gradient">CS2 Analytics Documentation</h1>
      <p className="text-gray-400 mb-8">
        This page documents the methodology and development of the CS2 Analytics system.
      </p>
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Documentation Details</h2>
        <Button 
          onClick={handleExportToPDF}
          className="flex items-center gap-2"
          variant="outline"
        >
          <FileDown className="h-4 w-4" />
          Export as PDF
        </Button>
      </div>
      
      <div id="documentation-content">
        <Tabs 
          defaultValue="piv" 
          className="mb-12"
          value={activeTab}
          onValueChange={setActiveTab}
        >
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
            <TabsTrigger value="comparisons" className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              <span>Player Comparisons</span>
            </TabsTrigger>
            <TabsTrigger value="predictor" className="flex items-center gap-2">
              <Percent className="h-4 w-4" />
              <span>Match Predictor</span>
            </TabsTrigger>
            <TabsTrigger value="infographic" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              <span>Infographics</span>
            </TabsTrigger>
            <TabsTrigger value="scout" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <span>Scout</span>
            </TabsTrigger>
            <TabsTrigger value="architecture" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span>Technical</span>
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
                  PIV = (RCS * ICF * SC * OSM) * (K/D Multiplier) * (Role Modifier)
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
                  <li>
                    <strong>Role Modifier:</strong> Role-specific balancing factor introduced in v1.3 that ensures fair comparison across different roles (AWP: 0.90x, Support: 1.08x, IGL: 1.05x, Spacetaker: 1.03x).
                  </li>
                </ul>
                
                <h3 className="text-lg font-semibold mt-8">Recent Improvements</h3>
                <div className="space-y-4">
                  <div className="border border-gray-700 rounded-md p-3">
                    <h4 className="font-medium text-primary mb-2">Role Balancing System</h4>
                    <p className="text-sm">Introduced dedicated role-specific modifiers to ensure balanced representation across roles. AWPers receive a 0.90x modifier to prevent dominance, while Support (1.08x), IGL (1.05x), and Spacetaker (1.03x) roles receive slight boosts to ensure fair comparison.</p>
                  </div>
                
                  <div className="border border-gray-700 rounded-md p-3">
                    <h4 className="font-medium text-primary mb-2">AWP Impact Recalibration</h4>
                    <p className="text-sm">Reduced AWP role K/D weighting from 50% to 35% and added a utility component (15%) to better value team-oriented AWPers. Opening kill impact was lowered from 28% to 22% in basic metrics score to prevent over-valuation.</p>
                  </div>
                  
                  <div className="border border-gray-700 rounded-md p-3">
                    <h4 className="font-medium text-primary mb-2">Enhanced K/D Multiplier</h4>
                    <p className="text-sm">The K/D threshold for multiplier activation was lowered from 1.5 to 1.2, better rewarding good fraggers. The multiplier scale was also adjusted to provide more value to exceptional performers like ZywOo (1.47x) and donk (1.36x).</p>
                  </div>
                  
                  <div className="border border-gray-700 rounded-md p-3">
                    <h4 className="font-medium text-primary mb-2">ICF Calculation Refinement</h4>
                    <p className="text-sm">The ICF formula was refined to prevent penalizing high-performing players. The sigma value calculation now better accommodates consistent star performers, resulting in more accurate reflection of their contributions.</p>
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
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Key Metrics
                </CardTitle>
                <CardDescription>
                  Understanding the core metrics used in the CS2 Analytics system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-lg font-semibold">Core Statistical Metrics</h3>
                <p>The following metrics are tracked and analyzed by the CS2 Analytics system:</p>
                
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="border border-gray-700 rounded-md p-4">
                    <h4 className="font-medium text-primary mb-2">Fragging Metrics</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><strong>K/D Ratio:</strong> Kills per death</li>
                      <li><strong>KAST:</strong> % rounds with kill, assist, survival, or traded death</li>
                      <li><strong>Opening Kill %:</strong> Success rate of first duels</li>
                      <li><strong>Headshot %:</strong> Percentage of kills via headshot</li>
                      <li><strong>Multikill Rounds:</strong> Rounds with 2+ kills</li>
                      <li><strong>Impact Rating:</strong> Performance in high-impact situations</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-700 rounded-md p-4">
                    <h4 className="font-medium text-primary mb-2">Utility & Support Metrics</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><strong>Utility Damage:</strong> Damage dealt with utility</li>
                      <li><strong>Flash Assists:</strong> Kills assisted by flashbangs</li>
                      <li><strong>Smoke Success:</strong> Effectiveness of smoke deployments</li>
                      <li><strong>Trade Kills:</strong> Kills within 5s of teammate death</li>
                      <li><strong>Support Rating:</strong> Effectiveness of supportive actions</li>
                      <li><strong>Utility Usage:</strong> Effectiveness of utility deployment</li>
                    </ul>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mt-8">Advanced Composite Metrics</h3>
                <div className="border border-gray-700 rounded-md p-4 mt-4">
                  <h4 className="font-medium text-primary mb-2">Meta Performance Indicators</h4>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>
                      <strong>RCS (Role Core Score):</strong> Weighted average of role-specific metrics. Each role (AWP, Support, etc.) has a unique weighting of metrics that matter most for that role.
                    </li>
                    <li>
                      <strong>ICF (Individual Consistency Factor):</strong> Measures consistency across matches using statistical variance analysis. Higher values indicate more consistent performance.
                    </li>
                    <li>
                      <strong>SC (Synergy Contribution):</strong> Quantifies how a player contributes to team success through complementary play, calculated differently for each role.
                    </li>
                    <li>
                      <strong>OSM (Opponent Strength Multiplier):</strong> Contextualizes performance based on opponent quality. Performing well against higher-ranked teams yields a higher multiplier.
                    </li>
                    <li>
                      <strong>TIR (Team Impact Rating):</strong> Composite team rating that considers player PIVs, role balance, and synergy metrics.
                    </li>
                  </ul>
                </div>
                
                <h3 className="text-lg font-semibold mt-8">Role-Specific Metrics</h3>
                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                  <div className="border border-gray-700 rounded-md p-4">
                    <h4 className="font-medium text-yellow-400 mb-2">T-Side Special Metrics</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><strong>Entry Success Rate:</strong> Success in opening duels on T-side</li>
                      <li><strong>Site Control:</strong> Ability to take and control bombsites</li>
                      <li><strong>Map Control:</strong> Area control effectiveness on T-side</li>
                      <li><strong>Lurk Impact:</strong> Effectiveness in solo engagements</li>
                    </ul>
                  </div>
                  
                  <div className="border border-gray-700 rounded-md p-4">
                    <h4 className="font-medium text-blue-400 mb-2">CT-Side Special Metrics</h4>
                    <ul className="list-disc pl-6 space-y-1 text-sm">
                      <li><strong>Site Defense:</strong> Success in defending bombsites</li>
                      <li><strong>Rotation Speed:</strong> Effectiveness in rotating between sites</li>
                      <li><strong>Retake Success:</strong> Success rate in site retakes</li>
                      <li><strong>Anchor Rating:</strong> Performance as a site anchor</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-400">
                Last updated: April 29, 2024
              </CardFooter>
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
                <h4 className="font-medium">April 24, 2024 Update (v1.3)</h4>
                <ul className="list-disc pl-6 space-y-1 mt-1 text-sm">
                  <li>Rebalanced role impact with new role-specific PIV modifiers</li>
                  <li>Reduced AWP scoring weight (0.90x modifier) to prevent role dominance</li>
                  <li>Added utility component (15%) to AWP impact evaluation</li>
                  <li>Enhanced Support (1.08x) and IGL (1.05x) roles for better balance</li>
                  <li>Improved role representation across rating tiers</li>
                </ul>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-3 py-1">
                <h4 className="font-medium">April 24, 2024 Update (v1.2)</h4>
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
    </div>
  );
}