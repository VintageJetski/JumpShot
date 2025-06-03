import { Link, useLocation } from "wouter";
import { 
  Users, 
  UsersRound, 
  FileText, 
  LineChart, 
  BarChart2, 
  ArrowRightLeft, 
  Percent,
  Image,
  Search,
  PieChart,
  Sigma,
  Sparkles
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";
import { motion } from "framer-motion";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const MobileNavItem = ({ href, icon, label, isActive }: { href: string; icon: React.ReactNode; label: string; isActive: boolean }) => (
    <Link href={href} 
      className={`flex flex-col items-center px-3 py-2 relative ${isActive ? "text-blue-400" : "text-blue-200/60"}`}
    >
      {isActive && (
        <motion.div 
          className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      <div className="relative">
        {isActive && (
          <motion.div 
            className="absolute inset-0 bg-blue-500/20 blur-sm rounded-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
        <div className="relative">
          {icon}
        </div>
      </div>
      <span className="text-xs mt-1.5 font-medium">{label}</span>
    </Link>
  );

  const SheetNavItem = ({ href, icon, label, isActive }: { href: string; icon: React.ReactNode; label: string; isActive: boolean }) => (
    <Link href={href}
      className={`flex items-center px-4 py-3 rounded-md transition-all duration-200 ${isActive ? 
        "bg-gradient border-glow text-white" : 
        "text-blue-50/80 hover:text-blue-100 hover:bg-black/30"
      }`}
    >
      <div className={`h-5 w-5 mr-3 ${isActive ? "text-white" : "text-blue-300"}`}>
        {icon}
      </div>
      <span className="font-medium">{label}</span>
      {isActive && (
        <div className="ml-auto w-1.5 h-6 rounded-full bg-blue-300/80"></div>
      )}
    </Link>
  );

  return (
    <nav className="md:hidden glassmorphism py-3 px-4 border-t border-white/5 z-40">
      <div className="flex justify-around">
        <MobileNavItem 
          href="/players" 
          icon={<Users className="h-6 w-6" />} 
          label="Players" 
          isActive={isActive("/") || isActive("/players")} 
        />
        
        <MobileNavItem 
          href="/teams" 
          icon={<UsersRound className="h-6 w-6" />} 
          label="Teams" 
          isActive={isActive("/teams")} 
        />
        
        <Sheet>
          <SheetTrigger className={`flex flex-col items-center px-3 py-2 relative ${
            isActive("/player-comparisons") || 
            isActive("/match-predictor") || 
            isActive("/match-infographic") || 
            isActive("/scout") || 
            isActive("/statistical-analysis") || 
            isActive("/data-visualization") || 
            isActive("/advanced-analytics") ? 
            "text-blue-400" : "text-blue-200/60"
          }`}>
            <div className="relative">
              {(isActive("/player-comparisons") || 
                isActive("/match-predictor") || 
                isActive("/match-infographic") || 
                isActive("/scout") || 
                isActive("/statistical-analysis") || 
                isActive("/data-visualization") || 
                isActive("/advanced-analytics")) && (
                <motion.div 
                  className="absolute inset-0 bg-blue-500/20 blur-sm rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
              <div className="relative">
                <BarChart2 className="h-6 w-6" />
              </div>
            </div>
            <span className="text-xs mt-1.5 font-medium">Advanced</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="glassmorphism rounded-t-xl h-auto border-t border-white/10 backdrop-blur-xl p-4">
            <div className="py-4 space-y-4">
              <div className="flex items-center px-4 mb-2">
                <Sparkles className="h-4 w-4 text-blue-400 mr-2" />
                <h3 className="text-sm text-blue-300 uppercase font-semibold">Advanced Analytics</h3>
                <div className="ml-2 h-px flex-grow bg-gradient-to-r from-blue-500/50 to-transparent"></div>
              </div>
              <div className="space-y-1.5">
                <SheetNavItem 
                  href="/player-comparisons" 
                  icon={<ArrowRightLeft />} 
                  label="Player Comparisons" 
                  isActive={isActive("/player-comparisons")} 
                />
                
                <SheetNavItem 
                  href="/match-predictor" 
                  icon={<Percent />} 
                  label="Match Predictor" 
                  isActive={isActive("/match-predictor")} 
                />
                
                <SheetNavItem 
                  href="/match-infographic" 
                  icon={<Image />} 
                  label="Match Infographic" 
                  isActive={isActive("/match-infographic")} 
                />
                
                <SheetNavItem 
                  href="/scout" 
                  icon={<Search />} 
                  label="Scout" 
                  isActive={isActive("/scout")} 
                />
                
                <SheetNavItem 
                  href="/statistical-analysis" 
                  icon={<BarChart2 />} 
                  label="Statistical Analysis" 
                  isActive={isActive("/statistical-analysis")} 
                />

                <SheetNavItem 
                  href="/data-visualization" 
                  icon={<PieChart />} 
                  label="Data Visualization" 
                  isActive={isActive("/data-visualization")} 
                />
                
                <SheetNavItem 
                  href="/advanced-analytics" 
                  icon={<Sigma />} 
                  label="Advanced Analytics" 
                  isActive={isActive("/advanced-analytics")} 
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <MobileNavItem 
          href="/role-weightings" 
          icon={<LineChart className="h-6 w-6" />} 
          label="Roles" 
          isActive={isActive("/role-weightings")} 
        />
        
        <MobileNavItem 
          href="/documentation" 
          icon={<FileText className="h-6 w-6" />} 
          label="Docs" 
          isActive={isActive("/documentation")} 
        />
      </div>
    </nav>
  );
}
