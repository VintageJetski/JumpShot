import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileDown, 
  SortAsc, 
  SortDesc, 
  Search,
  X,
  Filter
} from 'lucide-react';
import { PlayerWithPIV } from '@shared/types';

// Define stat categories
type StatCategory = 'all' | 'offense' | 'defense' | 'utility';

// Define props for component
interface AdvancedStatsTableProps {
  players: PlayerWithPIV[];
  statFilter: StatCategory;
}

// Stat columns for different categories
const STATS_COLUMNS = {
  offense: [
    { key: 'kills', label: 'Kills' },
    { key: 'headshots', label: 'HS %', format: (player: any) => `${((player.headshots / player.kills) * 100).toFixed(1)}%` },
    { key: 'kd', label: 'K/D' },
    { key: 'firstKills', label: 'First Kills' },
    { key: 'tFirstKills', label: 'T First Kills' },
    { key: 'wallbangKills', label: 'Wallbang Kills' },
    { key: 'blindKills', label: 'Blind Kills' },
    { key: 'throughSmoke', label: 'Through Smoke' },
  ],
  defense: [
    { key: 'deaths', label: 'Deaths' },
    { key: 'firstDeaths', label: 'First Deaths' },
    { key: 'ctFirstDeaths', label: 'CT First Deaths' },
    { key: 'victimBlindKills', label: 'Died While Blind' },
    { key: 'kd', label: 'K/D' },
  ],
  utility: [
    { key: 'flashesThrown', label: 'Flashes Thrown' },
    { key: 'assistedFlashes', label: 'Flash Assists' },
    { key: 'smokesThrown', label: 'Smokes Thrown' },
    { key: 'heThrown', label: 'HE Thrown' },
    { key: 'infernosThrown', label: 'Molotovs Thrown' },
    { key: 'totalUtilityThrown', label: 'Total Utility' },
  ],
  piv: [
    { key: 'piv', label: 'PIV' },
    { key: 'ctPIV', label: 'CT PIV' },
    { key: 'tPIV', label: 'T PIV' },
    { key: 'metrics.rcs.value', label: 'RCS', accessor: (player: PlayerWithPIV) => player.metrics.rcs.value },
    { key: 'metrics.icf.value', label: 'ICF', accessor: (player: PlayerWithPIV) => player.metrics.icf.value },
    { key: 'metrics.sc.value', label: 'SC', accessor: (player: PlayerWithPIV) => player.metrics.sc.value },
  ]
};

