import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="glassmorphism rounded-xl p-8 text-center">
          <div className="text-lg text-red-400 mb-2">Application Error</div>
          <div className="text-sm text-muted-foreground mb-4">{error.message}</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}
import NotFound from "@/pages/not-found";
import PlayersPage from "@/pages/PlayersPage";
import TeamsPage from "@/pages/TeamsPage";
import PlayerDetailPage from "@/pages/PlayerDetailPage";
import TeamDetailPage from "@/pages/TeamDetailPage";
import RoleWeightingsPage from "@/pages/RoleWeightingsPage";
import FlamezCalculationPage from "@/pages/FlamezCalculationPage";
import DocumentationPage from "@/pages/DocumentationPage";
import PlayerComparisonsPage from "@/pages/PlayerComparisonsPage";
import MatchPredictorPage from "@/pages/MatchPredictorPage";
import MatchInfographicPage from "@/pages/MatchInfographicPage";
import ScoutPage from "@/pages/ScoutPage";
import SearchPlayersPage from "@/pages/SearchPlayersPage";
import StatisticalAnalysisPage from "@/pages/StatisticalAnalysisPage";
import DataVisualizationPage from "@/pages/DataVisualizationPage";
import AdvancedAnalyticsPage from "@/pages/AdvancedAnalyticsPage";
import DashboardPage from "@/pages/DashboardPage";
import VentionStyleMockup from "@/pages/VentionStyleMockup";
import PositionalAnalysisPage from "@/pages/PositionalAnalysisPage";
import Layout from "@/components/layout/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={PlayersPage} />
        <Route path="/players" component={PlayersPage} />
        <Route path="/teams" component={TeamsPage} />
        <Route path="/role-weightings" component={RoleWeightingsPage} />
        <Route path="/flamez-calculation" component={FlamezCalculationPage} />
        <Route path="/documentation" component={DocumentationPage} />
        <Route path="/player-comparisons" component={PlayerComparisonsPage} />
        <Route path="/match-predictor" component={MatchPredictorPage} />
        <Route path="/match-infographic" component={MatchInfographicPage} />
        <Route path="/scout" component={ScoutPage} />
        <Route path="/scout/search-players" component={SearchPlayersPage} />
        <Route path="/statistical-analysis" component={StatisticalAnalysisPage} />
        <Route path="/data-visualization" component={DataVisualizationPage} />
        <Route path="/positional-analysis" component={PositionalAnalysisPage} />
        <Route path="/advanced-analytics" component={AdvancedAnalyticsPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/vention-mockup" component={VentionStyleMockup} />
        <Route path="/players/:id" component={PlayerDetailPage} />
        <Route path="/teams/:name" component={TeamDetailPage} />
        <Route path="/admin" component={() => <div className="p-8"><h1 className="text-2xl font-bold">Admin Dashboard</h1><p>System statistics and management tools would go here.</p></div>} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
