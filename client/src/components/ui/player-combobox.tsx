import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  const [open, setOpen] = React.useState(false)
  
  // Get the selected player's name
  const selectedPlayer = React.useMemo(() => {
    return players.find(player => player.id === selectedPlayerId)
  }, [players, selectedPlayerId])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPlayer ? 
            `${selectedPlayer.name} (${selectedPlayer.team})` : 
            placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search player..." className="h-9" />
          <CommandEmpty>No player found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {players.map((player) => (
              <CommandItem
                key={player.id}
                value={`${player.name} ${player.team}`}
                onSelect={() => {
                  onSelect(player.id)
                  setOpen(false)
                }}
                className="flex items-center"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPlayerId === player.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{player.name}</span>
                  <span className="ml-2 text-muted-foreground">({player.team})</span>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                    {player.role}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200/10 text-slate-300">
                    {player.piv.toFixed(2)}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}