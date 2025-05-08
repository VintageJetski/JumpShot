import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { PlayerWithPIV } from '@shared/schema';

// Mock data for the PIV over time chart
// In a real implementation, this would come from historical player data
function generateHistoricalData(player: PlayerWithPIV, startDate: Date, endDate: Date) {
  const data = [];
  const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Base PIV
  const basePIV = player.piv;
  
  // Create 1 data point per day (or use a different interval for longer periods)
  for (let i = 0; i <= dayDiff; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate slight variations in PIV for visual interest
    // In a real implementation, this would be actual match data
    const variation = Math.random() * 0.3 - 0.15; // -0.15 to +0.15 variation
    const pivValue = Math.max(0.5, Math.min(2.5, basePIV + variation));
    
    data.push({
      date: format(date, 'MMM dd'),
      piv: parseFloat(pivValue.toFixed(2)),
      // Add additional metrics that might be tracked over time
      kd: parseFloat((player.rawStats.kd + (Math.random() * 0.4 - 0.2)).toFixed(2)),
      rcs: parseFloat((player.metrics.rcs.value + (Math.random() * 0.2 - 0.1)).toFixed(2)),
    });
  }
  
  return data;
}

interface PlayerHistoryTabProps {
  player: PlayerWithPIV;
}

export default function PlayerHistoryTab({ player }: PlayerHistoryTabProps) {
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: oneMonthAgo,
    to: today,
  });
  
  const [pivOverTime, setPivOverTime] = useState(() => 
    generateHistoricalData(player, dateRange.from, dateRange.to)
  );
  
  const refreshData = () => {
    setPivOverTime(generateHistoricalData(player, dateRange.from, dateRange.to));
  };
  
  // Format the dates for display
  const formattedFrom = format(dateRange.from, 'PPP');
  const formattedTo = format(dateRange.to, 'PPP');
  
  // Calculate min and max PIV values for the charts
  const minPiv = Math.min(...pivOverTime.map(d => d.piv));
  const maxPiv = Math.max(...pivOverTime.map(d => d.piv));
  
  // Calculate average PIV for the selected period
  const averagePiv = pivOverTime.reduce((sum, d) => sum + d.piv, 0) / pivOverTime.length;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Performance History</h3>
          <p className="text-sm text-gray-400">
            View historical performance metrics for {player.name}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">From:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex justify-start items-center text-left font-normal w-[140px]"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {formattedFrom}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => date && setDateRange({ 
                    from: date, 
                    to: dateRange.to < date ? date : dateRange.to 
                  })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-400">To:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex justify-start items-center text-left font-normal w-[140px]"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {formattedTo}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => date && setDateRange({ 
                    from: dateRange.from > date ? date : dateRange.from, 
                    to: date 
                  })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <Button size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Update
          </Button>
        </div>
      </div>
      
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            PIV Rating Over Time
            <Badge variant="outline" className="ml-2 bg-blue-900/30 text-blue-300">
              {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={pivOverTime}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="date"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                />
                <YAxis 
                  domain={[Math.max(0, minPiv - 0.2), maxPiv + 0.2]}
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  tickLine={{ stroke: '#4B5563' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '0.375rem',
                    color: '#E5E7EB'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '0.5rem' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="piv" 
                  name="PIV Rating"
                  stroke="#3B82F6" 
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="kd" 
                  name="K/D Ratio" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rcs" 
                  name="Role Core Score" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-6 justify-center">
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Avg. PIV</div>
              <div className="text-xl font-semibold text-blue-400">
                {averagePiv.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Highest PIV</div>
              <div className="text-xl font-semibold text-green-400">
                {maxPiv.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Lowest PIV</div>
              <div className="text-xl font-semibold text-yellow-400">
                {minPiv.toFixed(2)}
              </div>
            </div>
            
            <div className="bg-gray-700/50 rounded-lg p-3">
              <div className="text-sm text-gray-400">Total Matches</div>
              <div className="text-xl font-semibold text-purple-400">
                {Math.max(1, Math.floor(pivOverTime.length / 3))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Performance Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Average K/D</span>
                  <span className="font-medium">
                    {(pivOverTime.reduce((sum, d) => sum + d.kd, 0) / pivOverTime.length).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${Math.min(100, (player.rawStats.kd / 2) * 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Average RCS</span>
                  <span className="font-medium">
                    {(pivOverTime.reduce((sum, d) => sum + d.rcs, 0) / pivOverTime.length).toFixed(2)}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500" 
                    style={{ width: `${Math.min(100, player.metrics.rcs.value * 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="p-3 bg-gray-700/30 rounded-lg mt-4">
                <h4 className="text-sm font-medium mb-2">Form Analysis</h4>
                <p className="text-xs text-gray-400">
                  {player.name}'s performance {
                    averagePiv > player.piv 
                      ? "has been improving over the selected period, showing higher than average PIV ratings."
                      : averagePiv < player.piv
                        ? "has been slightly declining over the selected period compared to overall average."
                        : "has been consistent with overall career average during this period."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg">Match History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {pivOverTime
                .filter((_, index) => index % 3 === 0) // Simulate matches every 3 days
                .map((data, index) => (
                  <div key={index} className="p-3 bg-gray-700/30 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-7 w-7 rounded-full bg-blue-900/40 flex items-center justify-center text-xs">
                          {player.team.substring(0, 2)}
                        </div>
                        <span className="ml-2 text-xs font-medium">vs. {
                          ['Astralis', 'NAVI', 'FaZe', 'G2', 'Cloud9', 'Heroic'][
                            Math.floor(Math.random() * 6)
                          ]
                        }</span>
                      </div>
                      <span className="text-xs text-gray-400">{data.date}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center">
                        <Badge 
                          variant="outline" 
                          className={
                            Math.random() > 0.5 
                              ? "bg-green-900/20 text-green-400 border-green-800" 
                              : "bg-red-900/20 text-red-400 border-red-800"
                          }
                        >
                          {Math.random() > 0.5 ? 'Win' : 'Loss'}
                        </Badge>
                        <span className="ml-2 text-xs">
                          {Math.floor(Math.random() * 16) + 5} - {Math.floor(Math.random() * 16) + 5}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-400 mr-1">PIV:</span>
                        <span className="text-xs font-medium">{data.piv}</span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}