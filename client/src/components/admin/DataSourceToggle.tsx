import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Database, DatabaseIcon, RefreshCw, Cloud, FileJson } from "lucide-react";

export function DataSourceToggle() {
  const { toast } = useToast();
  const [dataSource, setDataSource] = useState<'csv' | 'supabase'>('csv');
  
  const switchDataSourceMutation = useMutation({
    mutationFn: async (source: 'csv' | 'supabase') => {
      const res = await apiRequest('POST', '/api/admin/data-source', { source });
      return await res.json();
    },
    onSuccess: (data, source) => {
      setDataSource(source);
      
      // Force refresh all cached data
      window.localStorage.removeItem('queryCache');
      
      // Force reload the application to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
      toast({
        title: "Data Source Changed",
        description: `Successfully switched to ${source.toUpperCase()} data source. Refreshing the application...`,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Change Data Source",
        description: "An error occurred while changing the data source.",
        variant: "destructive",
      });
    },
  });

  const handleToggleDataSource = () => {
    const newSource = dataSource === 'csv' ? 'supabase' : 'csv';
    switchDataSourceMutation.mutate(newSource);
  };

  return (
    <Card className="glassmorphism border-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5 text-blue-400" />
          Data Source Configuration
        </CardTitle>
        <CardDescription>
          Configure the data source for the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label htmlFor="data-source-toggle" className="font-medium text-blue-100">
              Data Source:
            </Label>
            <div className="flex gap-2 items-center">
              <Badge 
                variant={dataSource === 'csv' ? "default" : "outline"}
                className={dataSource === 'csv' ? "bg-gradient-to-r from-blue-700 to-purple-600" : "text-blue-300/70"}
              >
                <FileJson className="h-3 w-3 mr-1" />
                CSV
              </Badge>
              <Switch 
                id="data-source-toggle" 
                checked={dataSource === 'supabase'}
                onCheckedChange={handleToggleDataSource}
                disabled={switchDataSourceMutation.isPending}
              />
              <Badge 
                variant={dataSource === 'supabase' ? "default" : "outline"}
                className={dataSource === 'supabase' ? "bg-gradient-to-r from-green-600 to-emerald-500" : "text-blue-300/70"}
              >
                <Cloud className="h-3 w-3 mr-1" />
                Supabase
              </Badge>
            </div>
          </div>
          <div>
            {switchDataSourceMutation.isPending && (
              <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
            )}
          </div>
        </div>
        
        <Separator className="my-4 bg-blue-900/30" />
        
        <div className="space-y-2 text-sm text-blue-200/80">
          <h3 className="font-medium text-blue-100">Current Configuration</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-blue-950/40 px-3 py-2 rounded-md">
              <span className="text-blue-300/70">Current Source:</span>
              <div className="font-medium">
                {dataSource === 'csv' ? 'CSV Files' : 'Supabase Database'}
              </div>
            </div>
            <div className="bg-blue-950/40 px-3 py-2 rounded-md">
              <span className="text-blue-300/70">Status:</span>
              <div className="font-medium text-green-400">
                Connected
              </div>
            </div>
          </div>
          <p className="text-xs mt-2 text-blue-300/60">
            {dataSource === 'csv' 
              ? "Using local CSV files for data. This is the default configuration." 
              : "Using Supabase as the data source. Data is fetched from the cloud database."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}