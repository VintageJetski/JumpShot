import { Link, useLocation } from "wouter";
import { 
  Users, 
  UsersRound, 
  BarChart2, 
  LineChart, 
  FileText, 
  FileCode, 
  Database
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
          
          <button className="w-full flex items-center justify-start px-4 py-2 text-gray-300 hover:bg-gray-700 rounded font-medium">
            <BarChart2 className="h-5 w-5 mr-2" />
            Match Predictions
          </button>
          
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
        </div>
        
        <div className="mt-8">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Documentation</h3>
          <div className="mt-2 space-y-1">
            <Link href="/role-weightings" className="block px-4 py-2 text-gray-300 hover:bg-gray-700 rounded text-sm">
              <FileText className="h-4 w-4 mr-2 inline-block" />
              PIV Calculation
            </Link>
            <Link href="/role-weightings" className="block px-4 py-2 text-gray-300 hover:bg-gray-700 rounded text-sm">
              <FileCode className="h-4 w-4 mr-2 inline-block" />
              Role Metrics
            </Link>
            <Link href="/" className="block px-4 py-2 text-gray-300 hover:bg-gray-700 rounded text-sm">
              <Database className="h-4 w-4 mr-2 inline-block" />
              Data Sources
            </Link>
          </div>
        </div>
      </nav>
    </aside>
  );
}
