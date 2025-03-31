import React from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { BarChartBig } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background-dark text-gray-100">
      {/* Header */}
      <header className="bg-background-light py-4 px-6 shadow-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BarChartBig className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold">CS2 Player Impact Analytics</h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-400">Data Source: IEM Katowice 2025</span>
            <div className="bg-primary/20 rounded-full px-3 py-1 text-xs font-medium text-primary">
              CSDK v1.0
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 bg-gray-900">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
