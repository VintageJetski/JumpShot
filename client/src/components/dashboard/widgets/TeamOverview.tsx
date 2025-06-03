import { TeamWithTIR } from '@shared/schema';

interface TeamOverviewProps {
  team: TeamWithTIR;
}

export default function TeamOverview({ team }: TeamOverviewProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Team Overview</h3>
      <p className="text-xs text-gray-400">
        This widget will display a comprehensive overview of {team.name}.
      </p>
    </div>
  );
}