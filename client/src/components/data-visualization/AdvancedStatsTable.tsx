import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowUpDown, 
  Download, 
  Filter, 
  Info, 
  PlusCircle,
  Search,
  X
} from "lucide-react";
import { PlayerWithPIV, PlayerRole } from '@shared/types';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import RoleBadge from '@/components/ui/role-badge';

interface AdvancedStatsTableProps {
  players: PlayerWithPIV[];
  statFilter: 'all' | 'offense' | 'defense' | 'utility';
}

// Define advanced metric types and their descriptions
interface AdvancedMetric {
  key: string;
  label: string;
  description: string;
  category: 'offense' | 'defense' | 'utility' | 'overall';
  valueFunction: (player: PlayerWithPIV) => number | string;
  formatter?: (value: number) => string;
}

// Function to get value from player.rawStats with fallbacks
const getRawStat = (player: PlayerWithPIV, key: string, defaultValue: number = 0): number => {
  return player.rawStats ? (player.rawStats[key as keyof typeof player.rawStats] as number || defaultValue) : defaultValue;
};

// Function to format percentages
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

// Function to format ratios to 2 decimal places
const formatRatio = (value: number): string => {
  return value.toFixed(2);
};

// Advanced metrics definitions
const advancedMetrics: AdvancedMetric[] = [
  // Overall metrics
  {
    key: 'piv',
    label: 'PIV',
    description: 'Player Impact Value - Overall performance metric that combines RCS, ICF, SC and OSM',
    category: 'overall',
    valueFunction: (player) => player.piv,
    formatter: formatRatio,
  },
  {
    key: 'tPIV',
    label: 'T-Side PIV',
    description: 'PIV specifically for T-side performance',
    category: 'overall',
    valueFunction: (player) => player.tPIV,
    formatter: formatRatio,
  },
  {
    key: 'ctPIV',
    label: 'CT-Side PIV',
    description: 'PIV specifically for CT-side performance',
    category: 'overall',
    valueFunction: (player) => player.ctPIV,
    formatter: formatRatio,
  },
  {
    key: 'kd',
    label: 'K/D',
    description: 'Kill-to-Death Ratio',
    category: 'overall',
    valueFunction: (player) => player.kd,
    formatter: formatRatio,
  },
  
  // Offensive metrics
  {
    key: 'entrySuccessRate',
    label: 'Entry Success Rate',
    description: 'Success rate of opening duels (First Kills / First Deaths)',
    category: 'offense',
    valueFunction: (player) => {
      const firstKills = getRawStat(player, 'firstKills');
      const firstDeaths = getRawStat(player, 'firstDeaths');
      return firstDeaths > 0 ? firstKills / firstDeaths : firstKills;
    },
    formatter: formatRatio,
  },
  {
    key: 'openingImpact',
    label: 'Opening Impact',
    description: 'Percentage of rounds where the player gets the opening kill',
    category: 'offense',
    valueFunction: (player) => {
      const firstKills = getRawStat(player, 'firstKills');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return firstKills / totalRounds;
    },
    formatter: formatPercent,
  },
  {
    key: 'headshotRate',
    label: 'Headshot %',
    description: 'Percentage of kills that are headshots',
    category: 'offense',
    valueFunction: (player) => {
      const headshots = getRawStat(player, 'headshots');
      const kills = getRawStat(player, 'kills');
      return kills > 0 ? headshots / kills : 0;
    },
    formatter: formatPercent,
  },
  {
    key: 'multiKillRounds',
    label: 'Multi-kill Rounds',
    description: 'Percentage of rounds with multiple kills',
    category: 'offense',
    valueFunction: (player) => {
      const multiKills = getRawStat(player, 'multiKills');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return multiKills / totalRounds;
    },
    formatter: formatPercent,
  },
  {
    key: 'adr',
    label: 'ADR',
    description: 'Average Damage per Round',
    category: 'offense',
    valueFunction: (player) => getRawStat(player, 'adrTotal'),
    formatter: (value) => value.toFixed(1),
  },
  {
    key: 'awpDependency',
    label: 'AWP Dependency',
    description: 'Percentage of kills with an AWP',
    category: 'offense',
    valueFunction: (player) => {
      const awpKills = getRawStat(player, 'awpKills');
      const kills = getRawStat(player, 'kills');
      return kills > 0 ? awpKills / kills : 0;
    },
    formatter: formatPercent,
  },
  
  // Defensive metrics
  {
    key: 'survivalRate',
    label: 'Survival Rate',
    description: 'Percentage of rounds survived',
    category: 'defense',
    valueFunction: (player) => {
      const deaths = getRawStat(player, 'deaths');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return 1 - (deaths / totalRounds);
    },
    formatter: formatPercent,
  },
  {
    key: 'tradeEfficiency',
    label: 'Trade Efficiency',
    description: 'Ratio of trade kills to trade deaths',
    category: 'defense',
    valueFunction: (player) => {
      const tradeKills = getRawStat(player, 'tradeKills');
      const tradeDeaths = getRawStat(player, 'tradeDeaths');
      return tradeDeaths > 0 ? tradeKills / tradeDeaths : tradeKills;
    },
    formatter: formatRatio,
  },
  {
    key: 'clutchRating',
    label: 'Clutch Factor',
    description: 'Effectiveness in 1vX situations',
    category: 'defense',
    valueFunction: (player) => {
      // This is a placeholder calculation since we don't have explicit clutch data
      const kd = player.kd;
      const survivalRate = 1 - (getRawStat(player, 'deaths') / Math.max(getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'), 1));
      return (kd * 0.7 + survivalRate * 0.3) * 1.2;
    },
    formatter: formatRatio,
  },
  {
    key: 'firstDeathRate',
    label: 'First Death Rate',
    description: 'Percentage of rounds where player is the first to die',
    category: 'defense',
    valueFunction: (player) => {
      const firstDeaths = getRawStat(player, 'firstDeaths');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return firstDeaths / totalRounds;
    },
    formatter: formatPercent,
  },
  
  // Utility metrics
  {
    key: 'flashAssists',
    label: 'Flash Assists',
    description: 'Percentage of flashes thrown that result in assisted kills',
    category: 'utility',
    valueFunction: (player) => {
      const assistedFlashes = getRawStat(player, 'assistedFlashes');
      const flashesThrown = getRawStat(player, 'flashesThrown');
      return flashesThrown > 0 ? assistedFlashes / flashesThrown : 0;
    },
    formatter: formatPercent,
  },
  {
    key: 'smokeUsage',
    label: 'Smoke Usage',
    description: 'Number of smokes used per round',
    category: 'utility',
    valueFunction: (player) => {
      const smokesThrown = getRawStat(player, 'smokesThrown');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return smokesThrown / totalRounds;
    },
    formatter: formatRatio,
  },
  {
    key: 'utilDamage',
    label: 'Util Damage',
    description: 'Average damage dealt with utility per round',
    category: 'utility',
    valueFunction: (player) => {
      const utilDmg = getRawStat(player, 'totalUtilDmg');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return utilDmg / totalRounds;
    },
    formatter: (value) => value.toFixed(1),
  },
  {
    key: 'kastRating',
    label: 'KAST %',
    description: 'Percentage of rounds with a Kill, Assist, Survived, or Traded death',
    category: 'utility',
    valueFunction: (player) => getRawStat(player, 'kastTotal'),
    formatter: formatPercent,
  },
  {
    key: 'utilityEconomy',
    label: 'Utility Economy',
    description: 'Overall effectiveness of utility usage',
    category: 'utility',
    valueFunction: (player) => {
      const utilDmg = getRawStat(player, 'totalUtilDmg');
      const totalUtil = getRawStat(player, 'totalUtilityThrown');
      return totalUtil > 0 ? utilDmg / totalUtil : 0;
    },
    formatter: formatRatio,
  },
  {
    key: 'flashesPerRound',
    label: 'Flashes/Round',
    description: 'Number of flashbangs thrown per round',
    category: 'utility',
    valueFunction: (player) => {
      const flashesThrown = getRawStat(player, 'flashesThrown');
      const totalRounds = Math.max(
        getRawStat(player, 'tRoundsWon') + getRawStat(player, 'ctRoundsWon'),
        1
      );
      return flashesThrown / totalRounds;
    },
    formatter: formatRatio,
  },
];

export default function AdvancedStatsTable({ players, statFilter }: AdvancedStatsTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'piv', direction: 'desc' });
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(advancedMetrics.map(m => m.key));
  const [searchTerm, setSearchTerm] = useState('');

  // Filter metrics based on category and search term
  const filteredMetrics = advancedMetrics.filter(metric => {
    if (statFilter !== 'all' && metric.category !== statFilter && metric.category !== 'overall') {
      return false;
    }
    
    if (searchTerm && !metric.label.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !metric.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return visibleMetrics.includes(metric.key);
  });

  // Sort players based on the selected metric
  const sortedPlayers = [...players].sort((a, b) => {
    const metricToSort = advancedMetrics.find(m => m.key === sortConfig.key);
    if (!metricToSort) return 0;
    
    const valueA = Number(metricToSort.valueFunction(a));
    const valueB = Number(metricToSort.valueFunction(b));
    
    return sortConfig.direction === 'asc' ? valueA - valueB : valueB - valueA;
  });

  // Toggle column visibility
  const toggleMetricVisibility = (metricKey: string) => {
    if (visibleMetrics.includes(metricKey)) {
      setVisibleMetrics(visibleMetrics.filter(key => key !== metricKey));
    } else {
      setVisibleMetrics([...visibleMetrics, metricKey]);
    }
  };

  // Toggle sort direction
  const handleSort = (metricKey: string) => {
    if (sortConfig.key === metricKey) {
      setSortConfig({
        key: metricKey,
        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSortConfig({
        key: metricKey,
        direction: 'desc'
      });
    }
  };

  // Calculate league average for a metric
  const getLeagueAverage = (metricKey: string): number => {
    const metric = advancedMetrics.find(m => m.key === metricKey);
    if (!metric) return 0;
    
    const sum = players.reduce((total, player) => {
      return total + Number(metric.valueFunction(player));
    }, 0);
    
    return sum / Math.max(players.length, 1);
  };

  // Get cell color based on comparison to league average
  const getCellColor = (metricKey: string, value: number): string => {
    const leagueAvg = getLeagueAverage(metricKey);
    const percentDiff = ((value - leagueAvg) / leagueAvg) * 100;
    
    if (percentDiff > 15) return 'text-green-500';
    if (percentDiff < -15) return 'text-red-500';
    return '';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search metrics..."
              className="pl-8"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X 
                className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground cursor-pointer" 
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              {advancedMetrics.map((metric) => (
                <DropdownMenuCheckboxItem
                  key={metric.key}
                  checked={visibleMetrics.includes(metric.key)}
                  onCheckedChange={() => toggleMetricVisibility(metric.key)}
                  className="capitalize"
                >
                  {metric.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Above Average
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            Below Average
          </Badge>
        </div>
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="sticky left-0 bg-background">Player</TableHead>
                {filteredMetrics.map((metric) => (
                  <TableHead key={metric.key} className="whitespace-nowrap">
                    <div 
                      className="flex items-center gap-1 cursor-pointer"
                      onClick={() => handleSort(metric.key)}
                    >
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                              {metric.label}
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="w-[250px]">{metric.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <ArrowUpDown 
                        className={`h-3 w-3 ${sortConfig.key === metric.key ? 'text-primary' : 'text-muted-foreground'}`} 
                      />
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium sticky left-0 bg-background">
                    <div className="flex flex-col">
                      <span>{player.name}</span>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>{player.team}</span>
                        <RoleBadge role={player.role} size="xs" />
                      </div>
                    </div>
                  </TableCell>
                  
                  {filteredMetrics.map((metric) => {
                    const rawValue = Number(metric.valueFunction(player));
                    const displayValue = metric.formatter ? metric.formatter(rawValue) : String(rawValue);
                    const colorClass = getCellColor(metric.key, rawValue);
                    
                    return (
                      <TableCell key={`${player.id}-${metric.key}`} className={`text-right ${colorClass}`}>
                        {displayValue}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}