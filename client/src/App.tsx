import { Switch, Route } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Import all your advanced pages
import DashboardPage from "@/pages/DashboardPage";
import PlayersPage from "@/pages/PlayersPage";
import TeamsPage from "@/pages/TeamsPage";
import PlayerDetailPage from "@/pages/PlayerDetailPage";
import TeamDetailPage from "@/pages/TeamDetailPage";
import PlayerComparisonsPage from "@/pages/PlayerComparisonsPage";
import MatchPredictorPage from "@/pages/MatchPredictorPage";
import ScoutPage from "@/pages/ScoutPage";
import AdvancedAnalyticsPage from "@/pages/AdvancedAnalyticsPage";
import DataVisualizationPage from "@/pages/DataVisualizationPage";
import StatisticalAnalysisPage from "@/pages/StatisticalAnalysisPage";
import AdvancedVisualizationPage from "@/pages/AdvancedVisualizationPage";
import SearchPlayersPage from "@/pages/SearchPlayersPage";
import RoleWeightingsPage from "@/pages/RoleWeightingsPage";
import DocumentationPage from "@/pages/DocumentationPage";
import MatchInfographicPage from "@/pages/MatchInfographicPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Switch>
          {/* Main Pages */}
          <Route path="/" component={DashboardPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/players" component={PlayersPage} />
          <Route path="/teams" component={TeamsPage} />
          
          {/* Detail Pages */}
          <Route path="/player/:playerName" component={PlayerDetailPage} />
          <Route path="/team/:teamName" component={TeamDetailPage} />
          
          {/* Advanced Features */}
          <Route path="/compare" component={PlayerComparisonsPage} />
          <Route path="/predictions" component={MatchPredictorPage} />
          <Route path="/scout" component={ScoutPage} />
          <Route path="/analytics" component={AdvancedAnalyticsPage} />
          <Route path="/visualization" component={DataVisualizationPage} />
          <Route path="/advanced-visualization" component={AdvancedVisualizationPage} />
          <Route path="/statistical-analysis" component={StatisticalAnalysisPage} />
          <Route path="/search" component={SearchPlayersPage} />
          <Route path="/role-weightings" component={RoleWeightingsPage} />
          <Route path="/documentation" component={DocumentationPage} />
          <Route path="/infographic" component={MatchInfographicPage} />
          
          {/* Fallback */}
          <Route component={NotFound} />
        </Switch>
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;