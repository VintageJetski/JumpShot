import React from 'react';
import { PlayerWithPIV, PlayerRole } from "@shared/schema";
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import RoleBadge from '@/components/ui/role-badge';
import { Shield, Target, Lightbulb, CircleDot, Users, Gauge, ArrowRight } from 'lucide-react';

interface PlayerCardProps {
  player: PlayerWithPIV;
  index: number;
}

const roleIcons: Record<PlayerRole, React.ReactNode> = {
  [PlayerRole.IGL]: <Lightbulb className="h-4 w-4" />,
  [PlayerRole.AWP]: <Target className="h-4 w-4" />,
  [PlayerRole.Lurker]: <Shield className="h-4 w-4" />,
  [PlayerRole.Spacetaker]: <Users className="h-4 w-4" />,
  [PlayerRole.Support]: <CircleDot className="h-4 w-4" />,
  [PlayerRole.Anchor]: <Shield className="h-4 w-4" />,
  [PlayerRole.Rotator]: <CircleDot className="h-4 w-4" />
};

const roleColors: Record<PlayerRole, string> = {
  [PlayerRole.IGL]: 'from-purple-700 to-purple-500',
  [PlayerRole.AWP]: 'from-amber-700 to-amber-500',
  [PlayerRole.Lurker]: 'from-blue-700 to-blue-500',
  [PlayerRole.Spacetaker]: 'from-green-700 to-green-500',
  [PlayerRole.Support]: 'from-indigo-700 to-indigo-500',
  [PlayerRole.Anchor]: 'from-blue-800 to-blue-600',
  [PlayerRole.Rotator]: 'from-sky-700 to-sky-500'
};

export default function PlayerCard({ player, index }: PlayerCardProps) {
  const [, setLocation] = useLocation();
  
  // Determine primary role for styling
  const primaryRole = player.role;
  const roleGradient = roleColors[primaryRole] || 'from-blue-700 to-blue-500';
  
  // Collect all unique roles to display
  const rolesToDisplay = new Set<PlayerRole>();
  
  // If player is IGL, add it first
  if (player.isIGL) {
    rolesToDisplay.add(PlayerRole.IGL);
  }
  
  // Add primary role if it's not IGL
  if (player.role !== PlayerRole.IGL) {
    rolesToDisplay.add(player.role);
  }
  
  // Add T role if it's different from primary role
  if (player.tRole && player.tRole !== player.role && player.tRole !== PlayerRole.IGL) {
    rolesToDisplay.add(player.tRole);
  }
  
  // Add CT role if it's different from primary and T role
  if (player.ctRole && player.ctRole !== player.role && player.ctRole !== player.tRole && player.ctRole !== PlayerRole.IGL) {
    rolesToDisplay.add(player.ctRole);
  }

  // Format PIV score for display (0-100 scale)
  const pivScore = Math.round(player.piv * 100);
  
  // Determine color based on PIV score
  const getPivColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-orange-400';
  };
  
  // Create a delay for staggered animation
  const staggerDelay = index * 0.05;

  return (
    <motion.div 
      className="glassmorphism border-glow card-hover rounded-lg overflow-hidden transition-all duration-300"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: staggerDelay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      {/* Player Header with Role Gradient */}
      <div className={`bg-gradient-to-r ${roleGradient} p-4 relative`}>
        {/* Team Badge */}
        <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs font-medium py-1 px-2 rounded">
          {player.team}
        </div>
        
        {/* Player Avatar Circle */}
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-xl font-bold text-white border border-white/20">
            {player.name.charAt(0)}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-bold text-white">{player.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">
              {Array.from(rolesToDisplay).map((role, i) => (
                <div 
                  key={i} 
                  className="flex items-center bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full"
                >
                  {roleIcons[role]}
                  <span className="ml-1">{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="p-4">
        {/* PIV Score with visual indicator */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-blue-300">Player Impact Value</span>
            <span className={`text-lg font-bold ${getPivColor(pivScore)}`}>{pivScore}</span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-gradient-to-r from-blue-600 to-blue-400`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pivScore, 100)}%` }}
              transition={{ duration: 1, delay: staggerDelay + 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-2">
            <div className="text-xs text-blue-300 mb-1 flex items-center">
              <Gauge className="h-3 w-3 mr-1" /> K/D Ratio
            </div>
            <div className={`text-base font-medium ${player.kd >= 1.0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {player.kd.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-2">
            <div className="text-xs text-blue-300 mb-1 truncate">
              {player.primaryMetric.name}
            </div>
            <div className="text-base font-medium text-blue-200">
              {typeof player.primaryMetric.value === 'number' ? 
                player.primaryMetric.value.toFixed(2) : 
                player.primaryMetric.value}
            </div>
          </div>
        </div>
        
        {/* Side Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-300/80 mb-4">
          <div className="flex items-center justify-between px-2 py-1 border-b border-blue-500/10">
            <span>CT PIV</span>
            <span className="font-medium text-blue-200">
              {player.ctPIV ? Math.round(player.ctPIV * 100) : '-'}
            </span>
          </div>
          <div className="flex items-center justify-between px-2 py-1 border-b border-blue-500/10">
            <span>T PIV</span>
            <span className="font-medium text-blue-200">
              {player.tPIV ? Math.round(player.tPIV * 100) : '-'}
            </span>
          </div>
        </div>
        
        {/* Action Button */}
        <button 
          onClick={() => setLocation(`/players/${player.id}`)}
          className="w-full flex items-center justify-center bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-100 p-2 rounded-lg transition-colors duration-200 border border-blue-500/30 mt-2"
        >
          <span className="mr-1">View Details</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
