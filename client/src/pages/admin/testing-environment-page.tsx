import { ProtectedRoute } from "../components/auth/protected-route";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { motion } from "framer-motion";
import { Beaker, ArrowLeft, Map, Activity, Users, Share2, Crosshair } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { AdvancedXYZAnalysis } from "../components/admin/AdvancedXYZAnalysis";

export default function TestingEnvironmentPage() {
  return (
    <ProtectedRoute adminOnly>
      <motion.div 
        className="container mx-auto py-8 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Testing Environment</h1>
              <p className="text-blue-300/70">Prototype and test new analytical features</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Badge variant="outline" className="bg-blue-900/30 text-blue-300 border-blue-700">
              Alpha Testing
            </Badge>
          </motion.div>
        </div>

        <Tabs defaultValue="xyz-analysis" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto bg-blue-950/40 border border-blue-900/50">
            <TabsTrigger value="xyz-analysis" className="data-[state=active]:bg-blue-800/30">
              <div className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                <span>Positional Analysis</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="role-effectiveness" className="data-[state=active]:bg-blue-800/30">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Role Effectiveness</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="utility-analysis" className="data-[state=active]:bg-blue-800/30">
              <div className="flex items-center gap-2">
                <Crosshair className="h-4 w-4" />
                <span>Utility Analysis</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Positional Analysis */}
          <TabsContent value="xyz-analysis" className="space-y-6">
            <Card className="glassmorphism border-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-400" />
                  Positional Analysis Test
                </CardTitle>
                <CardDescription>
                  Testing environment for map-based data visualization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Map Visualization Component - Full Width */}
                  <div className="w-full">
                    <AdvancedXYZAnalysis />
                  </div>
                  
                  <Separator className="my-6 bg-blue-900/30" />
                  
                  {/* Implementation Details */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Implementation Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-blue-950/30 border border-blue-900/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Share2 className="h-4 w-4 text-blue-400" />
                            Data Processing Pipeline
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 text-sm text-blue-300/80">
                          <p>Parse XYZ positional data from round logs and process into structured analytics</p>
                          <div className="mt-2 flex justify-between text-xs">
                            <Badge variant="outline" className="bg-green-950/30 text-green-400 border-green-900/50">Completed</Badge>
                            <span className="text-blue-300/60">Phase 1/3</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-950/30 border border-blue-900/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-400" />
                            Visualization Engine
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 text-sm text-blue-300/80">
                          <p>Create interactive 2D/3D visualizations of player movements and positions</p>
                          <div className="mt-2 flex justify-between text-xs">
                            <Badge variant="outline" className="bg-green-950/30 text-green-400 border-green-900/50">Completed</Badge>
                            <span className="text-blue-300/60">Phase 2/3</span>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-950/30 border border-blue-900/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Crosshair className="h-4 w-4 text-blue-400" />
                            Metric Integration
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-2 text-sm text-blue-300/80">
                          <p>Integrate positional metrics into existing PIV and TIR calculations</p>
                          <div className="mt-2 flex justify-between text-xs">
                            <Badge variant="outline" className="bg-amber-950/30 text-amber-400 border-amber-900/50">In Progress</Badge>
                            <span className="text-blue-300/60">Phase 3/3</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Role Effectiveness Tab */}
          <TabsContent value="role-effectiveness">
            <Card className="glassmorphism border-glow p-6">
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-4">
                  <Beaker className="h-12 w-12 text-blue-400/30 mx-auto" />
                  <h3 className="text-xl font-medium">Role Effectiveness Analysis</h3>
                  <p className="text-blue-300/70 max-w-lg">
                    This feature will analyze how effectively players fulfill their assigned roles
                    based on positional data and decision making.
                  </p>
                  <Badge variant="outline" className="bg-blue-950/30 text-blue-300 border-blue-900/50 mx-auto">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          {/* Utility Analysis Tab */}
          <TabsContent value="utility-analysis">
            <Card className="glassmorphism border-glow p-6">
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-4">
                  <Beaker className="h-12 w-12 text-blue-400/30 mx-auto" />
                  <h3 className="text-xl font-medium">Utility Usage Analysis</h3>
                  <p className="text-blue-300/70 max-w-lg">
                    This feature will analyze grenade usage effectiveness, flash assists,
                    smoke coverage, and utility damage based on positional data.
                  </p>
                  <Badge variant="outline" className="bg-blue-950/30 text-blue-300 border-blue-900/50 mx-auto">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </ProtectedRoute>
  );
}