import React from 'react';
import { Badge } from '@/components/ui/badge';
import { PlayerRole } from '@shared/schema';

interface RoleBadgeProps {
  role: PlayerRole;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * RoleBadge - A component for displaying player roles with color coding
 * - Blue for CT side roles
 * - Orange for T side roles
 * - Purple for IGL role
 */
const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  // Determine role type (CT, T, or IGL)
  const isCTRole = [PlayerRole.Anchor, PlayerRole.Rotator].includes(role);
  const isTRole = [PlayerRole.Support, PlayerRole.Spacetaker, PlayerRole.Lurker].includes(role);
  const isIGL = role === PlayerRole.IGL;
  const isAWP = role === PlayerRole.AWP;
  
  // Determine styling based on role type
  let badgeClass = '';
  
  if (isIGL) {
    badgeClass = 'bg-purple-900/50 text-purple-300 border-purple-700';
  } else if (isAWP) {
    badgeClass = 'bg-amber-900/50 text-amber-300 border-amber-700';
  } else if (isCTRole) {
    badgeClass = 'bg-blue-900/50 text-blue-300 border-blue-700';
  } else if (isTRole) {
    badgeClass = 'bg-orange-900/50 text-orange-300 border-orange-700';
  } else {
    badgeClass = 'bg-gray-900/50 text-gray-300 border-gray-700';
  }
  
  // Determine size-based styling
  let sizeClass = '';
  switch (size) {
    case 'sm':
      sizeClass = 'text-xs py-0 px-1.5';
      break;
    case 'lg':
      sizeClass = 'text-base py-1 px-3';
      break;
    default:
      sizeClass = 'text-sm py-0.5 px-2';
  }
  
  return (
    <Badge 
      variant="outline" 
      className={`${badgeClass} ${sizeClass} font-medium rounded`}
    >
      {role}
    </Badge>
  );
};

export default RoleBadge;