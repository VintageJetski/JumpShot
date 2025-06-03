import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Search } from "lucide-react";

export function ScoutDocumentation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Scout System
        </CardTitle>
        <CardDescription>
          Advanced player scouting and team fit analysis for roster building
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold">Feature Overview</h3>
        <p>
          The Scout feature is an advanced analytical tool for team managers and coaches to identify and evaluate players that would best fit their team's needs, based on:
        </p>
        
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Role-specific performance metrics and compatibility</li>
          <li>Team synergy potential with existing roster</li>
          <li>Map pool comfort and overlap</li>
          <li>Risk assessment and consistency evaluation</li>
          <li>Detailed statistical fit visualization</li>
        </ul>
        
        <div className="bg-black/20 p-4 rounded-md mt-4">
          <h4 className="font-medium text-primary mb-2">Multi-Layered Analysis</h4>
          <p className="text-sm">
            Scout combines four key analytical layers to evaluate potential player acquisitions:
          </p>
          <ul className="list-disc pl-6 space-y-1 text-sm mt-2">
            <li><strong>Performance Layer:</strong> Raw statistical performance</li>
            <li><strong>Role Layer:</strong> Role-specific effectiveness and specialization</li>
            <li><strong>Team-fit Layer:</strong> Synergy with existing team members</li>
            <li><strong>Risk Layer:</strong> Assessment of consistency and sample size</li>
          </ul>
        </div>
        
        <h3 className="text-lg font-semibold mt-8">Scout Methodology</h3>
        
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="border border-gray-700 rounded-md p-4">
            <h4 className="font-medium text-primary mb-2">1. Performance Layer (30%)</h4>
            <p className="text-sm">Evaluates raw statistical performance using PIV ratings, K/D ratios, and overall impact metrics. This provides the foundation of player evaluation but is balanced with other factors for a complete picture.</p>
          </div>
          
          <div className="border border-gray-700 rounded-md p-4">
            <h4 className="font-medium text-primary mb-2">2. Role Layer (35%)</h4>
            <p className="text-sm">Analyzes role-specific metrics to determine how effectively a player executes their primary and secondary roles. Each role has specialized metrics that are weighted according to importance.</p>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="border border-gray-700 rounded-md p-4">
            <h4 className="font-medium text-primary mb-2">3. Team-fit Layer (25%)</h4>
            <p className="text-sm">Calculates potential synergy with existing team members based on role complementarity, map pool overlap, chemistry indicators, and momentum trends. This layer is crucial for building cohesive rosters.</p>
          </div>
          
          <div className="border border-gray-700 rounded-md p-4">
            <h4 className="font-medium text-primary mb-2">4. Risk Layer (10%)</h4>
            <p className="text-sm">Assesses consistency, sample size reliability, and risk factors that could impact performance. Low-sample risk (60%) evaluates data completeness, while tilt proxy (40%) estimates emotional stability.</p>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mt-8">Role-Specific Evaluation Metrics</h3>
        
        <div className="space-y-4 mt-2">
          <div className="border border-gray-700 rounded-md p-3">
            <h4 className="font-medium text-primary mb-2">AWPer Metrics</h4>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>• Opening Pick Success Rate (24.5%)</li>
              <li>• Multi Kill Conversion (17.5%)</li>
              <li>• AWPer Flash Assistance (17.5%)</li>
              <li>• Utility Punish Rate (15.0%)</li>
              <li>• Site Lockdown Rate (15.0%)</li>
              <li>• Consistency (10.5%)</li>
            </ul>
          </div>
          
          <div className="border border-gray-700 rounded-md p-3">
            <h4 className="font-medium text-primary mb-2">Spacetaker Metrics</h4>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>• Entry Success Rate (24.5%)</li>
              <li>• First Contact Win Rate (17.5%)</li>
              <li>• Space Creation Value (17.5%)</li>
              <li>• Trade Rate When Dying (15.0%)</li>
              <li>• T-side Impact (15.0%)</li>
              <li>• Map Control Score (10.5%)</li>
            </ul>
          </div>
          
          <div className="border border-gray-700 rounded-md p-3">
            <h4 className="font-medium text-primary mb-2">Support Metrics</h4>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>• Flash Assists per Round (24.5%)</li>
              <li>• Utility Damage Efficiency (17.5%)</li>
              <li>• Trade Assist Rate (17.5%)</li>
              <li>• Survival Rate (15.0%)</li>
              <li>• Pistol Round Influence (10.5%)</li>
              <li>• Smoke Usage Efficiency (15.0%)</li>
            </ul>
          </div>
          
          <div className="border border-gray-700 rounded-md p-3">
            <h4 className="font-medium text-primary mb-2">Lurker/Anchor Metrics</h4>
            <ul className="grid grid-cols-2 gap-2 text-sm">
              <li>• Site Hold Success Rate (24.5%)</li>
              <li>• Multi-kills on CT side (17.5%)</li>
              <li>• CT ADR (17.5%)</li>
              <li>• CT KAST (15.0%)</li>
              <li>• CT Utility Efficiency (15.0%)</li>
              <li>• Consistency (10.5%)</li>
            </ul>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mt-8">Map Pool Comfort</h3>
        <p className="mb-4">
          The Scout system evaluates map-specific performance across the current competitive map pool, visualizing player comfort levels with color-coding:
        </p>
        
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-500 mr-2"></div>
            <span className="text-sm">High Comfort (80-100)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-sm">Moderate Comfort (60-79)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-orange-500 mr-2"></div>
            <span className="text-sm">Limited Comfort (40-59)</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-red-500 mr-2"></div>
            <span className="text-sm">Low Comfort (0-39)</span>
          </div>
        </div>
        
        <div className="bg-primary/10 p-4 rounded-md mt-6">
          <h4 className="font-medium text-primary mb-2">Team Synergy Calculation</h4>
          <p className="text-sm">The synergy score is calculated as:</p>
          <div className="bg-black/20 p-3 rounded-md mt-2 font-mono text-xs">
            Synergy = (Role Similarity * 45%) + (Map Pool Overlap * 30%) + (Chemistry Proxy * 15%) + (Momentum Delta * 10%)
          </div>
          <p className="text-sm mt-2">This provides a comprehensive assessment of how well a player would integrate with the existing team structure and playstyle.</p>
        </div>
      </CardContent>
      <CardFooter className="text-sm text-gray-400">
        Last updated: April 28, 2024
      </CardFooter>
    </Card>
  );
}