import React from 'react';

interface AK47IconProps {
  className?: string;
  size?: number;
}

const AK47Icon: React.FC<AK47IconProps> = ({ className = "", size = 24 }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={className}
    >
      {/* AK-47 Silhouette */}
      <path d="M22 8L20 10V12H17L16 13H12L10 14H8V15H4L3 14V13L4 12H8L10 11H14L16 10H18L19 9H21L22 8Z" />
      <path d="M3 12L2 13V14L3 15" />
      <path d="M8 11V14" />
      <path d="M12 10V13" />
      <path d="M16 9V12" />
      <path d="M19 8L18 9" />
    </svg>
  );
};

export default AK47Icon;