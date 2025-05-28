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
import DataVisualizationPage from "@/pages/DataVisualizationPage";
import AdvancedAnalyticsPage from "@/pages/AdvancedAnalyticsPage";
import DashboardPage from "@/pages/DashboardPage";
import ComprehensivePRDPage from "@/pages/ComprehensivePRDPage";

import LoginPage from "@/pages/auth/login-page";
import AdminPage from "@/pages/admin/admin-page";
import TestingEnvironmentPage from "@/pages/admin/testing-environment-page";
import Layout from "@/components/layout/Layout";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/auth/protected-route";

function Router() {
  const { isLoggedIn } = useAuth();

  return (
    <Layout>
      <Switch>
        {/* Auth page is public */}
        <Route path="/auth/login" component={LoginPage} />

        {/* Protected routes - require authentication */}
        <Route path="/">
          {() => (
            <ProtectedRoute>
              <PlayersPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/players">
          {() => (
            <ProtectedRoute>
              <PlayersPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/teams">
          {() => (
            <ProtectedRoute>
              <TeamsPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/role-weightings">
          {() => (
            <ProtectedRoute>
              <RoleWeightingsPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/documentation">
          {() => (
            <ProtectedRoute>
              <DocumentationPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/player-comparisons">
          {() => (
            <ProtectedRoute>
              <PlayerComparisonsPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/match-predictor">
          {() => (
            <ProtectedRoute>
              <MatchPredictorPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/match-infographic">
          {() => (
            <ProtectedRoute>
              <MatchInfographicPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/scout">
          {() => (
            <ProtectedRoute>
              <ScoutPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/scout/search-players">
          {() => (
            <ProtectedRoute>
              <SearchPlayersPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/statistical-analysis">
          {() => (
            <ProtectedRoute>
              <StatisticalAnalysisPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/data-visualization">
          {() => (
            <ProtectedRoute>
              <DataVisualizationPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/advanced-analytics">
          {() => (
            <ProtectedRoute>
              <AdvancedAnalyticsPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/dashboard">
          {() => (
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/prd">
          {() => (
            <ProtectedRoute>
              <ComprehensivePRDPage />
            </ProtectedRoute>
          )}
        </Route>

        <Route path="/players/:id">
          {() => (
            <ProtectedRoute>
              <PlayerDetailPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/teams/:name">
          {() => (
            <ProtectedRoute>
              <TeamDetailPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin">
          {() => (
            <ProtectedRoute adminOnly={true}>
              <AdminPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/admin/testing-environment">
          {() => (
            <ProtectedRoute adminOnly={true}>
              <TestingEnvironmentPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route>
          {() => (
            <ProtectedRoute>
              <NotFound />
            </ProtectedRoute>
          )}
        </Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
