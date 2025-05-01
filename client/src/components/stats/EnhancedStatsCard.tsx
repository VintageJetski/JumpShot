import React from "react";
import { motion } from "framer-motion";

interface EnhancedStatsCardProps {
  title: string;
  value: string;
  metric: string;
  metricColor: string;
  bgGradient: string;
  icon: React.ReactNode;
  subtext: React.ReactNode;
  index: number;
}

export default function EnhancedStatsCard({
  title,
  value,
  metric,
  metricColor,
  bgGradient,
  icon,
  subtext,
  index = 0,
}: EnhancedStatsCardProps) {
  // Create a delay for staggered animation
  const staggerDelay = index * 0.1;

  return (
    <motion.div 
      className="glassmorphism border-glow card-hover rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: staggerDelay }}
      whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
    >
      <div className="relative">
        {/* Background gradient */}
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${bgGradient}`}></div>
        
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-300 text-sm font-medium">{title}</p>
              <p className="text-lg font-bold mt-1 text-white">{value}</p>
              <div className={`${metricColor} inline-block rounded-full px-2.5 py-1 text-xs font-medium mt-2 bg-blue-900/20 border border-blue-500/20`}>
                {metric}
              </div>
            </div>
            <motion.div 
              className={`p-2.5 rounded-lg bg-blue-900/30 border border-blue-500/20`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: staggerDelay + 0.2 }}
            >
              {icon}
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: staggerDelay + 0.3 }}
          >
            {typeof subtext === "string" ? (
              <div className="flex items-center">
                <span className="text-sm text-blue-200/80">
                  {subtext}
                </span>
              </div>
            ) : (
              subtext
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
