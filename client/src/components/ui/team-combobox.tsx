import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
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
    return teams.find(team => team.id === selectedTeamId || team.name === selectedTeamId)
  }, [teams, selectedTeamId])

  // Filter teams based on search
  const filteredTeams = React.useMemo(() => {
    if (!search) return teams
    
    const searchTerms = search.toLowerCase()
    return teams.filter((team) => 
      team.name.toLowerCase().includes(searchTerms)
    )
  }, [teams, search])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={selectedTeam ? selectedTeam.name : search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {search && !selectedTeam && (
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
                      onSelect(team.id)
                      setSearch("")
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