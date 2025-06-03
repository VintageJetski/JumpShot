import { TeamWithTIR } from '../../../../shared/schema';

interface MatchPredictionProps {
  team1: TeamWithTIR;
  team2: TeamWithTIR;
}

export default function MatchPrediction({ team1, team2 }: MatchPredictionProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Match Prediction</h3>
      <p className="text-xs text-gray-400">
        This widget will display match predictions between {team1.name} and {team2.name}.
      </p>
    </div>
  );
}