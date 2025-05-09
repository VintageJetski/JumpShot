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
  const [open, setOpen] = React.useState(false)
  
  // Get the selected team's name
  const selectedTeam = React.useMemo(() => {
    return teams.find(team => team.id === selectedTeamId)
  }, [teams, selectedTeamId])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedTeam ? selectedTeam.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search team..." className="h-9" />
          <CommandEmpty>No team found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {teams.map((team) => (
              <CommandItem
                key={team.id}
                value={team.name}
                onSelect={() => {
                  onSelect(team.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedTeamId === team.id ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex-1 text-sm">
                  <span className="font-medium">{team.name}</span>
                </div>
                <div className="ml-auto text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                  {team.tir.toFixed(2)} TIR
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}