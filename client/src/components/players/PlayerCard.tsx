import { motion } from "framer-motion";
import { PlayerWithPIV, PlayerRole } from "@shared/schema";
import { Target, Shield, Zap, Users, Crown, User2 } from "lucide-react";

interface PlayerCardProps {
  player: PlayerWithPIV;
  index: number;
}

export default function PlayerCard({ player, index }: PlayerCardProps) {
  // Determine IGL status for special styling
  const isIGL = player.role === PlayerRole.IGL;
  
  // Format PIV score for display (0-100 scale)
  const pivScore = Math.round(player.metrics.piv * 100);
  
  // Determine color based on PIV score
  const getPivColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };
  
  // Create a delay for staggered animation
  const staggerDelay = index * 0.05;

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.4,
        delay: staggerDelay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  // Get role icon
  const getRoleIcon = (role: PlayerRole) => {
    switch (role) {
      case PlayerRole.AWP:
        return <Target className="h-4 w-4" />;
      case PlayerRole.IGL:
        return <Crown className="h-4 w-4" />;
      case PlayerRole.Support:
        return <Shield className="h-4 w-4" />;
      case PlayerRole.Spacetaker:
        return <Zap className="h-4 w-4" />;
      case PlayerRole.Anchor:
        return <Shield className="h-4 w-4" />;
      default:
        return <User2 className="h-4 w-4" />;
    }
  };

  // Get role color
  const getRoleColor = (role: PlayerRole) => {
    switch (role) {
      case PlayerRole.AWP:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case PlayerRole.IGL:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case PlayerRole.Support:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case PlayerRole.Spacetaker:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case PlayerRole.Anchor:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 hover:border-blue-500/30 transition-all duration-300 cursor-pointer group"
    >
      {/* Header with player name and team */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-300 transition-colors">
            {player.name}
          </h3>
          <p className="text-gray-400 text-sm font-medium">
            {player.team}
          </p>
        </div>
        
        {/* PIV Score Badge */}
        <div className="flex flex-col items-end">
          <div className={`${getPivColor(pivScore)} text-2xl font-bold mb-1`}>
            {pivScore}
          </div>
          <span className="text-gray-500 text-xs uppercase tracking-wide">PIV</span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${getRoleColor(player.role)}`}>
          {getRoleIcon(player.role)}
          {player.role}
          {isIGL && <Crown className="h-3 w-3 ml-1" />}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-white">
            {player.metrics.rcs.value.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">RCS</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-white">
            {player.metrics.icf.value.toFixed(2)}
          </div>
          <div className="text-xs text-gray-400 uppercase tracking-wide">ICF</div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/50">
        <div className="text-center">
          <div className="text-sm font-medium text-blue-300">
            {player.metrics.sc.value.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">SC</div>
        </div>
        
        <div className="text-center">
          <div className="text-sm font-medium text-green-300">
            {player.metrics.osm.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">OSM</div>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Performance</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getPivColor(pivScore).replace('text-', 'bg-')}`} />
            <span className={`font-medium ${getPivColor(pivScore)}`}>
              {pivScore >= 85 ? 'Elite' : pivScore >= 70 ? 'Strong' : pivScore >= 50 ? 'Solid' : 'Developing'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}