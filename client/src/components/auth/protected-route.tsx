import { useAuth } from "../hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { Redirect } from "wouter";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isLoading, isLoggedIn } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-400 mx-auto" />
          <p className="mt-4 text-blue-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Redirect to="/auth/login" />;
  }

  // Check if route is admin only and user is admin
  if (adminOnly && user?.username !== "Admin") {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}
