import { Badge } from "@/components/ui/badge";
import { PlayerRole } from "@shared/types";

interface RoleBadgeProps {
  role: PlayerRole;
  className?: string;
  size?: string;
}

export default function RoleBadge({ role, className = "", size = "" }: RoleBadgeProps) {
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
  if (size === "sm") {
    sizeClasses = "text-xs px-1.5 py-0";
  } else if (size === "lg") {
    sizeClasses = "text-base px-3 py-1";
  }

  return (
    <Badge className={`${bg} ${text} ${sizeClasses} ${className}`}>
      {role}
    </Badge>
  );
}