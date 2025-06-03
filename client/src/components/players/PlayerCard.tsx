import React from 'react';
import { PlayerWithPIV, PlayerRole } from "../../../../shared/schema";
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

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 150, 
        damping: 15,
        delay: staggerDelay,
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.05
      } 
    },
    hover: { 
      y: -8, 
      scale: 1.03, 
      transition: { type: "spring", stiffness: 400, damping: 15 },
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
    }
  };

  const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        damping: 20,
        delay: staggerDelay + 0.1
      } 
    },
    hover: { 
      scale: 1.02,
      transition: { duration: 0.2 } 
    }
  };

  const contentVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        delay: staggerDelay + 0.2,
        when: "beforeChildren",
        staggerChildren: 0.05
      } 
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 150, damping: 15 }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        delay: staggerDelay + 0.3,
        type: "spring", 
        stiffness: 150, 
        damping: 15 
      } 
    },
    hover: { 
      scale: 1.05, 
      backgroundColor: "rgba(37, 99, 235, 0.4)",
      transition: { duration: 0.2 } 
    },
    tap: { 
      scale: 0.95,
      transition: { duration: 0.1 } 
    }
  };

  const roleIconVariants = {
    hover: { 
      rotate: [0, -5, 5, 0],
      transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" as const }
    }
  };

  return (
    <motion.div 
      className="glassmorphism border-glow card-hover rounded-lg overflow-hidden"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      layout
    >
      {/* Player Header with Role Gradient */}
      <motion.div 
        className={`bg-gradient-to-r ${roleGradient} p-4 relative`}
        variants={headerVariants}
      >
        {/* Team Badge */}
        <motion.div 
          className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-xs font-medium py-1 px-2 rounded"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: staggerDelay + 0.2, duration: 0.3 }}
          whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          {player.team}
        </motion.div>
        
        {/* Player Avatar Circle */}
        <div className="flex items-center">
          <motion.div 
            className="flex-shrink-0 h-12 w-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-xl font-bold text-white border border-white/20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: staggerDelay + 0.15, type: "spring", stiffness: 200 }}
            whileHover={{ scale: 1.1, borderColor: "rgba(255,255,255,0.5)" }}
          >
            {player.name.charAt(0)}
          </motion.div>
          <div className="ml-3">
            <motion.h3 
              className="text-lg font-bold text-white"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: staggerDelay + 0.2 }}
            >
              {player.name}
            </motion.h3>
            <motion.div 
              className="flex flex-wrap gap-1 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: staggerDelay + 0.25 }}
            >
              {Array.from(rolesToDisplay).map((role, i) => (
                <motion.div 
                  key={i} 
                  className="flex items-center bg-black/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: staggerDelay + 0.25 + (i * 0.07) }}
                  whileHover="hover"
                >
                  <motion.div variants={roleIconVariants}>
                    {roleIcons[role]}
                  </motion.div>
                  <span className="ml-1">{role}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.div>
      
      {/* Stats Section */}
      <motion.div 
        className="p-4"
        variants={contentVariants}
      >
        {/* PIV Score with visual indicator */}
        <motion.div 
          className="mb-4"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-blue-300">Player Impact Value</span>
            <motion.span 
              className={`text-lg font-bold ${getPivColor(pivScore)}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: staggerDelay + 0.3, type: "spring" }}
            >
              {pivScore}
            </motion.span>
          </div>
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full bg-gradient-to-r from-blue-600 to-blue-400`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(pivScore, 100)}%` }}
              transition={{ 
                duration: 1.2, 
                delay: staggerDelay + 0.3, 
                ease: [0.34, 1.56, 0.64, 1] // Custom spring-like cubic bezier
              }}
            />
          </div>
        </motion.div>
        
        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 gap-3 mb-4"
          variants={itemVariants}
        >
          <motion.div 
            className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-2"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(30, 64, 175, 0.3)" }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <div className="text-xs text-blue-300 mb-1 flex items-center">
              <Gauge className="h-3 w-3 mr-1" /> K/D Ratio
            </div>
            <div className={`text-base font-medium ${player.kd >= 1.0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {player.kd.toFixed(2)}
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-2"
            whileHover={{ scale: 1.05, backgroundColor: "rgba(30, 64, 175, 0.3)" }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <div className="text-xs text-blue-300 mb-1 truncate">
              {player.primaryMetric.name}
            </div>
            <div className="text-base font-medium text-blue-200">
              {typeof player.primaryMetric.value === 'number' ? 
                player.primaryMetric.value.toFixed(2) : 
                player.primaryMetric.value}
            </div>
          </motion.div>
        </motion.div>
        
        {/* Side Stats */}
        <motion.div 
          className="grid grid-cols-2 gap-2 text-xs text-blue-300/80 mb-4"
          variants={itemVariants}
        >
          <motion.div 
            className="flex items-center justify-between px-2 py-1 border-b border-blue-500/10"
            whileHover={{ borderColor: "rgba(59, 130, 246, 0.3)" }}
          >
            <span>CT PIV</span>
            <span className="font-medium text-blue-200">
              {player.ctPIV ? Math.round(player.ctPIV * 100) : '-'}
            </span>
          </motion.div>
          <motion.div 
            className="flex items-center justify-between px-2 py-1 border-b border-blue-500/10"
            whileHover={{ borderColor: "rgba(59, 130, 246, 0.3)" }}
          >
            <span>T PIV</span>
            <span className="font-medium text-blue-200">
              {player.tPIV ? Math.round(player.tPIV * 100) : '-'}
            </span>
          </motion.div>
        </motion.div>
        
        {/* Action Button */}
        <motion.button 
          onClick={() => setLocation(`/players/${player.id}`)}
          className="w-full flex items-center justify-center bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-100 p-2 rounded-lg border border-blue-500/30 mt-2"
          variants={buttonVariants}
          whileTap="tap"
        >
          <span className="mr-1">View Details</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ 
              repeat: Infinity, 
              repeatType: "reverse", 
              duration: 1, 
              ease: "easeInOut",
              repeatDelay: 1
            }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
