import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import PlayersPage from "@/pages/PlayersPage";
import TeamsPage from "@/pages/TeamsPage";
import PlayerDetailPage from "@/pages/PlayerDetailPage";
import TeamDetailPage from "@/pages/TeamDetailPage";
import RoleWeightingsPage from "@/pages/RoleWeightingsPage";
import DocumentationPage from "@/pages/DocumentationPage";
import PlayerComparisonsPage from "@/pages/PlayerComparisonsPage";
import MatchPredictorPage from "@/pages/MatchPredictorPage";
import MatchInfographicPage from "@/pages/MatchInfographicPage";
import ScoutPage from "@/pages/ScoutPage";
import SearchPlayersPage from "@/pages/SearchPlayersPage";
import StatisticalAnalysisPage from "@/pages/StatisticalAnalysisPage";
import Layout from "@/components/layout/Layout";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={PlayersPage} />
        <Route path="/players" component={PlayersPage} />
        <Route path="/teams" component={TeamsPage} />
        <Route path="/role-weightings" component={RoleWeightingsPage} />
        <Route path="/documentation" component={DocumentationPage} />
        <Route path="/player-comparisons" component={PlayerComparisonsPage} />
        <Route path="/match-predictor" component={MatchPredictorPage} />
        <Route path="/match-infographic" component={MatchInfographicPage} />
        <Route path="/scout" component={ScoutPage} />
        <Route path="/scout/search-players" component={SearchPlayersPage} />
        <Route path="/statistical-analysis" component={StatisticalAnalysisPage} />
        <Route path="/players/:id" component={PlayerDetailPage} />
        <Route path="/teams/:name" component={TeamDetailPage} />
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
