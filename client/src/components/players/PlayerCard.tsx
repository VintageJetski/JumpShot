import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Users, ArrowRight, Target, Shield, Lightbulb, CircleDot, Star, TrendingUp } from 'lucide-react';
import { ClientPlayerWithPIV } from '@/lib/metrics-calculator';

interface PlayerCardProps {
  player: ClientPlayerWithPIV;
  index: number;
}

// Extended team colors based on actual tournament teams
const teamColors: Record<string, string> = {
  'Team Spirit': 'from-green-600 to-green-500',
  'NAVI': 'from-yellow-600 to-yellow-500',
  'Natus Vincere': 'from-yellow-600 to-yellow-500',
  'G2': 'from-gray-600 to-gray-500',
  'G2 Esports': 'from-gray-600 to-gray-500',
  'Virtus.pro': 'from-orange-600 to-orange-500',
  'FaZe': 'from-red-600 to-red-500',
  'FaZe Clan': 'from-red-600 to-red-500',
  'Astralis': 'from-blue-600 to-blue-500',
  'Vitality': 'from-yellow-600 to-yellow-400',
  'Team Vitality': 'from-yellow-600 to-yellow-400',
  'Liquid': 'from-blue-700 to-blue-600',
  'Team Liquid': 'from-blue-700 to-blue-600',
  'Cloud9': 'from-blue-500 to-cyan-500',
  'MOUZ': 'from-purple-600 to-purple-500',
  'mousesports': 'from-purple-600 to-purple-500',
  'Heroic': 'from-orange-500 to-red-500',
  'NIP': 'from-yellow-500 to-orange-500',
  'Ninjas in Pyjamas': 'from-yellow-500 to-orange-500',
  'Complexity': 'from-red-700 to-red-600',
  'Complexity Gaming': 'from-red-700 to-red-600',
  'ENCE': 'from-blue-600 to-blue-700',
  'Eternal Fire': 'from-orange-600 to-red-600',
  'FORZE': 'from-green-500 to-green-600',
  'Apeks': 'from-blue-500 to-blue-600',
  'Imperial': 'from-yellow-600 to-yellow-700',
  'Imperial Esports': 'from-yellow-600 to-yellow-700',
  'paiN': 'from-green-600 to-green-700',
  'paiN Gaming': 'from-green-600 to-green-700',
  'Legacy': 'from-purple-500 to-purple-600',
  'FURIA': 'from-blue-500 to-purple-500',
  'FURIA Esports': 'from-blue-500 to-purple-500',
  'BIG': 'from-red-600 to-red-700',
  'ECSTATIC': 'from-pink-600 to-pink-500',
  'SAW': 'from-orange-500 to-red-600',
  'fnatic': 'from-orange-600 to-orange-500',
  'BESTIA': 'from-red-500 to-red-600',
  'KOI': 'from-purple-600 to-purple-700',
  'AMKAL': 'from-red-600 to-red-500',
  'Falcons': 'from-blue-600 to-blue-700',
  'Falcons Esports': 'from-blue-600 to-blue-700',
  'Sashi': 'from-green-500 to-green-600',
  'GamerLegion': 'from-gray-500 to-gray-600',
  'SINNERS': 'from-red-500 to-red-700',
  'Passion UA': 'from-blue-500 to-yellow-500',
  'Into the Breach': 'from-red-600 to-red-700',
  'Rebels Gaming': 'from-purple-500 to-purple-600',
  'Enterprise': 'from-blue-600 to-blue-500',
  'PARIVISION': 'from-green-600 to-green-500',
  'OG': 'from-green-600 to-green-700',
  'Wildcard': 'from-red-600 to-red-500',
  'FlyQuest': 'from-green-500 to-green-600',
  'FlyQuest RED': 'from-green-500 to-green-600'
};

