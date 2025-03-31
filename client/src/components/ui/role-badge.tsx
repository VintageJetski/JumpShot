import { PlayerRole } from "@shared/schema";

interface RoleBadgeProps {
  role: PlayerRole;
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  let badgeColor = "";
  
  // Assign colors to different roles
  switch (role) {
    case PlayerRole.AWPer:
      badgeColor = "bg-amber-400/20 text-amber-400";
      break;
    case PlayerRole.IGL:
      badgeColor = "bg-purple-400/20 text-purple-400";
      break;
    case PlayerRole.Spacetaker:
      badgeColor = "bg-red-400/20 text-red-400";
      break;
    case PlayerRole.Lurker:
      badgeColor = "bg-blue-400/20 text-blue-400";
      break;
    case PlayerRole.Anchor:
      badgeColor = "bg-teal-400/20 text-teal-400";
      break;
    case PlayerRole.Support:
      badgeColor = "bg-green-400/20 text-green-400";
      break;
    default:
      badgeColor = "bg-gray-400/20 text-gray-400";
  }
  
  return (
    <span className={`text-xs inline-block py-1 px-2 rounded-full ${badgeColor} font-medium`}>
      {role}
    </span>
  );
}
