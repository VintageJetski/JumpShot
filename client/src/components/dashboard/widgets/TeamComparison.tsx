import { TeamWithTIR } from '@shared/schema';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TeamComparisonProps {
  team1: TeamWithTIR;
  team2: TeamWithTIR;
}

export default function TeamComparison({ team1, team2 }: TeamComparisonProps) {
  // For the stub implementation, we'll use placeholder data
  // but in the full implementation we would use the actual metrics
  const metrics = {
    firepower: {
      name: 'Firepower',
      team1: 75,
      team2: 72,
    },
    coordination: {
      name: 'Coordination',
      team1: 82,
      team2: 78,
    },
    consistency: {
      name: 'Consistency',
      team1: 68,
      team2: 84,
    },
    utility: {
      name: 'Utility',
      team1: 79,
      team2: 65,
    },
    strategicDepth: {
      name: 'Strategic Depth',
      team1: 81,
      team2: 69,
    },
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium">{team1.name}</h3>
          <h3 className="text-sm font-medium">{team2.name}</h3>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-3">
          {Object.values(metrics).map((metric) => (
            <div key={metric.name}>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span>{metric.name}</span>
                <div className="flex space-x-2">
                  <span className="font-medium">{metric.team1}</span>
                  <span className="text-gray-500">vs</span>
                  <span className="font-medium">{metric.team2}</span>
                </div>
              </div>
              <div className="flex h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${metric.team1}%` }}
                />
                <div 
                  className="bg-red-500" 
                  style={{ width: `${metric.team2}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-800">
          <div className="flex justify-between text-xs">
            <div>
              <div className="font-semibold">{team1.tir.toFixed(2)}</div>
              <div className="text-gray-400">Team Impact Rating</div>
            </div>
            <div className="text-right">
              <div className="font-semibold">{team2.tir.toFixed(2)}</div>
              <div className="text-gray-400">Team Impact Rating</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}