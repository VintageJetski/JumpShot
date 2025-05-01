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

  // Spring animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 100, 
        damping: 15,
        delay: staggerDelay,
        duration: 0.6
      } 
    },
    hover: { 
      y: -8, 
      scale: 1.03, 
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 15 } 
    }
  };

  const iconVariants = {
    hidden: { scale: 0, opacity: 0, rotate: -15 },
    visible: { 
      scale: 1, 
      opacity: 1, 
      rotate: 0,
      transition: { 
        type: "spring", 
        stiffness: 200, 
        delay: staggerDelay + 0.2, 
        duration: 0.8 
      }
    },
    hover: { 
      scale: 1.1, 
      rotate: [0, -10, 10, 0],
      transition: { 
        duration: 0.5, 
        type: "spring", 
        stiffness: 300, 
        damping: 10 
      } 
    }
  };

  const gradientVariants = {
    hidden: { width: "0%", opacity: 0.5 },
    visible: { 
      width: "100%", 
      opacity: 1, 
      transition: { delay: staggerDelay + 0.1, duration: 0.7 } 
    },
    hover: { 
      height: "4px", 
      transition: { duration: 0.2 } 
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: staggerDelay + custom, duration: 0.5 }
    }),
    hover: { y: -2 }
  };

  return (
    <motion.div 
      className="glassmorphism border-glow card-hover rounded-lg overflow-hidden relative"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <div className="relative">
        {/* Background gradient with animation */}
        <motion.div 
          className={`absolute top-0 left-0 h-1 bg-gradient-to-r ${bgGradient}`}
          variants={gradientVariants}
        />
        
        {/* Subtle pulse highlight effect on hover */}
        <motion.div 
          className={`absolute inset-0 rounded-lg bg-gradient-to-br ${bgGradient} opacity-0`}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.03, scale: 1.02 }}
          transition={{ duration: 0.3 }}
        />
        
        <div className="p-4 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <motion.p 
                className="text-blue-300 text-sm font-medium"
                variants={textVariants}
                custom={0.1}
              >
                {title}
              </motion.p>
              
              <motion.p 
                className="text-lg font-bold mt-1 text-white"
                variants={textVariants}
                custom={0.2}
              >
                {value}
              </motion.p>
              
              <motion.div 
                className={`${metricColor} inline-block rounded-full px-2.5 py-1 text-xs font-medium mt-2 bg-blue-900/20 border border-blue-500/20`}
                variants={textVariants}
                custom={0.25}
                whileHover={{ scale: 1.05 }}
              >
                {metric}
              </motion.div>
            </div>
            
            <motion.div 
              className={`p-2.5 rounded-lg bg-blue-900/30 border border-blue-500/20`}
              variants={iconVariants}
            >
              {icon}
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-3"
            variants={textVariants}
            custom={0.3}
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
