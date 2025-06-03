import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Redirect } from "wouter";
import { LockIcon, LogIn, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, isLoggedIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      await login(username, password);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Redirect if already logged in
  if (isLoggedIn) {
    return <Redirect to="/" />;
  }

  return (
    <motion.div 
      className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glassmorphism border-glow p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div 
            className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-900/30 border border-blue-500/50 mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <LockIcon className="h-8 w-8 text-blue-400" />
          </motion.div>
          <motion.h2 
            className="text-2xl font-bold text-gradient mb-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            JumpShot Analytics
          </motion.h2>
          <motion.p 
            className="text-blue-300/70 text-sm"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            Login to access the CS2 analytics platform
          </motion.p>
        </div>

        <motion.form 
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-blue-200">
              Username
            </label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-blue-950/20 border-blue-500/30"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-blue-200">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-blue-950/20 border-blue-500/30"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white flex items-center justify-center gap-2"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
          
          <div className="mt-4 text-center text-xs text-blue-300/50">
            <p>Use the following credentials:</p>
            <p className="font-mono bg-blue-900/20 px-2 py-1 rounded mt-1 inline-block">Username: Admin | Password: @Jumpshot123</p>
          </div>
        </motion.form>
      </Card>
    </motion.div>
  );
}
