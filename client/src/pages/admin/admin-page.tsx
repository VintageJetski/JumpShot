import { ProtectedRoute } from "../components/auth/protected-route";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Shield, Database, Users, BarChart2, LogOut, Beaker, Map } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

interface AdminStats {
  message: string;
  userCount: number;
  playerCount: number;
  teamCount: number;
  lastUpdated: string;
}

export default function AdminPage() {
  const { logout, user } = useAuth();
  
  // Fetch admin stats
  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 60000, // Refresh data every minute
  });

  const handleLogout = async () => {
    await logout();
  };

  const statItems = [
    { label: "Users", value: stats?.userCount.toString() || "--", icon: <Users className="h-5 w-5" /> },
    { label: "Players", value: stats?.playerCount.toString() || "--", icon: <Users className="h-5 w-5" /> },
    { label: "Teams", value: stats?.teamCount.toString() || "--", icon: <Database className="h-5 w-5" /> },
    {
      label: "Last Updated",
      value: stats ? new Date(stats.lastUpdated).toLocaleString() : "--",
      icon: <BarChart2 className="h-5 w-5" />,
    },
  ];

  return (
    <ProtectedRoute adminOnly>
      <motion.div 
        className="container mx-auto py-8 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl font-bold text-gradient">Admin Dashboard</h1>
            <p className="text-blue-300/70">Welcome, {user?.username}</p>
          </motion.div>
          
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              variant="ghost" 
              className="text-blue-300 hover:text-blue-100 flex items-center gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </motion.div>
        </div>

        <motion.div 
          className="mb-6 p-4 glassmorphism border-glow rounded-lg"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3 text-blue-400">
            <Shield className="h-5 w-5" />
            <h2 className="text-xl font-semibold">System Overview</h2>
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, staggerChildren: 0.1 }}
        >
          {statItems.map((item, index) => (
            <motion.div 
              key={item.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <Card className="glassmorphism border-glow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-blue-300">{item.label}</h3>
                  <div className="p-2 bg-blue-900/30 rounded-full">
                    {item.icon}
                  </div>
                </div>
                <p className="text-2xl font-semibold">{item.value}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="glassmorphism border-glow rounded-lg p-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <h2 className="text-xl font-semibold mb-4">Administrator Actions</h2>
          <p className="text-blue-300/70">
            This is a protected admin page. Only authenticated administrators can access this area.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
              View System Logs
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
              Manage Users
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-500">
              System Settings
            </Button>
            <Link href="/admin/testing-environment">
              <Button className="bg-gradient-to-r from-blue-700 to-purple-600 hover:from-blue-800 hover:to-purple-700 w-full flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Testing Environment
              </Button>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </ProtectedRoute>
  );
}
