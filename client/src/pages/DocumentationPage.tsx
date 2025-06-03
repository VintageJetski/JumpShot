import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
import { ScoutDocumentation } from "../components/documentation/ScoutDocumentation";
import exportToPDF from "../lib/pdfExport";

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState("piv");
  
  // Handle PDF export - now exports all documentation as a single comprehensive PDF
  const handleExportToPDF = () => {
    // Create a comprehensive filename
    const filename = `CS2_Analytics_Documentation_Complete.pdf`;
    
    // Use the exportDocumentationToPDF function to generate a complete documentation PDF
    import('../lib/pdfExport').then(module => {
      module.exportDocumentationToPDF(filename);
    });
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
        
        <div id="documentation-content">
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

        <TabsContent value="comparisons" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                Player Comparison System
              </CardTitle>
              <CardDescription>
                Advanced side-by-side player comparison with radar charts and metric breakdowns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Feature Overview</h3>
              <p>The Player Comparison tool allows for detailed side-by-side analysis of two players, enabling users to:</p>
              
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Compare overall PIV ratings and metric breakdowns</li>
                <li>Visualize strengths and weaknesses with radar charts</li>
                <li>Analyze role-specific metrics for each player</li>
                <li>View side-by-side K/D, utility usage, and impact metrics</li>
                <li>Compare CT-side and T-side performance</li>
              </ul>
              
              <div className="bg-black/20 p-4 rounded-md mt-4">
                <h4 className="font-medium text-primary mb-2">Radar Chart Visualization</h4>
                <p className="text-sm">
                  The radar charts display 6 key metrics for each player, normalized to a 0-100 scale for easy visual comparison. The metrics displayed depend on the player's role, ensuring relevant comparisons between players.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Role-Specific Comparisons</h4>
                  <p className="text-sm">The system intelligently adapts comparisons based on player roles. When comparing players with different roles (e.g., AWPer vs. Support), the metrics are normalized and weighted to ensure fair assessment.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Side-Specific Analysis</h4>
                  <p className="text-sm">The comparison includes breakdowns of T-side and CT-side performance, allowing analysis of how players perform in their specific side roles (e.g., Lurker on T-side vs. Anchor on CT-side).</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Key Comparison Metrics</h3>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                  <span className="font-medium">Metric</span>
                  <span className="font-medium">Description</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span>PIV Rating</span>
                  <span className="text-sm text-gray-400">Overall Player Impact Value (0-100)</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span>K/D Ratio</span>
                  <span className="text-sm text-gray-400">Kills divided by deaths</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span>RCS (Role Core Score)</span>
                  <span className="text-sm text-gray-400">Role-specific performance metric</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span>ICF (Individual Consistency)</span>
                  <span className="text-sm text-gray-400">Consistency and raw performance</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span>SC (Synergy Contribution)</span>
                  <span className="text-sm text-gray-400">Contribution to team success</span>
                </div>
                
                <div className="flex justify-between items-center py-2">
                  <span>Role-Specific Metrics</span>
                  <span className="text-sm text-gray-400">Metrics relevant to player's primary role</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-400">
              Last updated: April 28, 2024
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="predictor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Match Prediction System
              </CardTitle>
              <CardDescription>
                Advanced analytics for predicting CS2 match outcomes with map-specific insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Prediction Methodology</h3>
              <p>The Match Predictor uses a multi-factor analysis system that considers:</p>
              
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Team Impact Ratings (TIR) with synergy calculations</li>
                <li>Individual player PIV ratings with role considerations</li>
                <li>Map-specific performance statistics</li>
                <li>Round-based metrics such as economy efficiency and pistol round success</li>
                <li>Historical head-to-head performance (when available)</li>
                <li>Contextual factors like recent form, roster changes, and tournament stage</li>
              </ul>
              
              <div className="bg-black/20 p-4 rounded-md mt-4">
                <h4 className="font-medium text-primary mb-2">Map Selection Impact</h4>
                <p className="text-sm">
                  The predictor heavily weights map-specific performance, as certain teams excel on particular maps. The system analyzes side-specific win rates (T vs. CT) on each map to provide nuanced predictions.
                </p>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Prediction Components</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Team Strength Analysis</h4>
                  <p className="text-sm">Core prediction based on team TIR ratings, player PIV scores, and role coverage. Teams with balanced role distributions and higher average PIV scores typically receive stronger predictions.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Map-Specific Adjustments</h4>
                  <p className="text-sm">Predictions are adjusted based on team performance on the selected map, including side win rates (T/CT), bombsite preferences, and utility usage patterns.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Economy & Round Analysis</h4>
                  <p className="text-sm">Insights from round-by-round data including pistol round success rates, force buy effectiveness, economic recovery patterns, and comeback factors.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Contextual Factors</h4>
                  <p className="text-sm">Adjustable factors such as recent form, roster changes, tournament importance, and stand-in players that can impact match outcomes beyond raw statistics.</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Result Interpretation</h3>
              <p className="mt-2">The prediction engine provides:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Win probability percentage for each team</li>
                <li>Map-specific advantages and key areas to watch</li>
                <li>Expected performance from key players (star players and IGLs)</li>
                <li>Round distribution predictions (close match vs. dominant performance)</li>
              </ul>
              
              <div className="bg-primary/10 p-4 rounded-md mt-6">
                <h4 className="font-medium text-primary mb-2">Accuracy Considerations</h4>
                <p className="text-sm">
                  The prediction system is designed to provide informed analytical insights, not gambling advice. Predictions represent statistical likelihood based on available data and should be interpreted as one tool in match analysis.
                </p>
              </div>
            </CardContent>
            <CardFooter className="text-sm text-gray-400">
              Last updated: April 28, 2024
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="infographic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Match Infographic Generator
              </CardTitle>
              <CardDescription>
                Create shareable visuals highlighting key match statistics and player performances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">Feature Overview</h3>
              <p>The Match Infographic Generator creates polished, shareable visualizations for team comparisons, including:</p>
              
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Head-to-head team statistics with TIR ratings</li>
                <li>Key player highlights with role designations</li>
                <li>Critical round-based metrics comparisons</li>
                <li>Map-specific performance analysis</li>
                <li>Team advantages and strengths</li>
                <li>Downloadable PNG format for sharing</li>
              </ul>
              
              <div className="bg-black/20 p-4 rounded-md mt-4">
                <h4 className="font-medium text-primary mb-2">Export & Sharing Options</h4>
                <p className="text-sm">
                  Infographics can be downloaded as high-quality PNG images or shared directly via the platform's sharing function. The system uses the html-to-image library to create crisp visuals suitable for social media or analytical presentations.
                </p>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Infographic Components</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Team Strengths Comparison</h4>
                  <p className="text-sm">Visual representation of team TIR ratings with key advantage areas highlighted. Teams' relative strengths are displayed with intuitive progress bars and advantage badges.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Key Players Showcase</h4>
                  <p className="text-sm">Highlight of top performers, AWPers, and IGLs from each team with their PIV ratings and role designations. Role badges are color-coded (blue for CT, orange for T, purple for IGL).</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Round Performance Metrics</h4>
                  <p className="text-sm">Side-by-side comparison of critical round-based metrics including pistol round win rates, economy efficiency, force buy success rates, and comeback factors.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Map Analysis</h4>
                  <p className="text-sm">Overview of common maps in the teams' map pools with CT and T side win percentages for each team, highlighting map advantages for potential match predictions.</p>
                </div>
              </div>
              
              <div className="bg-primary/10 p-4 rounded-md mt-6">
                <h4 className="font-medium text-primary mb-2">Use Cases</h4>
                <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                  <li><strong>Pre-match Analysis:</strong> Create shareable infographics for upcoming matches</li>
                  <li><strong>Post-match Breakdowns:</strong> Highlight statistics from completed matches</li>
                  <li><strong>Team Scouting:</strong> Generate reports on team strengths and weaknesses</li>
                  <li><strong>Social Media Content:</strong> Share insights with the CS2 community</li>
                  <li><strong>Analytical Presentations:</strong> Support strategic team analysis for coaches and analysts</li>
                </ul>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Technical Implementation</h3>
              <p className="text-sm">
                The infographic generator uses the html-to-image library to convert DOM elements to downloadable images. The implementation includes responsive design with precise layout control and user-friendly team selection.
              </p>
            </CardContent>
            <CardFooter className="text-sm text-gray-400">
              Last updated: April 28, 2024
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="scout" className="space-y-6">
          <ScoutDocumentation />
        </TabsContent>
        
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Technical Architecture
              </CardTitle>
              <CardDescription>
                Detailed breakdown of the system's technical implementation and data infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-lg font-semibold">System Overview</h3>
              <p>The CS2 Analytics platform uses a modern full-stack architecture:</p>
              
              <div className="grid md:grid-cols-3 gap-4 mt-4">
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    Database Layer
                  </h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>PostgreSQL database</li>
                    <li>Drizzle ORM for schema management</li>
                    <li>@neondatabase/serverless for connection</li>
                    <li>Hybrid storage pattern for complex objects</li>
                  </ul>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Backend Layer
                  </h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>Express.js REST API</li>
                    <li>TypeScript for type safety</li>
                    <li>CSV parsing with csv-parse</li>
                    <li>Custom analytics engines</li>
                    <li>Persistent storage interface</li>
                  </ul>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                    <Library className="h-4 w-4" />
                    Frontend Layer
                  </h4>
                  <ul className="list-disc pl-6 space-y-1 text-sm">
                    <li>React with TypeScript</li>
                    <li>TanStack Query for data fetching</li>
                    <li>Recharts for data visualization</li>
                    <li>Tailwind CSS with shadcn/ui components</li>
                    <li>html-to-image for export functionality</li>
                  </ul>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Data Processing Pipeline</h3>
              <div className="bg-black/20 p-4 rounded-md mt-2">
                <ol className="list-decimal pl-6 space-y-3 text-sm">
                  <li>
                    <strong>Data Ingestion:</strong> Parse CSV files from IEM Katowice 2025 dataset using custom parsers:
                    <ul className="list-disc pl-6 space-y-1 mt-1">
                      <li><code>parseCSVData()</code> - Extracts player statistics</li>
                      <li><code>parseRoundsCSV()</code> - Processes round-by-round data</li>
                      <li><code>parsePlayerRolesFromCSV()</code> - Loads team role assignments</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Role Assignment:</strong> Process raw player data through role detection algorithms:
                    <ul className="list-disc pl-6 space-y-1 mt-1">
                      <li>Direct assignment from role CSV when available</li>
                      <li>Fuzzy name matching for player identification</li>
                      <li>Statistical inference when role data is unavailable</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Metric Calculation:</strong> Generate derived metrics from raw statistics:
                    <ul className="list-disc pl-6 space-y-1 mt-1">
                      <li>Role-specific metrics for CT and T sides</li>
                      <li>Team-level aggregations</li>
                      <li>Round-based tactical metrics</li>
                    </ul>
                  </li>
                  <li>
                    <strong>PIV Calculation:</strong> Apply formula to processed metrics</li>
                  <li>
                    <strong>Database Storage:</strong> Store processed results in PostgreSQL with Drizzle ORM</li>
                  <li>
                    <strong>API Exposure:</strong> Serve processed data through REST endpoints</li>
                </ol>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Detailed Formula Implementations</h3>
              
              <div className="space-y-4 mt-4">
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">RCS (Role Core Score) Formula</h4>
                  <p className="text-sm">RCS calculates a weighted average of normalized role-specific metrics using custom weights for each role type (AWP, Support, etc.), resulting in a score that reflects how well a player performs within their specific role definition.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">ICF (Individual Consistency Factor) Formula</h4>
                  <p className="text-sm">ICF evaluates consistency and raw performance by combining K/D ratio (75% weight) with kills per round (25% weight) and adjusting by a sigma factor that rewards high-performers more. IGLs have a higher base sigma (0.4 vs 0.3) that recognizes their broader responsibilities.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">SC (Synergy Contribution) Formula</h4>
                  <p className="text-sm">SC calculates role-specific team contribution with different formulas per role. For example, AWP role uses opening pick impact (50%), K/D ratio (35%), and utility component (15%) to determine how they contribute to team success.</p>
                </div>
                
                <div className="border border-gray-700 rounded-md p-4">
                  <h4 className="font-medium text-primary mb-2">Team Impact Rating (TIR) Formula</h4>
                  <p className="text-sm">TIR calculates overall team strength by summing player PIV values and multiplying by a synergy factor that evaluates role coverage and complementary skills, then scaling by 10 for display purposes.</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Database Schema</h3>
              <p className="text-sm mt-2">Our PostgreSQL schema uses Drizzle ORM with three primary tables:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2 text-sm">
                <li><strong>players</strong> - Stores player data including roles, PIV values, and performance metrics</li>
                <li><strong>teams</strong> - Contains team names, TIR ratings, and synergy factors</li>
                <li><strong>roundMetrics</strong> - Stores detailed round-by-round performance metrics for each team</li>
              </ul>
              
              <h3 className="text-lg font-semibold mt-8">API Endpoints</h3>
              <div className="space-y-3 mt-2">
                <div className="border-b border-gray-700 pb-2">
                  <h4 className="font-medium text-primary">Player Endpoints</h4>
                  <p className="text-sm text-green-500 font-mono mt-1">GET /api/players</p>
                  <p className="text-xs mt-1">Returns all players with PIV ratings and metrics</p>
                  
                  <p className="text-sm text-green-500 font-mono mt-2">GET /api/players/:id</p>
                  <p className="text-xs mt-1">Returns detailed stats for a specific player</p>
                </div>
                
                <div className="border-b border-gray-700 pb-2">
                  <h4 className="font-medium text-primary">Team Endpoints</h4>
                  <p className="text-sm text-green-500 font-mono mt-1">GET /api/teams</p>
                  <p className="text-xs mt-1">Returns all teams with TIR ratings</p>
                  
                  <p className="text-sm text-green-500 font-mono mt-2">GET /api/teams/:name</p>
                  <p className="text-xs mt-1">Returns detailed stats for a specific team</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-primary">Round Metrics Endpoints</h4>
                  <p className="text-sm text-green-500 font-mono mt-1">GET /api/round-metrics/:teamName</p>
                  <p className="text-xs mt-1">Returns detailed round-based metrics for a team</p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold mt-8">Performance Optimizations</h3>
              <ul className="list-disc pl-6 space-y-2 mt-2 text-sm">
                <li>
                  <strong>Hybrid Storage Pattern:</strong> Complex objects are cached in memory while basic data is persisted in PostgreSQL
                </li>
                <li>
                  <strong>Data Precomputation:</strong> PIV, RCS, and other complex metrics are calculated during data ingestion rather than at query time
                </li>
                <li>
                  <strong>Efficient CSV Parsing:</strong> Streaming CSV parser with explicit type conversions for performance
                </li>
                <li>
                  <strong>React Query Caching:</strong> Frontend uses TanStack Query's caching to minimize redundant API calls
                </li>
                <li>
                  <strong>Lazy Loading:</strong> Components with heavy visualizations (like radar charts) use dynamic imports
                </li>
              </ul>
            </CardContent>
            <CardFooter className="text-sm text-gray-400">
              Last updated: April 28, 2024
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
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="font-medium">Match Prediction System</h4>
                    <p className="text-sm text-gray-400">Advanced match outcome prediction with map-specific analytics</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="font-medium">Player Comparison Tool</h4>
                    <p className="text-sm text-gray-400">Side-by-side player stat comparison with radar charts</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center text-xs mt-0.5">✓</div>
                  <div>
                    <h4 className="font-medium">Match Infographic Generator</h4>
                    <p className="text-sm text-gray-400">Create shareable match analysis infographics with key stats</p>
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
        </div>
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
  );
}