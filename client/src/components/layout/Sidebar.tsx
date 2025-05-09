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
  Trophy,
  Lock,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  AreaChart,
  Network,
  FolderOpen
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isLoggedIn } = useAuth();
  
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<{
    analytics: boolean;
    visualization: boolean;
  }>({
    analytics: false,
    visualization: false
  });

  const isActive = (path: string) => {
    return location === path;
  };

  // Determine if any child path in a section is active
  const isAnySectionActive = (paths: string[]) => {
    return paths.some(path => isActive(path));
  };

  // Animation variants for menu items
  const menuItemVariants = {
    hover: { 
      x: 5, 
      transition: { duration: 0.2 } 
    }
  };

  const MenuItem = ({ href, icon, label, isActive, indent = false }: { 
    href: string; 
    icon: React.ReactNode; 
    label: string; 
    isActive: boolean;
    indent?: boolean;
  }) => (
    <motion.div whileHover="hover" variants={menuItemVariants}>
      <Link href={href}
        className={`w-full flex items-center justify-start px-4 py-2.5 rounded-md font-medium transition-all duration-200 ${
          indent ? "ml-3" : ""
        } ${isActive ? 
          "bg-gradient border-glow text-white shadow-md shadow-blue-500/20" : 
          "text-blue-50/80 hover:text-blue-100 hover:bg-black/30"
        }`}
      >
        <div className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive ? "text-white" : "text-blue-300"}`}>
          {icon}
        </div>
        <span className="truncate">{label}</span>
        {isActive && (
          <div className="ml-auto w-1.5 h-6 rounded-full bg-blue-300/80"></div>
        )}
      </Link>
    </motion.div>
  );

  const SectionHeader = ({ 
    title, 
    icon, 
    expanded, 
    onToggle, 
    isAnyChildActive
  }: { 
    title: string; 
    icon: React.ReactNode; 
    expanded: boolean; 
    onToggle: () => void;
    isAnyChildActive: boolean;
  }) => (
    <CollapsibleTrigger asChild>
      <button 
        onClick={onToggle}
        className={`w-full flex items-center px-4 py-2.5 rounded-md transition-all duration-200 ${
          isAnyChildActive ? "text-blue-200" : "text-blue-100/80"
        } hover:text-blue-100 hover:bg-black/30`}
      >
        <div className="h-5 w-5 mr-3 text-blue-300">
          {icon}
        </div>
        <span className="font-medium">{title}</span>
        <div className="ml-auto h-5 w-5 text-blue-300">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
    </CollapsibleTrigger>
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

  // Group paths for checking active status
  const analyticsRoutes = ['/match-predictor', '/player-comparisons', '/scout', '/advanced-analytics'];
  const visualizationRoutes = ['/statistical-analysis', '/data-visualization', '/match-infographic'];

  return (
    <aside className="hidden md:block w-64 glassmorphism border-r border-white/5 p-5 h-full overflow-y-auto">
      <nav className="h-full flex flex-col justify-between">
        <div className="space-y-1">
          {/* Main Navigation - Always visible */}
          <motion.div 
            className="mb-3 px-4"
            initial="hidden"
            animate="visible"
            variants={dividerVariants}
          >
            <div className="flex items-center">
              <FolderOpen className="h-4 w-4 text-blue-400 mr-2" />
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Core</h3>
              <div className="ml-2 h-px flex-grow bg-gradient-to-r from-blue-500/50 to-transparent"></div>
            </div>
          </motion.div>
          
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
          
          {/* Analytics Section - Collapsible */}
          <motion.div 
            className="mt-6 mb-2 px-4"
            initial="hidden"
            animate="visible"
            variants={dividerVariants}
          >
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 text-blue-400 mr-2" />
              <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Tools</h3>
              <div className="ml-2 h-px flex-grow bg-gradient-to-r from-blue-500/50 to-transparent"></div>
            </div>
          </motion.div>
          
          <Collapsible
            open={expandedSections.analytics || isAnySectionActive(analyticsRoutes)}
            className="mb-1"
          >
            <SectionHeader
              title="Analytics & Predictions"
              icon={<AreaChart />}
              expanded={expandedSections.analytics || isAnySectionActive(analyticsRoutes)}
              onToggle={() => setExpandedSections(prev => ({ ...prev, analytics: !prev.analytics }))}
              isAnyChildActive={isAnySectionActive(analyticsRoutes)}
            />
            <CollapsibleContent className="mt-1 space-y-1">
              <MenuItem 
                href="/match-predictor" 
                icon={<Percent />} 
                label="Match Predictor" 
                isActive={isActive("/match-predictor")}
                indent
              />
              
              <MenuItem 
                href="/player-comparisons" 
                icon={<ArrowRightLeft />} 
                label="Player Comparisons" 
                isActive={isActive("/player-comparisons")}
                indent
              />
              
              <MenuItem 
                href="/scout" 
                icon={<Search />} 
                label="Scout" 
                isActive={isActive("/scout")}
                indent
              />
              
              <MenuItem 
                href="/advanced-analytics" 
                icon={<Sigma />} 
                label="Advanced Analytics" 
                isActive={isActive("/advanced-analytics")}
                indent
              />
            </CollapsibleContent>
          </Collapsible>
          
          {/* Visualization Section - Collapsible */}
          <Collapsible
            open={expandedSections.visualization || isAnySectionActive(visualizationRoutes)}
            className="mb-1"
          >
            <SectionHeader
              title="Data Visualization"
              icon={<Network />}
              expanded={expandedSections.visualization || isAnySectionActive(visualizationRoutes)}
              onToggle={() => setExpandedSections(prev => ({ ...prev, visualization: !prev.visualization }))}
              isAnyChildActive={isAnySectionActive(visualizationRoutes)}
            />
            <CollapsibleContent className="mt-1 space-y-1">
              <MenuItem 
                href="/statistical-analysis" 
                icon={<BarChart2 />} 
                label="Statistical Analysis" 
                isActive={isActive("/statistical-analysis")}
                indent
              />

              <MenuItem 
                href="/data-visualization" 
                icon={<PieChart />} 
                label="Data Visualization" 
                isActive={isActive("/data-visualization")}
                indent
              />
              
              <MenuItem 
                href="/match-infographic" 
                icon={<Image />} 
                label="Match Infographic" 
                isActive={isActive("/match-infographic")}
                indent
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <div className="mt-8 pt-6 border-t border-white/5">
          {/* Administration section - only visible when not logged in or when logged in as admin */}
          {(!isLoggedIn || (isLoggedIn && user?.username === 'Admin')) && (
            <>
              <div className="flex items-center px-4 mb-2">
                <ShieldCheck className="h-4 w-4 text-blue-400 mr-2" />
                <h3 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Administration</h3>
              </div>
              <div className="space-y-1 mb-6">
                {!isLoggedIn ? (
                  <MenuItem 
                    href="/auth/login" 
                    icon={<Lock />} 
                    label="Admin Login" 
                    isActive={isActive("/auth/login")} 
                  />
                ) : (
                  <MenuItem 
                    href="/admin" 
                    icon={<ShieldCheck />} 
                    label="Admin Dashboard" 
                    isActive={isActive("/admin")} 
                  />
                )}
              </div>
            </>
          )}
          
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
