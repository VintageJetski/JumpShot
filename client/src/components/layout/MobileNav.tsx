import { Link, useLocation } from "wouter";
import { 
  Users, 
  UsersRound, 
  FileText, 
  LineChart, 
  BarChart2, 
  ArrowRightLeft, 
  Percent,
  Menu,
  Image,
  Search
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger
} from "@/components/ui/sheet";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="md:hidden bg-background-light py-2 px-4 border-t border-gray-700">
      <div className="flex justify-around">
        <Link href="/players" 
          className={`flex flex-col items-center px-3 py-2 ${
            isActive("/") || isActive("/players") ? "text-primary" : "text-gray-400"
          }`}>
          <Users className="h-6 w-6" />
          <span className="text-xs mt-1">Players</span>
        </Link>
        
        <Link href="/teams"
          className={`flex flex-col items-center px-3 py-2 ${
            isActive("/teams") ? "text-primary" : "text-gray-400"
          }`}>
          <UsersRound className="h-6 w-6" />
          <span className="text-xs mt-1">Teams</span>
        </Link>
        
        <Sheet>
          <SheetTrigger className={`flex flex-col items-center px-3 py-2 ${
            isActive("/player-comparisons") || isActive("/match-predictor") || isActive("/match-infographic") || isActive("/scout") || isActive("/statistical-analysis") ? "text-primary" : "text-gray-400"
          }`}>
            <BarChart2 className="h-6 w-6" />
            <span className="text-xs mt-1">Advanced</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-xl h-auto bg-background-light">
            <div className="py-4 space-y-4">
              <h3 className="text-sm text-gray-400 uppercase font-semibold px-4">Advanced Analytics</h3>
              <div className="space-y-1">
                <Link href="/player-comparisons"
                  className={`flex items-center px-4 py-3 ${
                    isActive("/player-comparisons") ? "bg-primary/20 text-primary" : "text-gray-300 hover:bg-gray-700/50"
                  } rounded-md`}>
                  <ArrowRightLeft className="h-5 w-5 mr-3" />
                  <span>Player Comparisons</span>
                </Link>
                
                <Link href="/match-predictor"
                  className={`flex items-center px-4 py-3 ${
                    isActive("/match-predictor") ? "bg-primary/20 text-primary" : "text-gray-300 hover:bg-gray-700/50"
                  } rounded-md`}>
                  <Percent className="h-5 w-5 mr-3" />
                  <span>Match Predictor</span>
                </Link>
                
                <Link href="/match-infographic"
                  className={`flex items-center px-4 py-3 ${
                    isActive("/match-infographic") ? "bg-primary/20 text-primary" : "text-gray-300 hover:bg-gray-700/50"
                  } rounded-md`}>
                  <Image className="h-5 w-5 mr-3" />
                  <span>Match Infographic</span>
                </Link>
                
                <Link href="/scout"
                  className={`flex items-center px-4 py-3 ${
                    isActive("/scout") ? "bg-primary/20 text-primary" : "text-gray-300 hover:bg-gray-700/50"
                  } rounded-md`}>
                  <Search className="h-5 w-5 mr-3" />
                  <span>Scout</span>
                </Link>
                
                <Link href="/statistical-analysis"
                  className={`flex items-center px-4 py-3 ${
                    isActive("/statistical-analysis") ? "bg-primary/20 text-primary" : "text-gray-300 hover:bg-gray-700/50"
                  } rounded-md`}>
                  <BarChart2 className="h-5 w-5 mr-3" />
                  <span>Statistical Analysis</span>
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        
        <Link href="/role-weightings"
          className={`flex flex-col items-center px-3 py-2 ${
            isActive("/role-weightings") ? "text-primary" : "text-gray-400"
          }`}>
          <LineChart className="h-6 w-6" />
          <span className="text-xs mt-1">Roles</span>
        </Link>
        
        <Link href="/documentation"
          className={`flex flex-col items-center px-3 py-2 ${
            isActive("/documentation") ? "text-primary" : "text-gray-400"
          }`}>
          <FileText className="h-6 w-6" />
          <span className="text-xs mt-1">Docs</span>
        </Link>
      </div>
    </nav>
  );
}
