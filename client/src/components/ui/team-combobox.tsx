import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "./input"
import { ScrollArea } from "./scroll-area"
import { TeamWithTIR } from "@shared/schema"

interface TeamComboboxProps {
  teams: TeamWithTIR[]
  selectedTeamId: string | null
  onSelect: (value: string) => void
  placeholder?: string
}

export function TeamCombobox({ 
  teams, 
  selectedTeamId, 
  onSelect,
  placeholder = "Select a team"
}: TeamComboboxProps) {
  const [search, setSearch] = React.useState("")
  
  // Get the selected team's name
  const selectedTeam = React.useMemo(() => {
    if (!selectedTeamId) return null;
    return teams.find(team => team.id === selectedTeamId || team.name === selectedTeamId);
  }, [teams, selectedTeamId]);

  // Filter teams based on search
  const filteredTeams = React.useMemo(() => {
    if (!search) return teams;
    
    const searchTerms = search.toLowerCase();
    return teams.filter((team) => 
      team.name.toLowerCase().includes(searchTerms)
    );
  }, [teams, search]);

  // Handle input change separately from state
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // When user starts typing, clear the selection
    if (selectedTeam && e.target.value !== selectedTeam.name) {
      // We don't call onSelect here to prevent changing the actual selection
      // This just opens the dropdown with search results
    }
  };

  // Track if dropdown should be open
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // When input receives focus, open dropdown
  const handleFocus = () => {
    setIsDropdownOpen(true);
  };
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={selectedTeam && !isDropdownOpen ? selectedTeam.name : search}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onClick={() => setIsDropdownOpen(true)}
          className="pl-9"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {(isDropdownOpen || search) && (
        <div className="rounded-md border border-border mt-1">
          <ScrollArea className="h-[220px]">
            <div className="p-1">
              {filteredTeams.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No teams found
                </div>
              ) : (
                filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => {
                      console.log('Team selected in dropdown:', team);
                      onSelect(team.id);
                      setSearch("");
                      setIsDropdownOpen(false);
                    }}
                    className="flex items-center justify-between px-3 py-2 text-sm rounded-sm hover:bg-accent cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <div className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                      {team.tir.toFixed(2)} TIR
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}