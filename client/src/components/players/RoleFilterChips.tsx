import React from 'react';
import { PlayerRole } from "@shared/schema";
import { motion } from 'framer-motion';
import { Lightbulb, Target, Shield, Users, CircleDot, Filter } from 'lucide-react';

interface RoleFilterChipsProps {
  selectedRole: string;
  onSelectRole: (role: string) => void;
}

interface RoleOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  hoverColor: string;
  activeColor: string;
}

export default function RoleFilterChips({
  selectedRole,
  onSelectRole
}: RoleFilterChipsProps) {
  // Define role options with colors and icons
  const roleOptions: RoleOption[] = [
    { 
      value: "All Roles", 
      label: "All", 
      icon: <Filter className="h-4 w-4" />,
      color: "bg-blue-800/40",
      hoverColor: "hover:bg-blue-700/50",
      activeColor: "bg-blue-600/70"
    },
    { 
      value: PlayerRole.IGL, 
      label: "IGL", 
      icon: <Lightbulb className="h-4 w-4" />,
      color: "bg-purple-800/40",
      hoverColor: "hover:bg-purple-700/50",
      activeColor: "bg-purple-600/70"
    },
    { 
      value: PlayerRole.AWP, 
      label: "AWP", 
      icon: <Target className="h-4 w-4" />,
      color: "bg-amber-800/40",
      hoverColor: "hover:bg-amber-700/50",
      activeColor: "bg-amber-600/70"
    },
    { 
      value: PlayerRole.Spacetaker, 
      label: "Spacetaker", 
      icon: <Users className="h-4 w-4" />,
      color: "bg-green-800/40",
      hoverColor: "hover:bg-green-700/50",
      activeColor: "bg-green-600/70"
    },
    { 
      value: PlayerRole.Lurker, 
      label: "Lurker", 
      icon: <Shield className="h-4 w-4" />,
      color: "bg-blue-800/40",
      hoverColor: "hover:bg-blue-700/50",
      activeColor: "bg-blue-600/70"
    },
    { 
      value: PlayerRole.Anchor, 
      label: "Anchor", 
      icon: <Shield className="h-4 w-4" />,
      color: "bg-sky-800/40",
      hoverColor: "hover:bg-sky-700/50",
      activeColor: "bg-sky-600/70"
    },
    { 
      value: PlayerRole.Support, 
      label: "Support", 
      icon: <CircleDot className="h-4 w-4" />,
      color: "bg-indigo-800/40",
      hoverColor: "hover:bg-indigo-700/50",
      activeColor: "bg-indigo-600/70"
    },
    { 
      value: PlayerRole.Rotator, 
      label: "Rotator", 
      icon: <CircleDot className="h-4 w-4" />,
      color: "bg-cyan-800/40",
      hoverColor: "hover:bg-cyan-700/50",
      activeColor: "bg-cyan-600/70"
    },
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {roleOptions.map((role, index) => {
        const isActive = selectedRole === role.value;
        
        return (
          <motion.button
            key={role.value}
            onClick={() => onSelectRole(role.value)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full
              border border-blue-500/30 transition-all duration-200
              ${isActive ? role.activeColor : role.color} 
              ${!isActive && role.hoverColor}
              ${isActive ? 'shadow-md shadow-blue-500/10' : ''}
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            {role.icon}
            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-blue-200'}`}>
              {role.label}
            </span>
            {isActive && (
              <motion.span 
                className="absolute inset-0 rounded-full bg-blue-500/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                layoutId="roleHighlight"
                transition={{ duration: 0.2 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
