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
