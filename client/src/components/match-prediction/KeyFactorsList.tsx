import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface KeyFactorsListProps {
  factors: {
    name: string;
    team1Value: number;
    team2Value: number;
    advantage: number; // 1 = team1, 2 = team2, 0 = neutral
  }[];
  team1Name?: string;
  team2Name?: string;
  excludeMapFactors?: boolean;
}

// Group factors by category
const FACTOR_CATEGORIES = {
  'ECONOMY': ['Economy', 'Force Buy', 'Eco Round', 'Efficiency'],
  'MAP': ['CT Win Rate', 'T Win Rate', 'Site'],
  'STRATEGY': ['Post-Plant', 'Retake', 'Bombsite', 'Preference'],
  'MOMENTUM': ['Pistol', 'Comeback', 'Advantage']
};

const getFactorCategory = (factorName: string): string => {
  for (const [category, keywords] of Object.entries(FACTOR_CATEGORIES)) {
    if (keywords.some(keyword => factorName.includes(keyword))) {
      return category;
    }
  }
  return 'OTHER';
};

const KeyFactorsList: React.FC<KeyFactorsListProps> = ({
  factors,
  team1Name = 'Team 1',
  team2Name = 'Team 2',
  excludeMapFactors = false
}) => {
  // Filter out map-specific factors if requested
  const displayFactors = excludeMapFactors 
    ? factors.filter(factor => !factor.name.includes('CT Win Rate') && !factor.name.includes('T Win Rate'))
    : factors;
  
  // Group factors by category
  const categorizedFactors = displayFactors.reduce((acc, factor) => {
    const category = getFactorCategory(factor.name);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(factor);
    return acc;
  }, {} as Record<string, typeof factors>);
  
  // Get category colors
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'ECONOMY': return 'text-green-400';
      case 'MAP': return 'text-blue-400';
      case 'STRATEGY': return 'text-purple-400';
      case 'MOMENTUM': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-400 flex items-center">
          <BarChart3 className="h-4 w-4 mr-2 text-primary" />
          Key Round Factors
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-4">
          {Object.entries(categorizedFactors).map(([category, categoryFactors]) => (
            <div key={category} className="space-y-2">
              <h3 className={`text-xs font-medium ${getCategoryColor(category)}`}>
                {category}
              </h3>
              
              {categoryFactors.map((factor, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-gray-200">{factor.name}</span>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={factor.advantage === 1 ? 'text-blue-400 font-medium' : ''}>
                        {Math.round(factor.team1Value)}%
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span className={factor.advantage === 2 ? 'text-red-400 font-medium' : ''}>
                        {Math.round(factor.team2Value)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden flex">
                    <div 
                      className="bg-blue-500 h-2" 
                      style={{ width: `${factor.team1Value / (factor.team1Value + factor.team2Value) * 100}%` }}
                    />
                    <div 
                      className="bg-red-500 h-2" 
                      style={{ width: `${factor.team2Value / (factor.team1Value + factor.team2Value) * 100}%` }}
                    />
                  </div>
                  
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>{team1Name}</span>
                    <span>{team2Name}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          {displayFactors.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              No round data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyFactorsList;