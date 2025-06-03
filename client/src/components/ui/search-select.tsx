import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchOption {
  id: string;
  name: string;
  extra?: string;
}

interface SearchSelectProps {
  options: SearchOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function SearchSelect({
  options,
  selectedId,
  onSelect,
  placeholder = "Search...",
  className,
  label
}: SearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  // Filter options based on search query
  const filteredOptions = query === ''
    ? options
    : options.filter(option => 
        option.name.toLowerCase().includes(query.toLowerCase())
      );
      
  // Add debugging
  console.log("SearchSelect options:", options.length);
  console.log("SearchSelect query:", query);
  console.log("SearchSelect filtered:", filteredOptions.length);

  // Get selected option for display
  const selectedOption = options.find(option => option.id === selectedId);

  return (
    <div ref={wrapperRef} className={cn("relative w-full", className)}>
      {label && <div className="mb-2 text-sm font-medium">{label}</div>}
      
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center"
      >
        <span className="truncate">
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
          <Input
            autoFocus
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="border-0 border-b rounded-t-md rounded-b-none focus-visible:ring-0"
          />
          
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map(option => (
                  <div
                    key={option.id}
                    onClick={() => {
                      onSelect(option.id);
                      setIsOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      "flex justify-between items-center px-3 py-2 text-sm rounded-md cursor-pointer",
                      option.id === selectedId 
                        ? "bg-accent text-accent-foreground" 
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="flex flex-col">
                      <span>{option.name}</span>
                      {option.extra && (
                        <span className="text-xs text-muted-foreground">{option.extra}</span>
                      )}
                    </div>
                    
                    {option.id === selectedId && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}