import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Users, ArrowRight, Target, Shield, Lightbulb, CircleDot } from 'lucide-react';
import { ClientPlayerWithPIV } from '@/lib/metrics-calculator';

interface PlayerCardProps {
  player: ClientPlayerWithPIV;
  index: number;
}

const teamColors: Record<string, string> = {
  'Team Spirit': 'from-green-600 to-green-500',
  'NAVI': 'from-yellow-600 to-yellow-500', 
  'G2': 'from-gray-600 to-gray-500',
  'Virtus.pro': 'from-orange-600 to-orange-500',
  'FaZe': 'from-red-600 to-red-500',
  'Astralis': 'from-blue-600 to-blue-500',
  'Vitality': 'from-yellow-600 to-yellow-400',
  'Liquid': 'from-blue-700 to-blue-600',
  'Cloud9': 'from-blue-500 to-cyan-500',
  'MOUZ': 'from-purple-600 to-purple-500',
  'Heroic': 'from-orange-500 to-red-500',
  'NIP': 'from-yellow-500 to-orange-500',
  'Complexity': 'from-red-700 to-red-600',
  'ENCE': 'from-blue-600 to-blue-700',
  'Eternal Fire': 'from-orange-600 to-red-600',
  'FORZE': 'from-green-500 to-green-600',
  'Apeks': 'from-blue-500 to-blue-600',
  'Imperial': 'from-yellow-600 to-yellow-700',
  'paiN': 'from-green-600 to-green-700',
  'Legacy': 'from-purple-500 to-purple-600',
  'FURIA': 'from-blue-500 to-purple-500',
  'BIG': 'from-red-600 to-red-700'
};

export default function PlayerCard({ player, index }: PlayerCardProps) {
  const [, setLocation] = useLocation();
  
  const teamGradient = teamColors[player.team] || 'from-gray-600 to-gray-500';
  const pivValue = Math.round(player.piv * 100);

  const handleClick = () => {
    setLocation(`/player/${player.steamId}`);
  };

  return (
    <motion.div
      className="bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/50 transition-colors cursor-pointer"
      onClick={handleClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Team colored header */}
      <div className={`bg-gradient-to-r ${teamGradient} p-3 rounded-lg mb-4`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black/20 rounded-full flex items-center justify-center font-bold text-lg">
              {player.name.charAt(0).toLowerCase()}
            </div>
            <div>
              <h3 className="font-bold text-lg">{player.name}</h3>
              <div className="flex gap-2 mt-1">
                <span className="bg-black/20 px-2 py-1 rounded text-sm flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {player.tRole || 'Spacetaker'}
                </span>
                <span className="bg-black/20 px-2 py-1 rounded text-sm flex items-center gap-1">
                  <CircleDot className="w-3 h-3" />
                  {player.ctRole || 'Rotator'}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-black/20 px-3 py-1 rounded text-sm font-medium">
            {player.team}
          </div>
        </div>
      </div>

      {/* PIV Display */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Player Impact Value</span>
          <span className="text-2xl font-bold text-blue-400">{pivValue}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (player.piv * 50))}%` }}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-800/50 p-3 rounded">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Target className="w-4 h-4" />
            K/D Ratio
          </div>
          <div className="text-xl font-bold text-green-400">
            {player.kd.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-800/50 p-3 rounded">
          <div className="text-gray-400 text-sm mb-1">
            {player.primaryMetric?.label || 'ADR'}
          </div>
          <div className="text-xl font-bold text-blue-400">
            {player.primaryMetric?.value || Math.round(player.adr)}
          </div>
        </div>
      </div>

      {/* CT/T PIV */}
      <div className="flex justify-between items-center mb-4 text-sm">
        <div>
          <span className="text-gray-400">CT PIV</span>
          <div className="font-bold text-orange-400">{Math.round(player.piv * 80)}</div>
        </div>
        <div>
          <span className="text-gray-400">T PIV</span>
          <div className="font-bold text-green-400">{Math.round(player.piv * 120)}</div>
        </div>
      </div>

      {/* View Details Button */}
      <button className="w-full bg-blue-600/80 hover:bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors">
        View Details
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  );
}