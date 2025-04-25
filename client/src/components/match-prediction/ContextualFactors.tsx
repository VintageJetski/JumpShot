import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Zap, Trophy, Clock, BarChart3 } from 'lucide-react';

interface ContextualFactorsProps {
  factors: {
    recentForm: number;
    headToHead: number;
    mapVeto: number;
    tournamentTier: number;
    history: number;
    form: number;
    bmt: number;
    chemistry: number;
    momentum: number;
    mapMatchup: number;
    individuals: number;
  };
  onChangeFactors: (name: string, value: number) => void;
  advancedOptions: {
    enablePsychologyFactors: boolean;
    useTournamentContext: boolean;
    useRoleMatchups: boolean;
  };
  onChangeAdvancedOptions: (name: string, value: boolean) => void;
  team1Name?: string;
  team2Name?: string;
}

const ContextualFactors: React.FC<ContextualFactorsProps> = ({
  factors,
  onChangeFactors,
  advancedOptions,
  onChangeAdvancedOptions,
  team1Name = 'Team 1',
  team2Name = 'Team 2'
}) => {
  // Function to generate factor labels based on slider value
  const getFactorLabel = (value: number, name: string): string => {
    if (value < 35) return `Strong ${team2Name}`;
    if (value < 45) return `Slight ${team2Name}`;
    if (value > 65) return `Strong ${team1Name}`;
    if (value > 55) return `Slight ${team1Name}`;
    return 'Neutral';
  };
  
  // Function to get color based on slider value
  const getFactorColor = (value: number): string => {
    if (value < 35) return 'text-red-400';
    if (value < 45) return 'text-red-300';
    if (value > 65) return 'text-blue-400';
    if (value > 55) return 'text-blue-300';
    return 'text-gray-400';
  };

  return (
    <div>
      <div className="flex items-center mb-3">
        <Settings className="h-4 w-4 mr-2 text-gray-400" />
        <span className="text-sm font-medium">Contextual Factors</span>
      </div>
      
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2 text-indigo-400" />
            Team Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recent Form */}
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-sm">Recent Form</Label>
              <span className={`text-xs ${getFactorColor(factors.recentForm)}`}>
                {getFactorLabel(factors.recentForm, 'recentForm')}
              </span>
            </div>
            <Slider
              value={[factors.recentForm]} 
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => onChangeFactors('recentForm', values[0])}
            />
          </div>
          
          {/* Head to Head */}
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-sm">Head to Head</Label>
              <span className={`text-xs ${getFactorColor(factors.headToHead)}`}>
                {getFactorLabel(factors.headToHead, 'headToHead')}
              </span>
            </div>
            <Slider
              value={[factors.headToHead]} 
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => onChangeFactors('headToHead', values[0])}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700 mt-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400 flex items-center">
            <Trophy className="h-4 w-4 mr-2 text-amber-400" />
            Tournament Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map Veto Advantage */}
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-sm">Map Veto Advantage</Label>
              <span className={`text-xs ${getFactorColor(factors.mapVeto)}`}>
                {getFactorLabel(factors.mapVeto, 'mapVeto')}
              </span>
            </div>
            <Slider
              value={[factors.mapVeto]} 
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => onChangeFactors('mapVeto', values[0])}
            />
          </div>
          
          {/* Tournament Tier */}
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-sm">Tournament Significance</Label>
              <span className={`text-xs ${getFactorColor(factors.tournamentTier)}`}>
                {getFactorLabel(factors.tournamentTier, 'tournamentTier')}
              </span>
            </div>
            <Slider
              value={[factors.tournamentTier]} 
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => onChangeFactors('tournamentTier', values[0])}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gray-800 border-gray-700 mt-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-400 flex items-center">
            <Zap className="h-4 w-4 mr-2 text-purple-400" />
            Advanced Factors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Big Match Temperament */}
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-sm">Big Match Temperament</Label>
              <span className={`text-xs ${getFactorColor(factors.bmt)}`}>
                {getFactorLabel(factors.bmt, 'bmt')}
              </span>
            </div>
            <Slider
              value={[factors.bmt]} 
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => onChangeFactors('bmt', values[0])}
            />
          </div>
          
          {/* Team Chemistry */}
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-sm">Team Chemistry</Label>
              <span className={`text-xs ${getFactorColor(factors.chemistry)}`}>
                {getFactorLabel(factors.chemistry, 'chemistry')}
              </span>
            </div>
            <Slider
              value={[factors.chemistry]} 
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => onChangeFactors('chemistry', values[0])}
            />
          </div>
          
          {/* Current Momentum */}
          <div>
            <div className="flex justify-between mb-1">
              <Label className="text-sm">Current Momentum</Label>
              <span className={`text-xs ${getFactorColor(factors.momentum)}`}>
                {getFactorLabel(factors.momentum, 'momentum')}
              </span>
            </div>
            <Slider
              value={[factors.momentum]} 
              min={0}
              max={100}
              step={5}
              onValueChange={(values) => onChangeFactors('momentum', values[0])}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Advanced Options */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm" htmlFor="psych-factors">
            Enable Psychology Factors
          </Label>
          <Switch
            id="psych-factors"
            checked={advancedOptions.enablePsychologyFactors}
            onCheckedChange={(checked) => 
              onChangeAdvancedOptions('enablePsychologyFactors', checked)
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-sm" htmlFor="tournament-context">
            Use Tournament Context
          </Label>
          <Switch
            id="tournament-context" 
            checked={advancedOptions.useTournamentContext}
            onCheckedChange={(checked) => 
              onChangeAdvancedOptions('useTournamentContext', checked)
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-sm" htmlFor="role-matchups">
            Consider Role Matchups
          </Label>
          <Switch
            id="role-matchups"
            checked={advancedOptions.useRoleMatchups}
            onCheckedChange={(checked) => 
              onChangeAdvancedOptions('useRoleMatchups', checked)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ContextualFactors;