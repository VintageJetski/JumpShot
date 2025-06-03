import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { InfoIcon, TrendingUp, Activity, Users, Shield } from 'lucide-react';
import { PlayerWithPIV, TeamWithTIR } from '../../../shared/schema';

export interface ConfidenceRating {
  teamA: TeamConfidenceRating;
  teamB: TeamConfidenceRating;
}

export interface TeamConfidenceRating {
  medianWinProbability: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  confidenceFactors: {
    historicalConsistency: number;
    recentForm: number;
    matchupSpecificity: number;
    playerStability: number;
  };
  overallConfidence: number;
}

interface ConfidenceRatingSystemProps {
  teamA: TeamWithTIR;
  teamB: TeamWithTIR;
  playersA?: PlayerWithPIV[];
  playersB?: PlayerWithPIV[]; 
}

export default function ConfidenceRatingSystem({ 
  teamA, 
  teamB, 
  playersA = [],
  playersB = [] 
}: ConfidenceRatingSystemProps) {
  // Calculate confidence ratings based on team and player data
  const [activeTab, setActiveTab] = useState<'interval' | 'factors'>('interval');
  
  // Calculate our confidence rating using the available data
  const confidenceRating = calculateConfidenceRating(teamA, teamB, playersA, playersB);
  
  return (
    <Card className="w-full border-blue-900/30 glassmorphism overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Match Confidence Rating
          </CardTitle>
          <div className="flex gap-2">
            <button 
              className={`px-3 py-1 text-sm rounded-full ${activeTab === 'interval' ? 'bg-blue-900/40 text-blue-200' : 'bg-transparent text-gray-400'}`}
              onClick={() => setActiveTab('interval')}
            >
              Win Probability
            </button>
            <button 
              className={`px-3 py-1 text-sm rounded-full ${activeTab === 'factors' ? 'bg-blue-900/40 text-blue-200' : 'bg-transparent text-gray-400'}`}
              onClick={() => setActiveTab('factors')}
            >
              Confidence Factors
            </button>
          </div>
        </div>
        <CardDescription>
          {activeTab === 'interval' 
            ? 'Probabilistic outcome with confidence intervals' 
            : 'Factors affecting prediction reliability'}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'interval' ? (
          <WinProbabilityView 
            teamA={teamA}
            teamB={teamB}
            confidenceRating={confidenceRating}
          />
        ) : (
          <ConfidenceFactorsView 
            teamA={teamA}
            teamB={teamB}
            confidenceRating={confidenceRating}
          />
        )}
      </CardContent>
    </Card>
  );
}

