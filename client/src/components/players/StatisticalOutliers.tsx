import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { PlayerWithPIV, PlayerRole } from '@shared/schema';
import {
  Target, Gauge, Lightbulb, TrendingUp, Zap, Sparkles, Shield, Activity
} from 'lucide-react';

interface StatisticalOutlierProps {
  players: PlayerWithPIV[];
}

interface OutlierCategory {
  title: string;
  description: string;
  metricKey: string;
  icon: React.ReactNode;
  gradient: string;
  calculation: (players: PlayerWithPIV[]) => PlayerWithPIV | null;
}

export default function StatisticalOutliers({ players }: StatisticalOutlierProps) {
  const [, setLocation] = useLocation();

  if (!players || players.length === 0) {
    return null;
  }

  // Define categories for statistical outliers
  const outlierCategories: OutlierCategory[] = [
    {
      title: "Opening Kill Specialist",
      description: "Highest first kill success rate",
      metricKey: "First Blood Impact",
      icon: <Target className="h-6 w-6 text-amber-400" />,
      gradient: "from-amber-700 to-amber-500",
      calculation: (players) => {
        return players
          .filter(p => p.rawStats.firstKills > 0)
          .sort((a, b) => (
            (b.rawStats.firstKills / Math.max(b.rawStats.firstKills + b.rawStats.firstDeaths, 1)) -
            (a.rawStats.firstKills / Math.max(a.rawStats.firstKills + a.rawStats.firstDeaths, 1))
          ))[0] || null;
      }
    },
    {
      title: "Pistol Master",
      description: "Best pistol round performance",
      metricKey: "Pistol Round Rating",
      icon: <Zap className="h-6 w-6 text-red-400" />,
      gradient: "from-red-700 to-red-500",
      calculation: (players) => {
        return players
          .filter(p => p.rawStats.kills > 0) // Ensure some baseline activity
          .map(player => {
            // Calculate a pistol score based on utility usage and effectiveness in pistol rounds
            const pistolUtilityUsage = (
              player.rawStats.flashesThrownInPistolRound +
              player.rawStats.heThrownInPistolRound +
              player.rawStats.infernosThrownInPistolRound +
              player.rawStats.smokesThrownInPistolRound
            );
            // Combine with first kill ratio to measure overall pistol round impact
            const firstKillRatio = player.rawStats.firstKills / Math.max(player.rawStats.firstKills + player.rawStats.firstDeaths, 1);
            // Create a composite pistol score
            const pistolScore = (pistolUtilityUsage * 0.6) + (firstKillRatio * 0.4);
            return { ...player, pistolScore };
          })
          .sort((a, b) => b.pistolScore - a.pistolScore)[0] || null;
      }
    },
    {
      title: "Utility Master",
      description: "Most effective utility usage",
      metricKey: "Utility Effectiveness",
      icon: <Sparkles className="h-6 w-6 text-blue-400" />,
      gradient: "from-blue-700 to-blue-500",
      calculation: (players) => {
        return players
          .filter(p => p.rawStats.totalUtilityThrown > 20) // Minimum utility usage
          .sort((a, b) => (
            (b.rawStats.assistedFlashes / Math.max(b.rawStats.flashesThrown, 1)) -
            (a.rawStats.assistedFlashes / Math.max(a.rawStats.flashesThrown, 1))
          ))[0] || null;
      }
    },
    {
      title: "Clutch Master",
      description: "Highest impact in critical moments",
      metricKey: "Clutch Factor",
      icon: <TrendingUp className="h-6 w-6 text-green-400" />,
      gradient: "from-green-700 to-green-500",
      calculation: (players) => {
        // For clutch masters, we'll look at players with highest blind kills,
        // through smoke kills, and low first deaths (suggesting they're often last alive)
        const clutchScore = players.map(p => {
          const blindFactor = p.rawStats.blindKills / Math.max(p.rawStats.kills, 1);
          const smokeFactor = p.rawStats.throughSmoke / Math.max(p.rawStats.kills, 1);
          const survivalFactor = 1 - (p.rawStats.firstDeaths / Math.max(p.rawStats.deaths, 1));
          
          return {
            player: p,
            score: blindFactor + smokeFactor + (survivalFactor * 2) // Weight survival higher
          };
        });
        
        return clutchScore.sort((a, b) => b.score - a.score)[0]?.player || null;
      }
    },
    {
      title: "Consistency King",
      description: "Most reliable performance",
      metricKey: "Consistency Factor",
      icon: <Activity className="h-6 w-6 text-purple-400" />,
      gradient: "from-purple-700 to-purple-500",
      calculation: (players) => {
        // For consistency, we'll use players with lowest variance in performance
        // A good proxy is K/D that's consistently >1.0, with balanced CT and T side metrics
        const consistencyScore = players
          .filter(p => p.kd >= 0.9 && typeof p.ctPIV === 'number' && typeof p.tPIV === 'number')
          .map(p => {
            // Calculate difference between CT and T performance (less difference = more consistent)
            // TypeScript safety: we've already filtered for players with numeric ctPIV and tPIV
            const sideDiff = Math.abs(p.ctPIV! - p.tPIV!);
            const kdBonus = p.kd > 1.0 ? (p.kd - 1.0) * 2 : 0; // Bonus for KD above 1.0
            
            return {
              player: p,
              score: (p.piv * 2) - sideDiff + kdBonus
            };
          });
        
        return consistencyScore.sort((a, b) => b.score - a.score)[0]?.player || null;
      }
    }
  ];

  // Calculate outliers
  const outliers = outlierCategories.map(category => {
    const player = category.calculation(players);
    return {
      ...category,
      player
    };
  }).filter(outlier => outlier.player !== null);

  // Stagger animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    },
    hover: {
      y: -5,
      scale: 1.03,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  if (outliers.length === 0) {
    return null;
  }

  // Format a metric value as a percentage
  const formatMetricValue = (player: PlayerWithPIV, metricKey: string): string => {
    // For pistol round rating
    if (metricKey === "Pistol Round Rating") {
      // Get pistol utility count
      const pistolUtility = (
        player.rawStats.flashesThrownInPistolRound +
        player.rawStats.heThrownInPistolRound +
        player.rawStats.infernosThrownInPistolRound +
        player.rawStats.smokesThrownInPistolRound
      );
      return `${pistolUtility} util`;
    }
    
    // For first blood impact
    if (metricKey === "First Blood Impact") {
      const openingKillSuccess = (player.rawStats.firstKills / Math.max(player.rawStats.firstKills + player.rawStats.firstDeaths, 1)) * 100;
      return `${openingKillSuccess.toFixed(1)}%`;
    }

    // For utility effectiveness
    if (metricKey === "Utility Effectiveness") {
      const flashAssists = (player.rawStats.assistedFlashes / Math.max(player.rawStats.flashesThrown, 1)) * 100;
      return `${flashAssists.toFixed(1)}%`;
    }

    // For other metrics, just use PIV as fallback
    return `${Math.round(player.piv * 100)} PIV`;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <motion.h2 
          className="text-xl font-bold text-gradient"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Statistical Outliers
        </motion.h2>
        <motion.div 
          className="ml-3 px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-500/30 text-xs text-blue-300"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Players excelling in specific metrics
        </motion.div>
      </div>

      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {outliers.map((outlier, index) => (
          <motion.div
            key={outlier.title}
            className="glassmorphism border-glow rounded-lg overflow-hidden cursor-pointer"
            variants={itemVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => outlier.player && setLocation(`/players/${outlier.player.id}`)}
          >
            <div className={`bg-gradient-to-r ${outlier.gradient} p-4 relative`}>
              <div className="absolute top-0 right-0 mt-2 mr-2">
                {outlier.icon}
              </div>
              
              <h3 className="font-bold text-white text-md">{outlier.title}</h3>
              <p className="text-white/80 text-xs mt-1">{outlier.description}</p>
            </div>
            
            {outlier.player && (
              <div className="p-3">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-900/30 border border-blue-500/30 flex items-center justify-center text-sm font-bold text-white mr-2">
                    {outlier.player.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-white">{outlier.player.name}</div>
                    <div className="text-xs text-blue-300">{outlier.player.team}</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-2 text-sm">
                  <div className="text-blue-300">{outlier.metricKey}</div>
                  <div className="font-semibold text-green-400">
                    {formatMetricValue(outlier.player, outlier.metricKey)}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
