import { Link, useLocation } from "wouter";
import { 
  Users, 
  UsersRound, 
  BarChart2, 
  LineChart, 
  FileText, 
  FileCode, 
  Database,
  ArrowRightLeft,
  Percent,
  Activity,
  Image,
  Search
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="hidden md:block w-56 bg-background-light p-4 h-full">
      <nav className="h-full flex flex-col justify-between">
        <div className="space-y-1">
          <Link href="/players"
            className={`w-full flex items-center justify-start px-4 py-2 ${
              isActive("/") || isActive("/players")
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            } rounded font-medium`}
          >
            <Users className="h-5 w-5 mr-2" />
            Players
          </Link>
          
          <Link href="/teams"
            className={`w-full flex items-center justify-start px-4 py-2 ${
              isActive("/teams")
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            } rounded font-medium`}
          >
            <UsersRound className="h-5 w-5 mr-2" />
            Teams
          </Link>
          
          <Link href="/role-weightings" 
            className={`w-full flex items-center justify-start px-4 py-2 ${
              isActive("/role-weightings")
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            } rounded font-medium`}
          >
            <LineChart className="h-5 w-5 mr-2" />
            Role Weightings
          </Link>
          
          <Link href="/documentation" 
            className={`w-full flex items-center justify-start px-4 py-2 ${
              isActive("/documentation")
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            } rounded font-medium`}
          >
            <FileText className="h-5 w-5 mr-2" />
            Documentation
          </Link>
          
          <div className="mt-6 mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4">Advanced Analytics</h3>
          </div>
          
          <Link href="/player-comparisons" 
            className={`w-full flex items-center justify-start px-4 py-2 ${
              isActive("/player-comparisons")
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            } rounded font-medium`}
          >
            <ArrowRightLeft className="h-5 w-5 mr-2" />
            Player Comparisons
          </Link>
          
          <Link href="/match-predictor" 
            className={`w-full flex items-center justify-start px-4 py-2 ${
              isActive("/match-predictor")
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            } rounded font-medium`}
          >
            <Percent className="h-5 w-5 mr-2" />
            Match Predictor
          </Link>
          
          <Link href="/match-infographic" 
            className={`w-full flex items-center justify-start px-4 py-2 ${
              isActive("/match-infographic")
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            } rounded font-medium`}
          >
            <Image className="h-5 w-5 mr-2" />
            Match Infographic
          </Link>
          
          <Link href="/scout" 
            className={`w-full flex items-center justify-start px-4 py-2 ${
              isActive("/scout")
                ? "bg-primary text-white"
                : "text-gray-300 hover:bg-gray-700"
            } rounded font-medium`}
          >
            <Search className="h-5 w-5 mr-2" />
            Scout
          </Link>
        </div>
        
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">About</h3>
          <div className="mt-2 space-y-1">
            <div className="px-4 py-2 text-gray-400 text-sm">
              CS2 Analytics v1.3
            </div>
            <div className="px-4 py-2 text-gray-400 text-xs">
              Updated: April 24, 2024
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
