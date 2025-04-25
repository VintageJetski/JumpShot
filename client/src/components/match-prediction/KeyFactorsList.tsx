import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon, ArrowLeftIcon, MinusIcon } from 'lucide-react';

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

export const KeyFactorsList: React.FC<KeyFactorsListProps> = ({
  factors,
  team1Name = "Team 1",
  team2Name = "Team 2",
  excludeMapFactors = true
}) => {
  // If we need to exclude map-specific factors, filter them out
  const displayFactors = excludeMapFactors
    ? factors.filter(factor => !factor.name.includes('Inferno') && 
                              !factor.name.includes('Mirage') && 
                              !factor.name.includes('Nuke') && 
                              !factor.name.includes('Dust') && 
                              !factor.name.includes('Vertigo') && 
                              !factor.name.includes('Ancient') && 
                              !factor.name.includes('Anubis'))
    : factors;
  
  if (displayFactors.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No key factors available</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Factor</TableHead>
          <TableHead className="text-right w-[20%]">{team1Name}</TableHead>
          <TableHead className="text-center w-[20%]">Advantage</TableHead>
          <TableHead className="text-right w-[20%]">{team2Name}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayFactors.map((factor, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{factor.name}</TableCell>
            <TableCell className="text-right">
              {factor.team1Value.toFixed(0)}%
            </TableCell>
            <TableCell className="text-center">
              {factor.advantage === 1 ? (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                  <ArrowLeftIcon className="h-3 w-3 mr-1" />
                  Team 1
                </Badge>
              ) : factor.advantage === 2 ? (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                  Team 2
                  <ArrowRightIcon className="h-3 w-3 ml-1" />
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">
                  <MinusIcon className="h-3 w-3 mr-1" />
                  Even
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              {factor.team2Value.toFixed(0)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default KeyFactorsList;