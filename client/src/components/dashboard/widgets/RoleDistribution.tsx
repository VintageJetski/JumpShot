import { TeamWithTIR } from '../../../../shared/schema';

interface RoleDistributionProps {
  team: TeamWithTIR;
}

export default function RoleDistribution({ team }: RoleDistributionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Role Distribution</h3>
      <p className="text-xs text-gray-400">
        This widget will display the role distribution for {team.name}.
      </p>
    </div>
  );
}