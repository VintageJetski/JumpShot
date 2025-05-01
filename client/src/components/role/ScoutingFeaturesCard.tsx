import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SynergyMetric {
  name: string;
  weight: number;
  description: string;
}

interface SynergyMetricsInfo {
  title: string;
  description: string;
  metrics: SynergyMetric[];
  formula: string;
}

interface ScoutingFeaturesCardProps {
  lineupSynergy: SynergyMetricsInfo;
  playerRecommendation: SynergyMetricsInfo;
}

export function ScoutingFeaturesCard({ lineupSynergy, playerRecommendation }: ScoutingFeaturesCardProps) {
  return (
    <Card className="bg-background-light rounded-lg border border-gray-700">
      <CardHeader>
        <CardTitle>
          Scouting Features & Synergy Calculations
        </CardTitle>
        <CardDescription>
          Advanced metrics for lineup synergy and team building
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Lineup Synergy Matrix */}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{lineupSynergy.title}</h3>
            <p className="text-sm text-gray-400 mb-2">{lineupSynergy.description}</p>
            
            <div className="space-y-2">
              {lineupSynergy.metrics.map((metric, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{metric.name}</div>
                    <div className="text-xs text-gray-400">{metric.description}</div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-semibold">{metric.weight}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-gray-800 p-3 rounded-md">
              <div className="text-xs font-mono">{lineupSynergy.formula}</div>
            </div>
          </div>
          
          {/* Player Replacement Scout */}
          <div className="space-y-2 pt-4 border-t border-gray-700">
            <h3 className="font-semibold text-lg">{playerRecommendation.title}</h3>
            <p className="text-sm text-gray-400 mb-2">{playerRecommendation.description}</p>
            
            <div className="space-y-2">
              {playerRecommendation.metrics.map((metric, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{metric.name}</div>
                    <div className="text-xs text-gray-400">{metric.description}</div>
                  </div>
                  <div className="w-20 text-right">
                    <span className="text-sm font-semibold">{metric.weight}%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-gray-800 p-3 rounded-md">
              <div className="text-xs font-mono">{playerRecommendation.formula}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
