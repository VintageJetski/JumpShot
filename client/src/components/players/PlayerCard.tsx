import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ClientPlayerWithPIV } from '@/lib/metrics-calculator';

interface PlayerCardProps {
  player: ClientPlayerWithPIV;
  index: number;
}

interface RoleBadgeProps {
  role: string;
  isIGL?: boolean;
}

const RoleBadge = ({ role, isIGL }: RoleBadgeProps) => {
  const roleColors: Record<string, string> = {
    'IGL': 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    'AWPer': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    'AWP': 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    'Lurker': 'bg-green-500/20 text-green-300 border-green-500/50',
    'Support': 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    'Entry Fragger': 'bg-red-500/20 text-red-300 border-red-500/50',
    'Spacetaker': 'bg-red-500/20 text-red-300 border-red-500/50',
    'Anchor': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    'Rotator': 'bg-teal-500/20 text-teal-300 border-teal-500/50',
  };

  const roleColor = roleColors[role] || 'bg-gray-500/20 text-gray-300 border-gray-500/50';

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${roleColor}`}>
      {role}
      {isIGL && ' (IGL)'}
    </span>
  );
};

export default function PlayerCard({ player, index }: PlayerCardProps) {
  const [, navigate] = useLocation();
  const { name, team, piv, tRole, ctRole, isIGL } = player;
  const initials = name.split(' ').map(n => n[0]).join('');
  
  const handleClick = () => {
    navigate(`/player/${player.steamId}`);
  };

  return (
    <motion.div
      key={player.steamId}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.02 }}
    >
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
        onClick={handleClick}
      >
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-blue-900/40 text-blue-100">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{name}</h3>
              <p className="text-xs text-muted-foreground">{team}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <div className="flex gap-x-2 mt-2 mb-3 flex-wrap">
            <RoleBadge role={tRole} isIGL={isIGL} />
            {ctRole && ctRole !== tRole && <RoleBadge role={ctRole} />}
          </div>
          
          <div className="mt-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs">PIV Rating</span>
              <span className="text-xs font-semibold">{piv.toFixed(2)}</span>
            </div>
            <Progress value={piv * 10} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}