import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { PlayerWithPIV } from '../../../shared/schema';

interface RoleBreakdownChartProps {
  players: PlayerWithPIV[];
}

const ROLE_COLORS = {
  'AWPer': '#ff6b6b',
  'Entry Fragger': '#4ecdc4',
  'Support': '#45b7d1',
  'Lurker': '#96ceb4',
  'IGL': '#ffeaa7'
};

export default function RoleBreakdownChart({ players }: RoleBreakdownChartProps) {
  // Calculate role distribution
  const roleDistribution = players.reduce((acc, player) => {
    const role = player.role || 'Support';
    if (!acc[role]) {
      acc[role] = { count: 0, totalPIV: 0, totalKD: 0 };
    }
    acc[role].count += 1;
    acc[role].totalPIV += player.piv;
    acc[role].totalKD += player.kd;
    return acc;
  }, {} as Record<string, { count: number; totalPIV: number; totalKD: number }>);

  // Prepare pie chart data
  const pieData = Object.entries(roleDistribution).map(([role, data]) => ({
    name: role,
    value: data.count,
    percentage: (data.count / players.length * 100).toFixed(1)
  }));

  // Prepare performance by role data
  const performanceData = Object.entries(roleDistribution).map(([role, data]) => ({
    role,
    avgPIV: (data.totalPIV / data.count).toFixed(2),
    avgKD: (data.totalKD / data.count).toFixed(2),
    count: data.count
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.name || data.role}</p>
          <p className="text-sm">Players: {data.value || data.count}</p>
          {data.percentage && <p className="text-sm">Percentage: {data.percentage}%</p>}
          {data.avgPIV && <p className="text-sm">Avg PIV: {data.avgPIV}</p>}
          {data.avgKD && <p className="text-sm">Avg K/D: {data.avgKD}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Distribution & Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="distribution">Role Distribution</TabsTrigger>
            <TabsTrigger value="performance">Performance by Role</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={ROLE_COLORS[entry.name as keyof typeof ROLE_COLORS] || '#8884d8'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="performance" className="mt-4">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="role" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="avgPIV" fill="#8884d8" name="Avg PIV" />
                  <Bar dataKey="avgKD" fill="#82ca9d" name="Avg K/D" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}