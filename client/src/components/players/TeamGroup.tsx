import React, { useState } from 'react';
import { PlayerWithPIV } from "@shared/schema";
import { motion, AnimatePresence } from 'framer-motion';
import PlayerCard from './PlayerCard';
import { ChevronDown, Users2, Trophy } from 'lucide-react';

interface TeamGroupProps {
  teamName: string;
  players: PlayerWithPIV[];
  expanded?: boolean;
}

export default function TeamGroup({ teamName, players, expanded = true }: TeamGroupProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  
  // Sort players by PIV within team
  const sortedPlayers = [...players].sort((a, b) => b.piv - a.piv);
  
  // Calculate team stats
  const teamAvgPIV = players.reduce((sum, player) => sum + player.piv, 0) / players.length;
  const formattedTeamPIV = Math.round(teamAvgPIV * 100);

  // Get color based on PIV score
  const getTeamColor = (score: number) => {
    if (score >= 85) return 'from-green-700 to-green-500 border-green-500/30';
    if (score >= 75) return 'from-blue-700 to-blue-500 border-blue-500/30';
    if (score >= 65) return 'from-indigo-700 to-indigo-500 border-indigo-500/30';
    if (score >= 55) return 'from-violet-700 to-violet-500 border-violet-500/30';
    return 'from-amber-700 to-amber-500 border-amber-500/30';
  };

  const teamColor = getTeamColor(formattedTeamPIV);
  const [colorFrom, colorTo] = teamColor.split(' ');
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        duration: 0.5,
        when: "beforeChildren"
      } 
    },
    hover: { 
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
      y: -2,
      transition: { duration: 0.2 }
    }
  };

  const headerIconVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 15, 
        delay: 0.1 
      } 
    },
    hover: { 
      rotate: [0, -10, 10, -5, 0],
      scale: 1.1,
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatType: "loop" as const,
        repeatDelay: 1
      }
    }
  };

  const expandVariants = {
    hidden: { height: 0, opacity: 0 },
    visible: { 
      height: "auto", 
      opacity: 1,
      transition: { 
        height: {
          type: "spring",
          stiffness: 70,
          damping: 15,
          duration: 0.4
        },
        opacity: { duration: 0.4, delay: 0.1 }
      } 
    },
    exit: { 
      height: 0, 
      opacity: 0,
      transition: { 
        height: { duration: 0.3 },
        opacity: { duration: 0.2 }
      } 
    }
  };

  const playersContainerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.05,
        delayChildren: 0.1
      } 
    }
  };
  
  return (
    <motion.div 
      className="mb-8 glassmorphism border-glow rounded-lg overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover={!isExpanded ? "hover" : undefined}
      layout
    >
      {/* Team Header */}
      <motion.div 
        className={`flex items-center justify-between p-4 cursor-pointer relative group`}
        onClick={() => setIsExpanded(!isExpanded)}
        whileTap={{ scale: 0.98 }}
      >
        {/* Background gradient line for team */}
        <motion.div 
          className={`absolute top-0 left-0 h-1 w-full bg-gradient-to-r ${teamColor}`}
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Header content */}
        <div className="flex items-center">
          <motion.div 
            className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 border ${colorFrom.replace('from-', 'bg-')} border-blue-500/30`}
            variants={headerIconVariants}
            whileHover="hover"
          >
            <Users2 className="h-5 w-5 text-white" />
          </motion.div>

          <div>
            <motion.h3 
              className="text-xl font-bold text-gradient"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {teamName}
            </motion.h3>

            <motion.div 
              className="flex items-center gap-2 text-sm text-blue-300/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <motion.span 
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {players.length} Players
              </motion.span>

              <motion.span 
                className="flex items-center text-blue-200"
                initial={{ x: -5, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: isExpanded ? [0, 15, 0, -15, 0] : 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
                >
                  <Trophy className="h-3 w-3 mr-1 text-blue-300" />
                </motion.div>
                {formattedTeamPIV} Avg PIV
              </motion.span>
            </motion.div>
          </div>
        </div>
        
        <motion.div
          animate={{ 
            rotate: isExpanded ? 180 : 0,
            backgroundColor: isExpanded ? "rgba(59, 130, 246, 0.2)" : "transparent"
          }}
          whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.3)" }}
          transition={{ duration: 0.3 }}
          className="h-8 w-8 rounded-full flex items-center justify-center"
        >
          <ChevronDown className="h-5 w-5 text-blue-300" />
        </motion.div>
      </motion.div>
      
      {/* Team Players */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            variants={expandVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="overflow-hidden"
          >
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-5 pt-0"
              variants={playersContainerVariants}
            >
              {sortedPlayers.map((player, index) => {
                // Generate a stable key using player ID or fallback to a combined value
                const key = player.id || `${teamName}-${player.name}-${index}`;
                return <PlayerCard key={key} player={player} index={index} />;
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