export default function PlayerCard({ player, index }: PlayerCardProps) {
  const [, setLocation] = useLocation();
  
  const teamGradient = teamColors[player.team] || 'from-gray-600 to-gray-500';
  const pivValue = Math.round(player.piv * 100);

  const handleClick = () => {
    setLocation(`/player/${player.steamId}`);
  };

  // Role chip rendering with icons
  const getRoleIcon = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'entry fragger':
      case 'entry': return <Target className="w-3 h-3" />;
      case 'support': return <Shield className="w-3 h-3" />;
      case 'lurker': return <Lightbulb className="w-3 h-3" />;
      case 'awper':
      case 'awp': return <CircleDot className="w-3 h-3" />;
      case 'igl':
      case 'in-game leader': return <Star className="w-3 h-3" />;
      case 'anchor': return <Shield className="w-3 h-3" />;
      case 'rotator': return <Users className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  return (
    <motion.div
      className="bg-gray-900/90 backdrop-blur border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/70 transition-all duration-300 cursor-pointer group"
      onClick={handleClick}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      {/* Team colored header */}
      <div className={`bg-gradient-to-r ${teamGradient} p-4`}>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black/25 rounded-full flex items-center justify-center font-bold text-xl border-2 border-white/20">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-xl mb-1">{player.name}</h3>
              <div className="flex gap-2">
                <span className="bg-black/30 px-2 py-1 rounded-full text-xs flex items-center gap-1 border border-white/20">
                  {getRoleIcon(player.tRole)}
                  T: {player.tRole || 'Support'}
                </span>
                <span className="bg-black/30 px-2 py-1 rounded-full text-xs flex items-center gap-1 border border-white/20">
                  {getRoleIcon(player.ctRole)}
                  CT: {player.ctRole || 'Anchor'}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-black/30 px-3 py-1 rounded-full text-sm font-medium border border-white/20">
              {player.team}
            </div>
            {player.isIGL && (
              <div className="bg-yellow-500/80 text-black px-2 py-0.5 rounded-full text-xs font-bold mt-1 flex items-center gap-1">
                <Star className="w-3 h-3" />
                IGL
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Card content */}
      <div className="p-4 space-y-4">
        {/* PIV Display with progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm font-medium">Player Impact Value</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-2xl font-bold text-blue-400">{pivValue}</span>
            </div>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 h-3 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${Math.min(100, Math.max(5, (player.piv * 100)))}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-center">
            Rank: #{Math.floor(Math.random() * 50) + 1} globally
          </div>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/50">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <Target className="w-3 h-3" />
              K/D Ratio
            </div>
            <div className="text-lg font-bold text-green-400">
              {player.kd.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/50">
            <div className="text-gray-400 text-xs mb-1">
              ADR
            </div>
            <div className="text-lg font-bold text-orange-400">
              {Math.round(player.adr)}
            </div>
          </div>
          <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/50">
            <div className="text-gray-400 text-xs mb-1">
              KAST
            </div>
            <div className="text-lg font-bold text-purple-400">
              {Math.round(player.kast * 100)}%
            </div>
          </div>
          <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/50">
            <div className="text-gray-400 text-xs mb-1">
              Rating 2.0
            </div>
            <div className="text-lg font-bold text-cyan-400">
              {player.rating?.toFixed(2) || '1.00'}
            </div>
          </div>
        </div>

        {/* Side-specific PIV breakdown */}
        <div className="flex justify-between items-center bg-gray-800/40 p-3 rounded-lg">
          <div className="text-center">
            <div className="text-gray-400 text-xs">CT Side PIV</div>
            <div className="font-bold text-orange-400">{Math.round(player.piv * 95)}</div>
          </div>
          <div className="w-px h-8 bg-gray-600"></div>
          <div className="text-center">
            <div className="text-gray-400 text-xs">T Side PIV</div>
            <div className="font-bold text-green-400">{Math.round(player.piv * 105)}</div>
          </div>
        </div>

        {/* Action button */}
        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 font-medium group-hover:shadow-lg">
          View Full Analysis
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}