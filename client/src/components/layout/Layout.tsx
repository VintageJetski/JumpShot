import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { BarChartBig, BarChart } from "lucide-react";
import { useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  
  // Reset scroll position when changing pages
  useEffect(() => {
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }
  }, [location]);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="glassmorphism py-4 px-6 border-b border-white/5 shadow-lg sticky top-0 z-50">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-amber-400 rounded-full blur-sm opacity-75"></div>
              <div className="relative bg-black p-1.5 rounded-full">
                <svg className="h-7 w-7 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5" />
                  <path d="M5 12l7-7 7 7" />
                  <path d="M12 19c-4.4 0-8-3.6-8-8h16c0 4.4-3.6 8-8 8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-xl font-bold text-gradient">JumpShot</h1>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-blue-200/60">Data Source: IEM Katowice 2025</span>
            <div className="border border-blue-500/30 bg-blue-950/30 shadow-inner shadow-blue-500/5 rounded-full px-4 py-1.5 text-xs font-medium text-blue-300">
              CSDK v1.4
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content Area */}
        <div id="content-area" className="flex-grow overflow-y-auto p-4 md:p-6">
          <div className="page-transition">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}
