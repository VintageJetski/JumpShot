import { Link, useLocation } from "wouter";
import { Users, UsersRound, BarChart2, LineChart } from "lucide-react";

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
        
        <Link href="/role-weightings"
          className={`flex flex-col items-center px-3 py-2 ${
            isActive("/role-weightings") ? "text-primary" : "text-gray-400"
          }`}>
          <LineChart className="h-6 w-6" />
          <span className="text-xs mt-1">Roles</span>
        </Link>
        
        <button className="flex flex-col items-center px-3 py-2 text-gray-400">
          <BarChart2 className="h-6 w-6" />
          <span className="text-xs mt-1">Stats</span>
        </button>
      </div>
    </nav>
  );
}
