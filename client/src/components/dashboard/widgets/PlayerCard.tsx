import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PlayerCardProps {
  player: PlayerWithPIV;
}

interface RoleBadgeProps {
  role: PlayerRole;
  isIGL?: boolean;
}

const RoleBadge = ({ role, isIGL }: RoleBadgeProps) => {
  const roleColors: Record<PlayerRole, string> = {
    [PlayerRole.IGL]: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    [PlayerRole.AWP]: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    [PlayerRole.Lurker]: 'bg-green-500/20 text-green-300 border-green-500/50',
    [PlayerRole.Support]: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
    [PlayerRole.Spacetaker]: 'bg-red-500/20 text-red-300 border-red-500/50',
    [PlayerRole.Anchor]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    [PlayerRole.Rotator]: 'bg-teal-500/20 text-teal-300 border-teal-500/50',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${roleColors[role]}`}>
      {role}
      {isIGL && ' (IGL)'}
    </span>
  );
};

export default function PlayerCard({ player }: PlayerCardProps) {
  const { name, team, piv, role, secondaryRole, isIGL } = player;
  const initials = name.split(' ').map(n => n[0]).join('');
  
  return (
    <Card className="overflow-hidden">
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
        <div className="flex gap-x-2 mt-2 mb-3">
          <RoleBadge role={role} isIGL={isIGL} />
          {secondaryRole && <RoleBadge role={secondaryRole} />}
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
  );
}