import { useState, useEffect } from "react";
import { PlayerWithPIV } from "../../../../shared/schema";
import { Slider } from "../../components/ui/slider";
import { Card, CardContent } from "../../components/ui/card";
import RoleBadge from "../../components/ui/role-badge";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ArrowLeftRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../components/ui/tooltip";

interface PerformanceComparisonSliderProps {
  player1: PlayerWithPIV | undefined;
  player2: PlayerWithPIV | undefined;
  activeTab: "overall" | "ct" | "t";
}

export default function PerformanceComparisonSlider({
  player1,
  player2,
  activeTab,
}: PerformanceComparisonSliderProps) {
  const [sliderValue, setSliderValue] = useState(50);
  const [compareMetric, setCompareMetric] = useState<"piv" | "kd" | "role" | "consistency">("piv");

  if (!player1 || !player2) {
    return <div className="text-center py-8">Select two players to compare</div>;
  }

  // Get metrics based on active tab
  const getMetricsForTab = (player: PlayerWithPIV) => {
    if (activeTab === "ct" && player.ctMetrics) {
      return player.ctMetrics;
    } else if (activeTab === "t" && player.tMetrics) {
      return player.tMetrics;
    } else {
      return player.metrics;
    }
  };

  const p1Metrics = getMetricsForTab(player1);
  const p2Metrics = getMetricsForTab(player2);

  // Get correct PIV value based on tab
  const getPlayerPIV = (player: PlayerWithPIV) => {
    if (activeTab === "ct" && typeof player.ctPIV === 'number') {
      return player.ctPIV;
    } else if (activeTab === "t" && typeof player.tPIV === 'number') {
      return player.tPIV;
    } else {
      return player.piv;
    }
  };

  // Calculate values for comparison
  const pivDiff = player1 && player2 ? getPlayerPIV(player1) - getPlayerPIV(player2) : 0;
  const kdDiff = player1 && player2 ? player1.kd - player2.kd : 0;
  const roleDiff = player1 && player2 && p1Metrics && p2Metrics ? p1Metrics.rcs.value - p2Metrics.rcs.value : 0;
  const consistencyDiff = player1 && player2 && p1Metrics && p2Metrics ? p1Metrics.icf.value - p2Metrics.icf.value : 0;

  // Calculate comparison percentage for slider
  const getComparisonValue = () => {
    if (!player1 || !player2 || !p1Metrics || !p2Metrics) {
      return 50;
    }
    
    switch (compareMetric) {
      case "piv":
        const p1piv = getPlayerPIV(player1);
        const p2piv = getPlayerPIV(player2);
        return (p1piv / (p1piv + p2piv)) * 100;
      case "kd":
        return (player1.kd / (player1.kd + player2.kd)) * 100;
      case "role":
        return (p1Metrics.rcs.value / (p1Metrics.rcs.value + p2Metrics.rcs.value)) * 100;
      case "consistency":
        return (p1Metrics.icf.value / (p1Metrics.icf.value + p2Metrics.icf.value)) * 100;
      default:
        return 50;
    }
  };

  // Format percentage for display
  const getPercentageDisplay = (value: number) => {
    return `${Math.round(value)}%`;
  };

  // Format comparison metrics for display
  const formatComparisonMetric = (value: number) => {
    const roundedValue = Math.round(value * 100);
    return `${roundedValue > 0 ? '+' : ''}${roundedValue}`;
  };

  // Get player advantage text
  const getPlayerAdvantageText = () => {
    if (!player1 || !player2) {
      return "Loading...";
    }
    
    let diff = 0;
    
    switch (compareMetric) {
      case "piv":
        diff = pivDiff;
        break;
      case "kd":
        diff = kdDiff;
        break;
      case "role":
        diff = roleDiff;
        break;
      case "consistency":
        diff = consistencyDiff;
        break;
    }

    const value = Math.abs(Math.round(diff * 100));
    
    if (value < 5) {
      return "Evenly matched";
    }
    
    if (diff > 0) {
      return `${player1.name} has a ${value}pt advantage`;
    } else {
      return `${player2.name} has a ${value}pt advantage`;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glassmorphism border-glow">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold flex items-center">
              <ArrowLeftRight className="mr-2 h-5 w-5 text-blue-400" />
              Performance Comparison Slider
            </h3>
            <Tabs
              value={compareMetric}
              onValueChange={(value) => setCompareMetric(value as any)}
              className="w-auto"
            >
              <TabsList className="grid grid-cols-4 w-[350px]">
                <TabsTrigger value="piv">PIV Rating</TabsTrigger>
                <TabsTrigger value="kd">K/D Ratio</TabsTrigger>
                <TabsTrigger value="role">Role Score</TabsTrigger>
                <TabsTrigger value="consistency">Consistency</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Player Cards */}
            <div className="grid grid-cols-2 gap-4">
              {player1 && p1Metrics ? (
                <div 
                  className={`rounded-lg p-4 ${sliderValue <= 50 ? 'bg-blue-950/30' : 'bg-blue-900/10'} 
                    transition-all duration-300 border ${sliderValue <= 50 ? 'border-blue-500/50' : 'border-transparent'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-sm font-medium">
                      {player1.team.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{player1.name}</div>
                      <div className="text-sm text-blue-300">{player1.team}</div>
                    </div>
                    <RoleBadge role={player1.role} className="ml-auto" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-blue-950/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">PIV Rating</div>
                      <div className="text-lg font-bold">{Math.round(getPlayerPIV(player1) * 100)}</div>
                      <div className={`text-xs ${pivDiff > 0 ? 'text-green-500' : pivDiff < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        {formatComparisonMetric(pivDiff)}
                      </div>
                    </div>
                    <div className="bg-blue-950/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">K/D Ratio</div>
                      <div className="text-lg font-bold">{player1.kd.toFixed(2)}</div>
                      <div className={`text-xs ${kdDiff > 0 ? 'text-green-500' : kdDiff < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        {formatComparisonMetric(kdDiff/2)}
                      </div>
                    </div>
                    <div className="bg-blue-950/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">Role Score</div>
                      <div className="text-lg font-bold">{Math.round(p1Metrics.rcs.value * 100)}</div>
                      <div className={`text-xs ${roleDiff > 0 ? 'text-green-500' : roleDiff < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        {formatComparisonMetric(roleDiff)}
                      </div>
                    </div>
                    <div className="bg-blue-950/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">Consistency</div>
                      <div className="text-lg font-bold">{Math.round(p1Metrics.icf.value * 100)}</div>
                      <div className={`text-xs ${consistencyDiff > 0 ? 'text-green-500' : consistencyDiff < 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        {formatComparisonMetric(consistencyDiff)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-4 bg-blue-900/10 flex items-center justify-center">
                  <div className="text-center">Loading player data...</div>
                </div>
              )}
              
              {player2 && p2Metrics ? (
                <div 
                  className={`rounded-lg p-4 ${sliderValue >= 50 ? 'bg-blue-950/30' : 'bg-blue-900/10'} 
                    transition-all duration-300 border ${sliderValue >= 50 ? 'border-blue-500/50' : 'border-transparent'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-blue-900/30 flex items-center justify-center text-sm font-medium">
                      {player2.team.substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{player2.name}</div>
                      <div className="text-sm text-blue-300">{player2.team}</div>
                    </div>
                    <RoleBadge role={player2.role} className="ml-auto" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-blue-950/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">PIV Rating</div>
                      <div className="text-lg font-bold">{Math.round(getPlayerPIV(player2) * 100)}</div>
                      <div className={`text-xs ${pivDiff < 0 ? 'text-green-500' : pivDiff > 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        {formatComparisonMetric(-pivDiff)}
                      </div>
                    </div>
                    <div className="bg-blue-950/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">K/D Ratio</div>
                      <div className="text-lg font-bold">{player2.kd.toFixed(2)}</div>
                      <div className={`text-xs ${kdDiff < 0 ? 'text-green-500' : kdDiff > 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        {formatComparisonMetric(-kdDiff/2)}
                      </div>
                    </div>
                    <div className="bg-blue-950/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">Role Score</div>
                      <div className="text-lg font-bold">{Math.round(p2Metrics.rcs.value * 100)}</div>
                      <div className={`text-xs ${roleDiff < 0 ? 'text-green-500' : roleDiff > 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        {formatComparisonMetric(-roleDiff)}
                      </div>
                    </div>
                    <div className="bg-blue-950/20 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-300 mb-1">Consistency</div>
                      <div className="text-lg font-bold">{Math.round(p2Metrics.icf.value * 100)}</div>
                      <div className={`text-xs ${consistencyDiff < 0 ? 'text-green-500' : consistencyDiff > 0 ? 'text-red-500' : 'text-blue-400'}`}>
                        {formatComparisonMetric(-consistencyDiff)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg p-4 bg-blue-900/10 flex items-center justify-center">
                  <div className="text-center">Loading player data...</div>
                </div>
              )}
            </div>
            
            {/* Slider */}
            <div className="relative py-6">
              <Slider
                defaultValue={[50]}
                value={[getComparisonValue()]}
                step={1}
                min={0}
                max={100}
                onValueChange={(value) => setSliderValue(value[0])}
                className="my-6"
              />
              
              <div className="absolute left-0 top-0 text-sm font-medium text-blue-400">
                {player1?.name || "Player 1"}
              </div>
              <div className="absolute right-0 top-0 text-sm font-medium text-blue-400">
                {player2?.name || "Player 2"}
              </div>
              
              <div className="flex justify-center items-center mt-2">
                <motion.div
                  key={getPlayerAdvantageText()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-blue-900/20 text-blue-200 rounded-full px-4 py-1 text-sm font-medium inline-flex items-center"
                >
                  <span>{getPlayerAdvantageText()}</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info size={14} className="ml-2 text-blue-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          This comparison shows relative performance in the selected metric.
                          The slider position is based on the ratio between players' scores.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}