import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { ScrollArea } from "../components/ui/scroll-area"
import { PlayerWithPIV } from "@shared/schema"

interface PlayerComboboxProps {
  players: PlayerWithPIV[]
  selectedPlayerId: string | null
  onSelect: (value: string) => void
  placeholder?: string
}

export function PlayerCombobox({ 
  players, 
  selectedPlayerId, 
  onSelect,
  placeholder = "Select a player"
}: PlayerComboboxProps) {
  const [search, setSearch] = React.useState("")
  
  // Get the selected player's name
  const selectedPlayer = React.useMemo(() => {
    return players.find(player => player.id === selectedPlayerId)
  }, [players, selectedPlayerId])

  // Filter players based on search
  const filteredPlayers = React.useMemo(() => {
    if (!search) return players
    
    const searchTerms = search.toLowerCase()
    return players.filter((player) => 
      player.name.toLowerCase().includes(searchTerms) || 
      player.team.toLowerCase().includes(searchTerms) ||
      player.role.toLowerCase().includes(searchTerms)
    )
  }, [players, search])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={selectedPlayer ? `${selectedPlayer.name} (${selectedPlayer.team})` : search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      
      {search && !selectedPlayer && (
        <div className="rounded-md border border-border mt-1">
          <ScrollArea className="h-[220px]">
            <div className="p-1">
              {filteredPlayers.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No players found
                </div>
              ) : (
                filteredPlayers.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => {
                      onSelect(player.id)
                      setSearch("")
                    }}
                    className="flex items-center justify-between px-3 py-2 text-sm rounded-sm hover:bg-accent cursor-pointer"
                  >
                    <div>
                      <span className="font-medium">{player.name}</span>
                      <span className="ml-2 text-muted-foreground">({player.team})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                        {player.role}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200/10 text-slate-300">
                        {player.piv.toFixed(2)}
                      </span>
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