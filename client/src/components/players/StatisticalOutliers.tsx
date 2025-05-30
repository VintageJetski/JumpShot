import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { PlayerWithPIV } from '@shared/schema';
import { Target, Shield, CircleDot, Gauge, ZapIcon, Brain, FlameIcon, Users, Zap, Crosshair, Award } from 'lucide-react';

interface StatisticalOutliersProps {
  players: PlayerWithPIV[];
}

interface OutlierCard {
  title: string;
  player: PlayerWithPIV;
  statValue: number;
  bgGradient: string;
  icon: React.ReactNode;
  description: string;
}

const StatisticalOutliers: React.FC<StatisticalOutliersProps> = ({ players }) => {
  const [, setLocation] = useLocation();
  
  // Find outliers based on specific metrics using tournament data
  const findOutliers = (): OutlierCard[] => {
    if (!players || players.length === 0) return [];
    
    const outliers: OutlierCard[] = [];
    
    // Find highest headshot player using tournament metrics
    const headshotPlayer = [...players].sort((a, b) => 
      (b.metrics?.headshots || 0) - (a.metrics?.headshots || 0)
    )[0];
    
    if (headshotPlayer?.metrics?.headshots) {
      outliers.push({
        title: "Headshot King",
        player: headshotPlayer,
        statValue: headshotPlayer.metrics.headshots,
        bgGradient: "from-red-700 to-orange-500",
        icon: <Crosshair className="h-5 w-5 text-orange-300" />,
        description: `${headshotPlayer.metrics.headshots} headshots`
      });
    }
    
    // Find top flash assist player using utility damage as proxy
    const flashPlayer = [...players].sort((a, b) => 
      (b.metrics?.utilityDamage || 0) - (a.metrics?.utilityDamage || 0)
    )[0];
    
    if (flashPlayer?.metrics?.utilityDamage) {
      outliers.push({
        title: "Flash Master",
        player: flashPlayer,
        statValue: flashPlayer.metrics.utilityDamage,
        bgGradient: "from-blue-700 to-cyan-500",
        icon: <Zap className="h-5 w-5 text-cyan-300" />,
        description: `${flashPlayer.metrics.utilityDamage} utility damage`
      });
    }
    
    // Find best opening kill player
    const openingKillPlayer = [...players].sort((a, b) => 
      (b.metrics?.firstKills || 0) - (a.metrics?.firstKills || 0)
    )[0];
    
    if (openingKillPlayer?.metrics?.firstKills) {
      outliers.push({
        title: "Opening Kill Specialist",
        player: openingKillPlayer,
        statValue: openingKillPlayer.metrics.firstKills,
        bgGradient: "from-emerald-700 to-emerald-500",
        icon: <ZapIcon className="h-5 w-5 text-emerald-300" />,
        description: `${openingKillPlayer.metrics.firstKills} first kills`
      });
    }
    
    // Find smoke specialist (highest KAST as proxy for utility effectiveness)
    const smokePlayer = [...players].sort((a, b) => 
      (b.metrics?.kast || 0) - (a.metrics?.kast || 0)
    )[0];
    
    if (smokePlayer?.metrics?.kast) {
      outliers.push({
        title: "Smoke Specialist",
        player: smokePlayer,
        statValue: smokePlayer.metrics.kast,
        bgGradient: "from-indigo-700 to-indigo-500",
        icon: <CircleDot className="h-5 w-5 text-indigo-300" />,
        description: `${smokePlayer.metrics.kast}% KAST`
      });
    }
    
    // Find through smoke killer (highest K/D player as proxy)
    const throughSmokePlayer = [...players].sort((a, b) => 
      (b.metrics?.kd || 0) - (a.metrics?.kd || 0)
    )[0];
    
    if (throughSmokePlayer?.metrics?.kd) {
      outliers.push({
        title: "Smoke Criminal",
        player: throughSmokePlayer,
        statValue: throughSmokePlayer.metrics.kd,
        bgGradient: "from-purple-700 to-purple-500",
        icon: <FlameIcon className="h-5 w-5 text-purple-300" />,
        description: `${throughSmokePlayer.metrics.kd.toFixed(2)} K/D ratio`
      });
    }
    
    // Find highest impact CT player based on PIV
    const ctPlayer = [...players]
      .filter(p => p.ctPIV !== undefined && p.ctPIV > 0)
      .sort((a, b) => (b.ctPIV || 0) - (a.ctPIV || 0))[0];
      
    if (ctPlayer?.ctPIV) {
      outliers.push({
        title: "CT Side Monster",
        player: ctPlayer,
        statValue: ctPlayer.ctPIV * 100,
        bgGradient: "from-blue-700 to-blue-400",
        icon: <Shield className="h-5 w-5 text-blue-300" />,
        description: `${Math.round(ctPlayer.ctPIV * 100)} CT PIV`
      });
    }
    
    // Find highest T side impact player
    const tPlayer = [...players]
      .filter(p => p.tPIV !== undefined && p.tPIV > 0)
      .sort((a, b) => (b.tPIV || 0) - (a.tPIV || 0))[0];
      
    if (tPlayer?.tPIV) {
      outliers.push({
        title: "T Side Dominator",
        player: tPlayer,
        statValue: tPlayer.tPIV * 100,
        bgGradient: "from-amber-700 to-amber-400",
        icon: <Award className="h-5 w-5 text-amber-300" />,
        description: `${Math.round(tPlayer.tPIV * 100)} T PIV`
      });
    }
    
    return outliers.slice(0, 8); // Limit to 8 outliers
  };
  
  const outliersData = findOutliers();
  
  if (outliersData.length === 0) return null;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        delayChildren: 0.3,
      }
    }
  };
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
      }
    },
    hover: { 
      y: -5, 
      boxShadow: "0 12px 20px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 15 }
    }
  };

  return (
    <div className="mb-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-3"
      >
        <h2 className="text-xl font-bold text-gradient">Statistical Outliers</h2>
        <span className="text-sm text-blue-300/80">
          Players who excel in specific metrics
        </span>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {outliersData.map((outlier, index) => (
          <motion.div 
            key={`${outlier.title}-${index}`}
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation(`/players/${outlier.player.steamId}`)}
            className="glassmorphism border-glow cursor-pointer rounded-lg overflow-hidden relative"
          >
            {/* Background gradient line */}
            <div className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${outlier.bgGradient}`} />
            
            <div className="p-4">
              <div className="flex items-center mb-2">
                <div className={`flex-shrink-0 p-2 rounded-full bg-gradient-to-br ${outlier.bgGradient} mr-3`}>
                  {outlier.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-blue-300">{outlier.title}</h3>
                  <p className="text-base font-bold text-white">{outlier.player.name}</p>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-blue-200/70">
                  {outlier.description}
                </span>
                <span className="text-xs bg-blue-900/30 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {outlier.player.team}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default StatisticalOutliers;