function WinProbabilityView({ 
  teamA, 
  teamB, 
  confidenceRating 
}: { 
  teamA: TeamWithTIR, 
  teamB: TeamWithTIR,
  confidenceRating: ConfidenceRating
}) {
  const { teamA: ratingA, teamB: ratingB } = confidenceRating;
  
  // Calculate for visualization
  const medianA = ratingA.medianWinProbability * 100;
  const lowerA = ratingA.confidenceInterval.lower * 100;
  const upperA = ratingA.confidenceInterval.upper * 100;
  
  const medianB = ratingB.medianWinProbability * 100;
  const lowerB = ratingB.confidenceInterval.lower * 100;
  const upperB = ratingB.confidenceInterval.upper * 100;
  
  // Determine ranges for visualization
  const confSpreadA = upperA - lowerA;
  const confSpreadB = upperB - lowerB;
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center text-center mb-6">
        <p className="text-sm text-blue-200">
          Displayed as ranges to reflect inherent uncertainty in predictions
        </p>
      </div>
      
      {/* Team A Probability */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-900/30 rounded-full flex items-center justify-center text-sm">
              {teamA.name.substring(0, 2)}
            </div>
            <span className="font-medium">{teamA.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceIndicator confidence={ratingA.overallConfidence} />
            <span className="font-bold">
              {Math.round(lowerA)}% - {Math.round(upperA)}%
            </span>
          </div>
        </div>
        
        <div className="relative h-10 w-full bg-gray-800 rounded-md overflow-hidden">
          <motion.div 
            className="absolute h-full bg-gradient-to-r from-blue-900/20 to-blue-900/60 rounded-l-md"
            style={{ left: `${lowerA}%`, width: `${confSpreadA}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${confSpreadA}%` }}
            transition={{ duration: 1 }}
          />
          <motion.div
            className="absolute h-full w-1 bg-blue-400"
            style={{ left: `${medianA}%` }}
            initial={{ left: "0%" }}
            animate={{ left: `${medianA}%` }}
            transition={{ duration: 1 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-blue-100">
              {Math.round(medianA)}% median
            </span>
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-400">
          <span>Pessimistic</span>
          <span>Median</span>
          <span>Optimistic</span>
        </div>
      </div>
      
      {/* Team B Probability */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-900/30 rounded-full flex items-center justify-center text-sm">
              {teamB.name.substring(0, 2)}
            </div>
            <span className="font-medium">{teamB.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceIndicator confidence={ratingB.overallConfidence} />
            <span className="font-bold">
              {Math.round(lowerB)}% - {Math.round(upperB)}%
            </span>
          </div>
        </div>
        
        <div className="relative h-10 w-full bg-gray-800 rounded-md overflow-hidden">
          <motion.div 
            className="absolute h-full bg-gradient-to-r from-purple-900/20 to-purple-900/60 rounded-l-md"
            style={{ left: `${lowerB}%`, width: `${confSpreadB}%` }}
            initial={{ width: 0 }}
            animate={{ width: `${confSpreadB}%` }}
            transition={{ duration: 1 }}
          />
          <motion.div
            className="absolute h-full w-1 bg-purple-400"
            style={{ left: `${medianB}%` }}
            initial={{ left: "0%" }}
            animate={{ left: `${medianB}%` }}
            transition={{ duration: 1 }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-purple-100">
              {Math.round(medianB)}% median
            </span>
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-400">
          <span>Pessimistic</span>
          <span>Median</span>
          <span>Optimistic</span>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <InfoIcon className="h-4 w-4 text-blue-300" />
            <span className="text-sm text-gray-300">
              Prediction Confidence
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-300">
              {getConfidenceLabel(ratingA.overallConfidence)}
            </span>
            <span className="text-xs">vs</span>
            <span className="text-sm font-medium text-purple-300">
              {getConfidenceLabel(ratingB.overallConfidence)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceFactorsView({ 
  teamA,
  teamB,
  confidenceRating 
}: { 
  teamA: TeamWithTIR, 
  teamB: TeamWithTIR, 
  confidenceRating: ConfidenceRating 
}) {
  const { teamA: ratingA, teamB: ratingB } = confidenceRating;
  
  // Define factors with icons and descriptions
  const confidenceFactors = [
    {
      id: 'historicalConsistency',
      name: 'Historical Consistency',
      description: 'How reliably teams perform according to their averages',
      icon: Shield,
      valueA: ratingA.confidenceFactors.historicalConsistency * 100,
      valueB: ratingB.confidenceFactors.historicalConsistency * 100,
    },
    {
      id: 'recentForm',
      name: 'Recent Form',
      description: 'Performance trajectory in recent matches',
      icon: TrendingUp,
      valueA: ratingA.confidenceFactors.recentForm * 100,
      valueB: ratingB.confidenceFactors.recentForm * 100,
    },
    {
      id: 'matchupSpecificity',
      name: 'Matchup History',
      description: 'Quality of head-to-head historical data',
      icon: Activity,
      valueA: ratingA.confidenceFactors.matchupSpecificity * 100,
      valueB: ratingB.confidenceFactors.matchupSpecificity * 100,
    },
    {
      id: 'playerStability',
      name: 'Roster Stability',
      description: 'Consistency in player performance',
      icon: Users,
      valueA: ratingA.confidenceFactors.playerStability * 100,
      valueB: ratingB.confidenceFactors.playerStability * 100,
    }
  ];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="text-center">
          <div className="h-8 w-8 bg-blue-900/30 rounded-full flex items-center justify-center text-sm mx-auto">
            {teamA.name.substring(0, 2)}
          </div>
          <div className="text-sm font-medium mt-1">{teamA.name}</div>
        </div>
        <div className="text-center">
          <div className="h-8 w-8 bg-blue-900/30 rounded-full flex items-center justify-center text-sm mx-auto">
            {teamB.name.substring(0, 2)}
          </div>
          <div className="text-sm font-medium mt-1">{teamB.name}</div>
        </div>
      </div>
      
      {confidenceFactors.map(factor => (
        <div key={factor.id} className="space-y-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <factor.icon className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium">{factor.name}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-xs">{factor.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{getConfidenceLabel(factor.valueA/100)}</span>
                <span className="font-medium">{Math.round(factor.valueA)}%</span>
              </div>
              <Progress 
                value={factor.valueA} 
                className={`h-2 ${getConfidenceColorClass(factor.valueA/100)}`} 
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{getConfidenceLabel(factor.valueB/100)}</span>
                <span className="font-medium">{Math.round(factor.valueB)}%</span>
              </div>
              <Progress 
                value={factor.valueB} 
                className={`h-2 ${getConfidenceColorClass(factor.valueB/100)}`} 
              />
            </div>
          </div>
        </div>
      ))}
      
      <div className="pt-4 border-t border-gray-800 mt-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Overall Prediction Confidence</span>
          <div className="flex items-center gap-2">
            <ConfidenceIndicator confidence={ratingA.overallConfidence} />
            <span className="text-sm">vs</span>
            <ConfidenceIndicator confidence={ratingB.overallConfidence} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for confidence indicator
function ConfidenceIndicator({ confidence }: { confidence: number }) {
  return (
    <div className={`px-2 py-0.5 rounded-full text-xs ${getConfidenceColorClass(confidence)}`}>
      {getConfidenceLabel(confidence)}
    </div>
  );
}

// Helper functions
function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'Very High';
  if (confidence >= 0.6) return 'High';
  if (confidence >= 0.4) return 'Moderate';
  if (confidence >= 0.2) return 'Low';
  return 'Very Low';
}

function getConfidenceColorClass(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-900/30 text-green-300';
  if (confidence >= 0.6) return 'bg-blue-900/30 text-blue-300';
  if (confidence >= 0.4) return 'bg-yellow-900/30 text-yellow-300';
  if (confidence >= 0.2) return 'bg-orange-900/30 text-orange-300';
  return 'bg-red-900/30 text-red-300';
}

// Calculate confidence ratings based on team data
function calculateConfidenceRating(
  teamA: TeamWithTIR,
  teamB: TeamWithTIR,
  playersA: PlayerWithPIV[] = [],
  playersB: PlayerWithPIV[] = []
): ConfidenceRating {
  // TIR is Team Impact Rating, use that as base win probability
  let medianProbA = teamA.tir > 0 && teamB.tir > 0 
    ? teamA.tir / (teamA.tir + teamB.tir)
    : 0.5;
    
  // Ensure it's in 0-1 range
  medianProbA = Math.max(0.1, Math.min(0.9, medianProbA));
  
  // Calculate historical consistency based on available metrics
  // For this example, we'll use a simplified calculation, but in real implementation
  // you would use variance in team performances, standard deviation, etc.
  const historicalConsistencyA = 0.5 + (Math.random() * 0.4); // Placeholder
  const historicalConsistencyB = 0.5 + (Math.random() * 0.4); // Placeholder
  
  // Recent form - this would be based on trend analysis of recent matches
  const recentFormA = 0.4 + (Math.random() * 0.5); // Placeholder
  const recentFormB = 0.4 + (Math.random() * 0.5); // Placeholder
  
  // Matchup specificity - how many times have these teams played each other?
  // Would be based on historical match counts
  const matchupSpecificityA = 0.3 + (Math.random() * 0.6); // Placeholder
  const matchupSpecificityB = 0.3 + (Math.random() * 0.6); // Placeholder
  
  // Player stability - based on consistency metrics of individual players
  const playerStabilityA = calculatePlayerStability(playersA);
  const playerStabilityB = calculatePlayerStability(playersB);
  
  // Calculate overall confidence as weighted average of factors
  const overallConfidenceA = (
    historicalConsistencyA * 0.4 + 
    recentFormA * 0.3 + 
    matchupSpecificityA * 0.15 + 
    playerStabilityA * 0.15
  );
  
  const overallConfidenceB = (
    historicalConsistencyB * 0.4 + 
    recentFormB * 0.3 + 
    matchupSpecificityB * 0.15 + 
    playerStabilityB * 0.15
  );
  
  // Confidence interval width should be inverse to our confidence
  // Lower confidence = wider interval
  const intervalWidthA = 0.4 * (1 - overallConfidenceA);
  const intervalWidthB = 0.4 * (1 - overallConfidenceB);
  
  // Calculate confidence intervals
  const lowerA = Math.max(0.05, medianProbA - intervalWidthA / 2);
  const upperA = Math.min(0.95, medianProbA + intervalWidthA / 2);
  
  // For team B, we derive from team A's probability
  const medianProbB = 1 - medianProbA;
  const lowerB = Math.max(0.05, medianProbB - intervalWidthB / 2);
  const upperB = Math.min(0.95, medianProbB + intervalWidthB / 2);
  
  return {
    teamA: {
      medianWinProbability: medianProbA,
      confidenceInterval: {
        lower: lowerA,
        upper: upperA
      },
      confidenceFactors: {
        historicalConsistency: historicalConsistencyA,
        recentForm: recentFormA,
        matchupSpecificity: matchupSpecificityA,
        playerStability: playerStabilityA
      },
      overallConfidence: overallConfidenceA
    },
    teamB: {
      medianWinProbability: medianProbB,
      confidenceInterval: {
        lower: lowerB,
        upper: upperB
      },
      confidenceFactors: {
        historicalConsistency: historicalConsistencyB,
        recentForm: recentFormB,
        matchupSpecificity: matchupSpecificityB,
        playerStability: playerStabilityB
      },
      overallConfidence: overallConfidenceB
    }
  };
}

// Calculate player stability based on consistency metrics in PIV
function calculatePlayerStability(players: PlayerWithPIV[]): number {
  if (players.length === 0) return 0.5;
  
  // Use ICF (Individual Consistency Factor) from players to determine stability
  const avgConsistency = players.reduce((sum, player) => {
    return sum + (player.metrics?.icf?.value || 0); 
  }, 0) / players.length;
  
  // Scale to 0-1 range and ensure it's in bounds
  return Math.max(0.1, Math.min(0.9, avgConsistency * 1.2));
}