import { Link, useLocation } from "wouter";
import { Users, UsersRound, BarChart2, Info } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="md:hidden bg-background-light py-2 px-4 border-t border-gray-700">
      <div className="flex justify-around">
        <Link href="/players">
          <a className={`flex flex-col items-center px-3 py-2 ${
            isActive("/") || isActive("/players") ? "text-primary" : "text-gray-400"
          }`}>
            <Users className="h-6 w-6" />
            <span className="text-xs mt-1">Players</span>
          </a>
        </Link>
        
        <Link href="/teams">
          <a className={`flex flex-col items-center px-3 py-2 ${
            isActive("/teams") ? "text-primary" : "text-gray-400"
          }`}>
            <UsersRound className="h-6 w-6" />
            <span className="text-xs mt-1">Teams</span>
          </a>
        </Link>
        
        <button className="flex flex-col items-center px-3 py-2 text-gray-400">
          <BarChart2 className="h-6 w-6" />
          <span className="text-xs mt-1">Predictions</span>
        </button>
        
        <button className="flex flex-col items-center px-3 py-2 text-gray-400">
          <Info className="h-6 w-6" />
          <span className="text-xs mt-1">Info</span>
        </button>
      </div>
    </nav>
  );
}
