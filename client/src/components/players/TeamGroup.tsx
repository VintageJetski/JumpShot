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
  
  return (
    <div className="mb-8 glassmorphism border-glow rounded-lg overflow-hidden">
      {/* Team Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-blue-900/50 rounded-full flex items-center justify-center mr-3 border border-blue-500/30">
            <Users2 className="h-5 w-5 text-blue-200" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gradient">{teamName}</h3>
            <div className="flex items-center gap-2 text-sm text-blue-300/80">
              <span>{players.length} Players</span>
              <span className="flex items-center text-blue-200">
                <Trophy className="h-3 w-3 mr-1 text-blue-300" />
                {formattedTeamPIV} Avg PIV
              </span>
            </div>
          </div>
        </div>
        
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="h-8 w-8 rounded-full flex items-center justify-center group-hover:bg-blue-800/40 transition-colors duration-200"
        >
          <ChevronDown className="h-5 w-5 text-blue-300" />
        </motion.div>
      </div>
      
      {/* Team Players */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-5 pt-0">
              {sortedPlayers.map((player, index) => (
                <PlayerCard key={player.id} player={player} index={index} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
