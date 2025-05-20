import React from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { PlayerWithPIV, PlayerRole } from '@shared/schema';
import { Target, Shield, CircleDot, Gauge, ZapIcon, Brain, FlameIcon, Users, Zap, Crosshair, Award } from 'lucide-react';

interface StatisticalOutliersProps {
  players: PlayerWithPIV[];
  eventId?: number;
}

interface OutlierCard {
  title: string;
  player: PlayerWithPIV;
  statValue: number;
  bgGradient: string;
  icon: React.ReactNode;
  description: string;
}

const StatisticalOutliers: React.FC<StatisticalOutliersProps> = ({ players, eventId }) => {
  const [, setLocation] = useLocation();
  
  // Find outliers based on specific metrics
  const findOutliers = (): OutlierCard[] => {
    if (!players || players.length === 0) return [];
    
    // Using the players directly as they're already filtered by eventId from the API call
    const filteredPlayers = players;
    
    // Results array
    const outliers: OutlierCard[] = [];
    
    // Find highest headshot player
    const headshotPlayer = [...filteredPlayers]
      .filter(p => p.rawStats && typeof p.rawStats.headshots === 'number' && typeof p.rawStats.kills === 'number')
      .sort((a, b) => 
        (b.rawStats.headshots / Math.max(b.rawStats.kills, 1)) - 
        (a.rawStats.headshots / Math.max(a.rawStats.kills, 1))
      )[0];
    
    if (headshotPlayer && headshotPlayer.rawStats.headshots) {
      const headshotRatio = (headshotPlayer.rawStats.headshots / Math.max(headshotPlayer.rawStats.kills, 1)) * 100;
      outliers.push({
        title: "Headshot King",
        player: headshotPlayer,
        statValue: headshotRatio,
        bgGradient: "from-red-700 to-orange-500",
        icon: <Crosshair className="h-5 w-5 text-orange-300" />,
        description: `${headshotRatio.toFixed(1)}% headshot ratio`
      });
    }
    
    // Find top flash assist player
    const flashPlayer = [...players]
      .filter(p => p.rawStats && typeof p.rawStats.assisted_flashes === 'number' && typeof p.rawStats.flashes_thrown === 'number')
      .sort((a, b) => 
        (b.rawStats.assisted_flashes / Math.max(b.rawStats.flashes_thrown, 1)) - 
        (a.rawStats.assisted_flashes / Math.max(a.rawStats.flashes_thrown, 1))
      )[0];
    
    if (flashPlayer && flashPlayer.rawStats.assisted_flashes) {
      const flashRatio = (flashPlayer.rawStats.assisted_flashes / Math.max(flashPlayer.rawStats.flashes_thrown, 1)) * 100;
      outliers.push({
        title: "Flash Master",
        player: flashPlayer,
        statValue: flashRatio,
        bgGradient: "from-blue-700 to-cyan-500",
        icon: <Zap className="h-5 w-5 text-cyan-300" />,
        description: `${flashRatio.toFixed(1)}% flash effectiveness`
      });
    } else {
      // Fallback to player with most flashes
      const mostFlashesPlayer = [...players]
        .filter(p => p.rawStats && typeof p.rawStats.flashes_thrown === 'number')
        .sort((a, b) => (b.rawStats.flashes_thrown || 0) - (a.rawStats.flashes_thrown || 0))[0];
        
      if (mostFlashesPlayer && mostFlashesPlayer.rawStats.flashes_thrown) {
        outliers.push({
          title: "Flash Master",
          player: mostFlashesPlayer,
          statValue: mostFlashesPlayer.rawStats.flashes_thrown,
          bgGradient: "from-blue-700 to-cyan-500",
          icon: <Zap className="h-5 w-5 text-cyan-300" />,
          description: `${mostFlashesPlayer.rawStats.flashes_thrown} flashes thrown`
        });
      }
    }
    
    // Find best opening kill player
    const openingKillPlayer = [...players]
      .filter(p => p.rawStats && typeof p.rawStats.first_kills === 'number' && typeof p.rawStats.first_deaths === 'number')
      .sort((a, b) => 
        (b.rawStats.first_kills / Math.max(b.rawStats.first_kills + b.rawStats.first_deaths, 1)) - 
        (a.rawStats.first_kills / Math.max(a.rawStats.first_kills + a.rawStats.first_deaths, 1))
      )[0];
    
    if (openingKillPlayer && openingKillPlayer.rawStats.first_kills) {
      const openingRatio = (openingKillPlayer.rawStats.first_kills / Math.max(openingKillPlayer.rawStats.first_kills + openingKillPlayer.rawStats.first_deaths, 1)) * 100;
      outliers.push({
        title: "Opening Kill Specialist",
        player: openingKillPlayer,
        statValue: openingRatio,
        bgGradient: "from-emerald-700 to-emerald-500",
        icon: <ZapIcon className="h-5 w-5 text-emerald-300" />,
        description: `${openingRatio.toFixed(1)}% opening duel winrate`
      });
    } else {
      // Fallback to player with most first kills
      const mostFirstKills = [...players]
        .filter(p => p.rawStats && typeof p.rawStats.first_kills === 'number')
        .sort((a, b) => (b.rawStats.first_kills || 0) - (a.rawStats.first_kills || 0))[0];
        
      if (mostFirstKills && mostFirstKills.rawStats.first_kills) {
        outliers.push({
          title: "Opening Kill Specialist",
          player: mostFirstKills,
          statValue: mostFirstKills.rawStats.first_kills,
          bgGradient: "from-emerald-700 to-emerald-500",
          icon: <ZapIcon className="h-5 w-5 text-emerald-300" />,
          description: `${mostFirstKills.rawStats.first_kills} opening kills`
        });
      }
    }
    
    // Find smoke specialist
    const smokePlayer = [...players]
      .filter(p => p.rawStats && typeof p.rawStats.smokes_thrown === 'number')
      .sort((a, b) => 
        (b.rawStats.smokes_thrown || 0) - (a.rawStats.smokes_thrown || 0)
      )[0];
    
    if (smokePlayer && smokePlayer.rawStats.smokes_thrown) {
      outliers.push({
        title: "Smoke Specialist",
        player: smokePlayer,
        statValue: smokePlayer.rawStats.smokes_thrown,
        bgGradient: "from-indigo-700 to-indigo-500",
        icon: <CircleDot className="h-5 w-5 text-indigo-300" />,
        description: `${smokePlayer.rawStats.smokes_thrown} smokes thrown`
      });
    } else {
      // Fallback to any player with utility usage
      const utilityPlayer = [...players]
        .filter(p => p.rawStats && typeof p.rawStats.total_utility_thrown === 'number')
        .sort((a, b) => (b.rawStats.total_utility_thrown || 0) - (a.rawStats.total_utility_thrown || 0))[0];
        
      if (utilityPlayer && utilityPlayer.rawStats.total_utility_thrown) {
        outliers.push({
          title: "Utility Specialist",
          player: utilityPlayer,
          statValue: utilityPlayer.rawStats.total_utility_thrown,
          bgGradient: "from-indigo-700 to-indigo-500",
          icon: <CircleDot className="h-5 w-5 text-indigo-300" />,
          description: `${utilityPlayer.rawStats.total_utility_thrown} utility thrown`
        });
      }
    }
    
    // Find through smoke killer
    const throughSmokePlayer = [...players]
      .filter(p => p.rawStats && typeof p.rawStats.through_smoke === 'number' && typeof p.rawStats.kills === 'number')
      .sort((a, b) => 
        (b.rawStats.through_smoke / Math.max(b.rawStats.kills, 1)) - 
        (a.rawStats.through_smoke / Math.max(a.rawStats.kills, 1))
      )[0];
    
    if (throughSmokePlayer && throughSmokePlayer.rawStats.through_smoke) {
      const throughSmokeRatio = (throughSmokePlayer.rawStats.through_smoke / Math.max(throughSmokePlayer.rawStats.kills, 1)) * 100;
      outliers.push({
        title: "Smoke Criminal",
        player: throughSmokePlayer,
        statValue: throughSmokeRatio,
        bgGradient: "from-purple-700 to-purple-500",
        icon: <FlameIcon className="h-5 w-5 text-purple-300" />,
        description: `${throughSmokeRatio.toFixed(1)}% kills through smoke`
      });
    } else {
      // Fallback to most wallbang kills
      const wallbangPlayer = [...players]
        .filter(p => p.rawStats && typeof p.rawStats.wallbang_kills === 'number')
        .sort((a, b) => (b.rawStats.wallbang_kills || 0) - (a.rawStats.wallbang_kills || 0))[0];
        
      if (wallbangPlayer && wallbangPlayer.rawStats.wallbang_kills) {
        outliers.push({
          title: "Wallbang King",
          player: wallbangPlayer,
          statValue: wallbangPlayer.rawStats.wallbang_kills,
          bgGradient: "from-purple-700 to-purple-500",
          icon: <FlameIcon className="h-5 w-5 text-purple-300" />,
          description: `${wallbangPlayer.rawStats.wallbang_kills} wallbang kills`
        });
      }
    }
    
    // Find highest impact CT player based on CT PIV
    const ctPlayer = [...players]
      .filter(p => p.ctPIV !== undefined)
      .sort((a, b) => (b.ctPIV || 0) - (a.ctPIV || 0))[0];
      
    if (ctPlayer && ctPlayer.ctPIV) {
      outliers.push({
        title: "CT Side Monster",
        player: ctPlayer,
        statValue: ctPlayer.ctPIV * 100,
        bgGradient: "from-blue-700 to-blue-400",
        icon: <Shield className="h-5 w-5 text-blue-300" />,
        description: `${Math.round(ctPlayer.ctPIV * 100)} CT side PIV`
      });
    } else {
      // Fallback if ctPIV is not available - use CT round wins
      const bestCtPlayer = [...players]
        .filter(p => p.rawStats && typeof p.rawStats.ct_rounds_won === 'number')
        .sort((a, b) => (b.rawStats.ct_rounds_won || 0) - (a.rawStats.ct_rounds_won || 0))[0];
        
      if (bestCtPlayer && bestCtPlayer.rawStats.ct_rounds_won) {
        outliers.push({
          title: "CT Side Monster",
          player: bestCtPlayer,
          statValue: bestCtPlayer.rawStats.ct_rounds_won,
          bgGradient: "from-blue-700 to-blue-400",
          icon: <Shield className="h-5 w-5 text-blue-300" />,
          description: `${bestCtPlayer.rawStats.ct_rounds_won} CT rounds won`
        });
      }
    }
    
    // Find highest T side impact player
    const tPlayer = [...players]
      .filter(p => p.tPIV !== undefined)
      .sort((a, b) => (b.tPIV || 0) - (a.tPIV || 0))[0];
      
    if (tPlayer && tPlayer.tPIV) {
      outliers.push({
        title: "T Side Dominator",
        player: tPlayer,
        statValue: tPlayer.tPIV * 100,
        bgGradient: "from-amber-700 to-amber-400",
        icon: <Award className="h-5 w-5 text-amber-300" />,
        description: `${Math.round(tPlayer.tPIV * 100)} T side PIV`
      });
    } else {
      // Fallback if tPIV is not available - use T round wins
      const bestTPlayer = [...players]
        .filter(p => p.rawStats && typeof p.rawStats.t_rounds_won === 'number')
        .sort((a, b) => (b.rawStats.t_rounds_won || 0) - (a.rawStats.t_rounds_won || 0))[0];
        
      if (bestTPlayer && bestTPlayer.rawStats.t_rounds_won) {
        outliers.push({
          title: "T Side Dominator",
          player: bestTPlayer,
          statValue: bestTPlayer.rawStats.t_rounds_won,
          bgGradient: "from-amber-700 to-amber-400",
          icon: <Award className="h-5 w-5 text-amber-300" />,
          description: `${bestTPlayer.rawStats.t_rounds_won} T rounds won`
        });
      }
    }
    
    // Return all outliers
    return outliers;
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
            onClick={() => setLocation(`/players/${outlier.player.id}`)}
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