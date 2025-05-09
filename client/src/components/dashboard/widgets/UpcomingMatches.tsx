interface UpcomingMatchesProps {
  limit?: number;
}

export default function UpcomingMatches({ limit = 3 }: UpcomingMatchesProps) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Upcoming Matches</h3>
      <p className="text-xs text-gray-400">
        This widget will display upcoming matches (limit: {limit}).
      </p>
    </div>
  );
}