export default function AdvancedStatsTable({ players, statFilter }: AdvancedStatsTableProps) {
  const [sortBy, setSortBy] = useState<string>('piv');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('piv');
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  
  // Filter stats based on selected category
  const statColumns = useMemo(() => {
    if (selectedTab === 'all') {
      return [
        ...STATS_COLUMNS.piv,
        ...STATS_COLUMNS.offense,
        ...STATS_COLUMNS.defense,
        ...STATS_COLUMNS.utility
      ];
    } else if (selectedTab === 'custom' && customColumns.length > 0) {
      return [
        { key: 'piv', label: 'PIV' }, // Always include PIV for reference
        ...Object.values(STATS_COLUMNS)
          .flat()
          .filter(col => customColumns.includes(col.key))
      ];
    } else {
      return STATS_COLUMNS[selectedTab as keyof typeof STATS_COLUMNS] || STATS_COLUMNS.piv;
    }
  }, [selectedTab, customColumns]);

  // Sort players based on selected column and direction
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      let aValue: any = a;
      let bValue: any = b;
      
      // Handle nested properties like 'metrics.rcs.value'
      sortBy.split('.').forEach(key => {
        if (aValue && bValue) {
          aValue = aValue[key];
          bValue = bValue[key];
        }
      });
      
      // For nested object access, might need special accessor functions
      const column = statColumns.find(col => col.key === sortBy);
      if (column && column.accessor) {
        aValue = column.accessor(a);
        bValue = column.accessor(b);
      }
      
      // Handle strings vs numbers
      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        // For numerical sort
        return sortDirection === 'asc' 
          ? (aValue || 0) - (bValue || 0) 
          : (bValue || 0) - (aValue || 0);
      }
    });
  }, [players, sortBy, sortDirection, statColumns]);

  // Filter players by search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return sortedPlayers;
    
    return sortedPlayers.filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      player.team.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedPlayers, searchQuery]);

  // Toggle sort direction or change sort column
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc'); // Default to descending order when changing columns
    }
  };

  // Format cell value based on column definition
  const formatCellValue = (player: PlayerWithPIV, column: any) => {
    if (column.format) {
      return column.format(player.rawStats);
    }
    
    if (column.accessor) {
      return typeof column.accessor(player) === 'number' 
        ? column.accessor(player).toFixed(2) 
        : column.accessor(player);
    }
    
    // Handle nested properties like 'metrics.rcs.value'
    if (column.key.includes('.')) {
      let value = player;
      column.key.split('.').forEach((key: string) => {
        if (value) value = value[key as keyof typeof value];
      });
      return typeof value === 'number' ? value.toFixed(2) : value;
    }
    
    // Access raw stats for basic stats
    if (column.key in player.rawStats) {
      const value = player.rawStats[column.key as keyof typeof player.rawStats];
      return typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(2) : value;
    }
    
    // Otherwise try to access the player object directly
    const value = player[column.key as keyof typeof player];
    return typeof value === 'number' ? value.toFixed(2) : value;
  };

  // Handle adding a column to custom selection
  const handleAddCustomColumn = (columnKey: string) => {
    if (!customColumns.includes(columnKey)) {
      setCustomColumns([...customColumns, columnKey]);
    }
  };

  // Handle removing a column from custom selection
  const handleRemoveCustomColumn = (columnKey: string) => {
    setCustomColumns(customColumns.filter(key => key !== columnKey));
  };

  // Get all available columns for the custom selection
  const allAvailableColumns = useMemo(() => {
    return [
      ...STATS_COLUMNS.piv,
      ...STATS_COLUMNS.offense,
      ...STATS_COLUMNS.defense,
      ...STATS_COLUMNS.utility
    ].filter(col => !customColumns.includes(col.key));
  }, [customColumns]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search players or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            {searchQuery && (
              <button 
                className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Tabs 
            value={selectedTab} 
            onValueChange={setSelectedTab}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="piv">PIV</TabsTrigger>
              <TabsTrigger value="offense">Offense</TabsTrigger>
              <TabsTrigger value="defense">Defense</TabsTrigger>
              <TabsTrigger value="utility">Utility</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" size="icon" disabled>
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {selectedTab === 'custom' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Custom Column Selection</CardTitle>
            <CardDescription>
              Choose up to 8 metrics to display in your custom table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 mb-3">
              {customColumns.map(columnKey => {
                const column = allAvailableColumns.find(col => col.key === columnKey) || 
                               Object.values(STATS_COLUMNS).flat().find(col => col.key === columnKey);
                return (
                  <div key={columnKey} className="flex items-center bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                    {column?.label || columnKey}
                    <button 
                      onClick={() => handleRemoveCustomColumn(columnKey)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              {customColumns.length === 0 && (
                <div className="text-muted-foreground text-sm">No columns selected yet</div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Select 
                onValueChange={handleAddCustomColumn}
                disabled={customColumns.length >= 8}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Add column" />
                </SelectTrigger>
                <SelectContent>
                  <div className="max-h-[300px] overflow-y-auto">
                    {allAvailableColumns.map(column => (
                      <SelectItem key={column.key} value={column.key}>
                        {column.label}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
              
              {customColumns.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setCustomColumns([])}
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px] sticky left-0 bg-background">Player</TableHead>
                {statColumns.map(column => (
                  <TableHead 
                    key={column.key}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {sortBy === column.key && (
                        sortDirection === 'asc' 
                          ? <SortAsc className="h-3 w-3" /> 
                          : <SortDesc className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlayers.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={statColumns.length + 1} 
                    className="h-24 text-center"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers.map(player => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium sticky left-0 bg-background whitespace-nowrap">
                      <div className="flex flex-col">
                        <span>{player.name}</span>
                        <span className="text-xs text-muted-foreground">{player.team}</span>
                      </div>
                    </TableCell>
                    
                    {statColumns.map(column => (
                      <TableCell key={column.key} className="text-right">
                        {formatCellValue(player, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}