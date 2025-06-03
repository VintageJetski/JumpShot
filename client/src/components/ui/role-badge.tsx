import { Badge } from "./badge";
import { PlayerRole } from "@/../../shared/types";

interface RoleBadgeProps {
  role: PlayerRole;
  className?: string;
  size?: string;
  isIGL?: boolean;  // Added to support isIGL prop in PlayerDetailPage
  small?: boolean;  // Added to support small prop in PlayerComparisonsPage
}

export default function RoleBadge({ role, className = "", size = "", isIGL = false, small = false }: RoleBadgeProps) {
  const roleColors: Record<PlayerRole, { bg: string, text: string }> = {
    [PlayerRole.IGL]: { bg: "bg-purple-500", text: "text-white" },
    [PlayerRole.AWP]: { bg: "bg-yellow-500", text: "text-black" },
    [PlayerRole.Lurker]: { bg: "bg-blue-500", text: "text-white" },
    [PlayerRole.Spacetaker]: { bg: "bg-green-500", text: "text-white" },
    [PlayerRole.Support]: { bg: "bg-indigo-500", text: "text-white" },
    [PlayerRole.Anchor]: { bg: "bg-blue-700", text: "text-white" },
    [PlayerRole.Rotator]: { bg: "bg-sky-500", text: "text-white" },
  };

  const { bg, text } = roleColors[role] || { bg: "bg-gray-500", text: "text-white" };

  // Apply size classes
  let sizeClasses = "";
  if (size === "xs") {
    sizeClasses = "text-[10px] px-1 py-0 h-4 font-normal";
  } else if (size === "sm") {
    sizeClasses = "text-xs px-1.5 py-0";
  } else if (size === "lg") {
    sizeClasses = "text-base px-3 py-1";
  }

  // Apply small size through the size prop
  if (small && !size) {
    size = "sm";
  }
  
  return (
    <Badge className={`${bg} ${text} ${sizeClasses} ${className}`}>
      {isIGL ? 'IGL-' : ''}{role}
    </Badge>
  );
}