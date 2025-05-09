import React from 'react';
import { AlignCenter, ChevronDown, Cog, Layers, LineChart, Play, Plus, Users, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';

const VentionStyleMockup = () => {
  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white">
      {/* Sidebar with Vention-style */}
      <div className="w-64 h-full border-r border-[#333333]">
        <div className="p-4 border-b border-[#333333] flex items-center">
          <h1 className="text-lg font-light">JumpShot</h1>
        </div>
        
        {/* Navigation Items */}
        <div className="mt-4">
          {/* Active Item */}
          <div className="px-4 py-3 border-l-2 border-blue-500 flex items-center justify-between">
            <div className="flex items-center">
              <LineChart className="h-4 w-4 mr-3 text-blue-500" />
              <span className="text-sm font-medium">Analytics</span>
            </div>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
          
          {/* Sub-items for Analytics */}
          <div className="ml-6 mt-1 space-y-1">
            <div className="px-4 py-2 flex items-center text-blue-500 font-medium">
              <Users className="h-4 w-4 mr-3" />
              <span className="text-sm">Players</span>
            </div>
            <div className="px-4 py-2 flex items-center text-gray-400">
              <UsersRound className="h-4 w-4 mr-3" />
              <span className="text-sm">Teams</span>
            </div>
          </div>
          
          {/* Regular Items */}
          <div className="px-4 py-3 flex items-center justify-between text-gray-400">
            <div className="flex items-center">
              <Play className="h-4 w-4 mr-3" />
              <span className="text-sm">Match Predictor</span>
            </div>
            <Plus className="h-3 w-3" />
          </div>
          
          <div className="px-4 py-3 flex items-center justify-between text-gray-400">
            <div className="flex items-center">
              <Layers className="h-4 w-4 mr-3" />
              <span className="text-sm">Dashboard</span>
            </div>
            <Plus className="h-3 w-3" />
          </div>
          
          <div className="px-4 py-3 flex items-center justify-between text-gray-400">
            <div className="flex items-center">
              <AlignCenter className="h-4 w-4 mr-3" />
              <span className="text-sm">Documentation</span>
            </div>
            <Plus className="h-3 w-3" />
          </div>
        </div>
        
        {/* Bottom Settings */}
        <div className="absolute bottom-0 w-64 border-t border-[#333333] p-4">
          <div className="flex items-center text-gray-400">
            <Cog className="h-4 w-4 mr-3" />
            <span className="text-sm">Settings</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation with Controls - Vention style */}
        <div className="h-14 border-b border-[#333333] flex items-center justify-between px-6">
          <div className="flex space-x-6">
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-2">Font size</span>
              <div className="w-32 h-1 bg-[#333333] rounded-full relative">
                <div className="absolute left-1/2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="text-xs text-gray-400 mr-2">Font weight</span>
              <div className="w-32 h-1 bg-[#333333] rounded-full relative">
                <div className="absolute left-2/3 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-400">24px</div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-light mb-1">Player Analytics</h1>
            <p className="text-gray-400">Advanced statistics and performance metrics for CS2 players</p>
          </div>
          
          {/* Player Card - Glassmorphism style with Vention-like clean design */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#222222] backdrop-blur-sm border border-[#333333] rounded-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-light">ZywOo</h2>
                  <p className="text-blue-500 text-sm">Team Vitality</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-medium text-blue-500">2.00</div>
                  <p className="text-xs text-gray-400">PIV Rating</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">K/D Ratio</span>
                  <span className="text-sm">1.61</span>
                </div>
                <div className="h-1 bg-[#333333] rounded-full w-full">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{width: '80%'}}></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">Opening Success</span>
                  <span className="text-sm">57.7%</span>
                </div>
                <div className="h-1 bg-[#333333] rounded-full w-full">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{width: '57%'}}></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">AWP Impact</span>
                  <span className="text-sm">0.74</span>
                </div>
                <div className="h-1 bg-[#333333] rounded-full w-full">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{width: '74%'}}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#222222] backdrop-blur-sm border border-[#333333] rounded-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-light">s1mple</h2>
                  <p className="text-blue-500 text-sm">NAVI</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-medium text-blue-500">1.98</div>
                  <p className="text-xs text-gray-400">PIV Rating</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">K/D Ratio</span>
                  <span className="text-sm">1.59</span>
                </div>
                <div className="h-1 bg-[#333333] rounded-full w-full">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{width: '79%'}}></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">Opening Success</span>
                  <span className="text-sm">62.1%</span>
                </div>
                <div className="h-1 bg-[#333333] rounded-full w-full">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{width: '62%'}}></div>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-400">AWP Impact</span>
                  <span className="text-sm">0.72</span>
                </div>
                <div className="h-1 bg-[#333333] rounded-full w-full">
                  <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" style={{width: '72%'}}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Player Comparison Section */}
          <div className="mt-8">
            <h2 className="text-xl font-light mb-4">Performance Comparison</h2>
            <div className="bg-[#222222] backdrop-blur-sm border border-[#333333] rounded-md p-6">
              <div className="mb-6 flex justify-center">
                <div className="text-center px-4">
                  <h3 className="text-sm text-gray-400">ZywOo</h3>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mt-2">
                    <span className="text-2xl font-medium">2.00</span>
                  </div>
                </div>
                <div className="text-center px-4">
                  <h3 className="text-sm text-gray-400">s1mple</h3>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-300 flex items-center justify-center mt-2">
                    <span className="text-2xl font-medium">1.98</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">CT Side Performance</span>
                    <div>
                      <span className="text-blue-500">2.14</span>
                      <span className="mx-2 text-gray-500">vs</span>
                      <span className="text-blue-400">2.11</span>
                    </div>
                  </div>
                  <div className="flex h-2">
                    <div className="w-1/2 bg-[#333333] rounded-l-full relative">
                      <div className="absolute right-0 top-0 h-full bg-blue-500 rounded-l-full" style={{width: '51%'}}></div>
                    </div>
                    <div className="w-1/2 bg-[#333333] rounded-r-full relative">
                      <div className="absolute left-0 top-0 h-full bg-blue-400 rounded-r-full" style={{width: '49%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">T Side Performance</span>
                    <div>
                      <span className="text-blue-500">1.86</span>
                      <span className="mx-2 text-gray-500">vs</span>
                      <span className="text-blue-400">1.85</span>
                    </div>
                  </div>
                  <div className="flex h-2">
                    <div className="w-1/2 bg-[#333333] rounded-l-full relative">
                      <div className="absolute right-0 top-0 h-full bg-blue-500 rounded-l-full" style={{width: '50.1%'}}></div>
                    </div>
                    <div className="w-1/2 bg-[#333333] rounded-r-full relative">
                      <div className="absolute left-0 top-0 h-full bg-blue-400 rounded-r-full" style={{width: '49.9%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">AWP Impact</span>
                    <div>
                      <span className="text-blue-500">0.74</span>
                      <span className="mx-2 text-gray-500">vs</span>
                      <span className="text-blue-400">0.72</span>
                    </div>
                  </div>
                  <div className="flex h-2">
                    <div className="w-1/2 bg-[#333333] rounded-l-full relative">
                      <div className="absolute right-0 top-0 h-full bg-blue-500 rounded-l-full" style={{width: '51%'}}></div>
                    </div>
                    <div className="w-1/2 bg-[#333333] rounded-r-full relative">
                      <div className="absolute left-0 top-0 h-full bg-blue-400 rounded-r-full" style={{width: '49%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VentionStyleMockup;