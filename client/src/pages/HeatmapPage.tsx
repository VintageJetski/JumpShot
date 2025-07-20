import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleHeatmap } from '@/components/data-visualization/SimpleHeatmap';

interface XYZPlayerData {
  health: number;
  flash_duration: number;
  place?: string;
  armor: number;
  side: 't' | 'ct';
  pitch: number;
  X: number;
  yaw: number;
  Y: number;
  velocity_X: number;
  Z: number;
  velocity_Y: number;
  velocity_Z: number;
  tick: number;
  user_steamid: string;
  name: string;
  round_num: number;
}

export default function HeatmapPage() {
  const { data: xyzData = [] } = useQuery<XYZPlayerData[]>({
    queryKey: ['/api/xyz/raw'],
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="glassmorphism rounded-xl p-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Movement Heatmaps
            </h1>
            <p className="text-blue-200">
              Analyze player movement patterns and positioning frequency
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="glassmorphism border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Position Heatmap</CardTitle>
            <CardDescription className="text-blue-200">
              Areas of highest player activity shown in red
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleHeatmap 
              xyzData={xyzData} 
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}