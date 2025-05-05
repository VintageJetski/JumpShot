import { Link, useLocation } from "wouter";
import { 
  Users, 
  UsersRound, 
  BarChart2, 
  LineChart, 
  FileText, 
  ArrowRightLeft,
  Percent,
  Image,
  Search,
  PieChart,
  Sigma,
  Sparkles,
  Trophy
} from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  // Animation variants for menu items
  const menuItemVariants = {
    hover: { 
      x: 5, 
      transition: { duration: 0.2 } 
    }
  };

  const MenuItem = ({ href, icon, label, isActive }: { href: string; icon: React.ReactNode; label: string; isActive: boolean }) => (
    <motion.div whileHover="hover" variants={menuItemVariants}>
      <Link href={href}
        className={`w-full flex items-center justify-start px-4 py-3 rounded-md font-medium transition-all duration-200 ${isActive ? 
          "bg-gradient border-glow text-white shadow-md shadow-blue-500/20" : 
          "text-blue-50/80 hover:text-blue-100 hover:bg-black/30"
        }`}
      >
        <div className={`h-5 w-5 mr-3 ${isActive ? "text-white" : "text-blue-300"}`}>
          {icon}
        </div>
        <span>{label}</span>
        {isActive && (
          <div className="ml-auto w-1.5 h-6 rounded-full bg-blue-300/80"></div>
        )}
      </Link>
    </motion.div>
  );

  const dividerVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        delay: 0.2,
        duration: 0.3
      } 
    }
  };

  return (
    <aside className="hidden md:block w-64 glassmorphism border-r border-white/5 p-5 h-full overflow-y-auto">
      <nav className="h-full flex flex-col justify-between">
        <div className="space-y-1.5">
          <MenuItem 
            href="/players" 
            icon={<Users />} 
            label="Players" 
            isActive={isActive("/") || isActive("/players")} 
          />
          
          <MenuItem 
            href="/teams" 
            icon={<UsersRound />} 
            label="Teams" 
            isActive={isActive("/teams")} 
          />
          
          <MenuItem 
            href="/role-weightings" 
            icon={<LineChart />} 
            label="Role Weightings" 
            isActive={isActive("/role-weightings")} 
          />
          
          <MenuItem 
            href="/documentation" 
            icon={<FileText />} 
            label="Documentation" 
            isActive={isActive("/documentation")} 
          />
          
          <motion.div 
            className="mt-8 mb-3 px-4"
            initial="hidden"
            animate="visible"
            variants={dividerVariants}
          >
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 text-blue-400 mr-2" />
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Advanced Analytics</h3>
              <div className="ml-2 h-px flex-grow bg-gradient-to-r from-blue-500/50 to-transparent"></div>
            </div>
          </motion.div>
          
          <MenuItem 
            href="/player-comparisons" 
            icon={<ArrowRightLeft />} 
            label="Player Comparisons" 
            isActive={isActive("/player-comparisons")} 
          />
          
          <MenuItem 
            href="/match-predictor" 
            icon={<Percent />} 
            label="Match Predictor" 
            isActive={isActive("/match-predictor")} 
          />
          
          <MenuItem 
            href="/match-infographic" 
            icon={<Image />} 
            label="Match Infographic" 
            isActive={isActive("/match-infographic")} 
          />
          
          <MenuItem 
            href="/scout" 
            icon={<Search />} 
            label="Scout" 
            isActive={isActive("/scout")} 
          />
          
          <MenuItem 
            href="/statistical-analysis" 
            icon={<BarChart2 />} 
            label="Statistical Analysis" 
            isActive={isActive("/statistical-analysis")} 
          />

          <MenuItem 
            href="/data-visualization" 
            icon={<PieChart />} 
            label="Data Visualization" 
            isActive={isActive("/data-visualization")} 
          />
          
          <MenuItem 
            href="/advanced-analytics" 
            icon={<Sigma />} 
            label="Advanced Analytics" 
            isActive={isActive("/advanced-analytics")} 
          />
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center px-4 mb-2">
            <Trophy className="h-4 w-4 text-blue-400 mr-2" />
            <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">About</h3>
          </div>
          <div className="mt-2 space-y-1 px-4">
            <div className="text-blue-200/80 text-sm font-medium">
              JumpShot v1.4
            </div>
            <div className="text-blue-100/50 text-xs">
              Updated: May 5, 2025
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
