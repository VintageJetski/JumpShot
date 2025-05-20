import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarRange } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface Event {
  id: number;
  name: string;
}

interface EventSelectorProps {
  onEventChange: (eventId: number | undefined) => void;
  selectedEventId?: number;
}

export default function EventSelector({ onEventChange, selectedEventId }: EventSelectorProps) {
  const { toast } = useToast();
  const [currentEventId, setCurrentEventId] = useState<number | undefined>(selectedEventId);
  
  // Fetch available events
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error fetching events',
        description: 'Could not load events. Please try again later.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  // Handle selecting event
  const handleEventChange = (value: string) => {
    const eventId = value === 'all' ? undefined : parseInt(value, 10);
    setCurrentEventId(eventId);
    onEventChange(eventId);
  };
  
  return (
    <div className="flex items-center gap-2 bg-blue-900/10 p-2 rounded-lg border border-blue-500/20">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <CalendarRange className="h-4 w-4 mr-1 text-blue-400" />
              <span className="text-sm text-blue-300 mr-2">Event:</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select an event to filter data</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Select
        disabled={isLoading || !events}
        value={currentEventId?.toString() || 'all'}
        onValueChange={handleEventChange}
      >
        <SelectTrigger className="w-[180px] text-sm bg-blue-950/40 border-blue-500/30">
          <SelectValue placeholder="Select event" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-blue-200">
            All Events
          </SelectItem>
          {events?.map((event) => (
            <SelectItem key={event.id} value={event.id.toString()} className="text-blue-200">
              {event.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {currentEventId !== undefined && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-blue-300 hover:text-blue-100"
          onClick={() => handleEventChange('all')}
        >
          Clear
        </Button>
      )}
    </div>
  );
}