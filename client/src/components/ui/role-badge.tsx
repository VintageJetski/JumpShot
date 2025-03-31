import { PlayerRole } from "@shared/schema";

interface RoleBadgeProps {
  role: PlayerRole;
  secondaryRole?: PlayerRole;
  isMainAwper?: boolean;
  isIGL?: boolean;
  size?: "sm" | "md";
}

export default function RoleBadge({ 
  role, 
  secondaryRole, 
  isMainAwper,
  isIGL,
  size = "md" 
}: RoleBadgeProps) {
  const getRoleColor = (roleType: PlayerRole): string => {
    switch (roleType) {
      case PlayerRole.AWPer:
        return "bg-amber-400/20 text-amber-400";
      case PlayerRole.IGL:
        return "bg-purple-400/20 text-purple-400";
      case PlayerRole.Spacetaker:
        return "bg-red-400/20 text-red-400";
      case PlayerRole.Lurker:
        return "bg-blue-400/20 text-blue-400";
      case PlayerRole.Anchor:
        return "bg-teal-400/20 text-teal-400";
      case PlayerRole.Support:
        return "bg-green-400/20 text-green-400";
      default:
        return "bg-gray-400/20 text-gray-400";
    }
  };
  
  const primaryBadgeColor = getRoleColor(role);
  const sizeClass = size === "sm" ? "text-[10px] py-0.5 px-1.5" : "text-xs py-1 px-2";
  
  // For hybrid roles, we want special indicators
  const showSpecialIndicator = isMainAwper || isIGL;
  const specialIndicator = isIGL ? "IGL" : isMainAwper ? "AWP" : "";
  
  // If we have a secondary role or special indicator, display in dual badge format
  if (secondaryRole || showSpecialIndicator) {
    const secondaryBadgeColor = secondaryRole ? getRoleColor(secondaryRole) : "bg-gray-600/20 text-gray-400";
    
    return (
      <div className="flex items-center space-x-1">
        <span className={`${sizeClass} inline-block rounded-full ${primaryBadgeColor} font-medium`}>
          {role}
        </span>
        {secondaryRole && (
          <span className={`${sizeClass} inline-block rounded-full ${secondaryBadgeColor} font-medium`}>
            {secondaryRole}
          </span>
        )}
        {showSpecialIndicator && !secondaryRole && (
          <span className={`${sizeClass} inline-block rounded-full bg-gray-700 font-medium ${isIGL ? 'text-purple-400' : 'text-amber-400'}`}>
            {specialIndicator}
          </span>
        )}
      </div>
    );
  }
  
  // Single role display
  return (
    <span className={`${sizeClass} inline-block rounded-full ${primaryBadgeColor} font-medium`}>
      {role}
    </span>
  );
}
