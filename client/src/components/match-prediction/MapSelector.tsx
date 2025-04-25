import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
// Define our maps enum directly here to avoid import issues
enum Maps {
  Inferno = "inferno",
  Mirage = "mirage",
  Nuke = "nuke",
  Dust2 = "dust2",
  Vertigo = "vertigo",
  Ancient = "ancient",
  Anubis = "anubis"
}

interface MapSelectorProps {
  selectedMap: string;
  onMapChange: (map: string) => void;
  className?: string;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  selectedMap,
  onMapChange,
  className
}) => {
  const maps = [
    { id: Maps.Inferno, name: "Inferno" },
    { id: Maps.Mirage, name: "Mirage" },
    { id: Maps.Nuke, name: "Nuke" },
    { id: Maps.Dust2, name: "Dust 2" },
    { id: Maps.Vertigo, name: "Vertigo" },
    { id: Maps.Ancient, name: "Ancient" },
    { id: Maps.Anubis, name: "Anubis" }
  ];
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Map Selection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Select
              value={selectedMap}
              onValueChange={onMapChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select map" />
              </SelectTrigger>
              <SelectContent>
                {maps.map((map) => (
                  <SelectItem key={map.id} value={map.id}>
                    {map.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-center">
            {selectedMap && (
              <div className="h-32 w-full bg-gradient-to-r from-blue-900/30 to-yellow-700/30 rounded-md flex items-center justify-center">
                <p className="text-2xl font-bold text-center">
                  {maps.find(m => m.id === selectedMap)?.name || selectedMap}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapSelector;