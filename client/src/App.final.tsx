import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";

// Core Pages
import NotFound from "./pages/not-found";
import DashboardPage from "./pages/DashboardPage";
import PlayersPage from "./pages/PlayersPage";
import TeamsPage from "./pages/TeamsPage";
import PlayerDetailPage from "./pages/PlayerDetailPage";
import TeamDetailPage from "./pages/TeamDetailPage";

// Analytics Pages
import DataVisualizationPage from "./pages/DataVisualizationPage";
import AdvancedVisualizationPage from "./pages/AdvancedVisualizationPage";
import AdvancedAnalyticsPage from "./pages/AdvancedAnalyticsPage";
import PlayerComparisonsPage from "./pages/PlayerComparisonsPage";
import MatchPredictorPage from "./pages/MatchPredictorPage";
import StatisticalAnalysisPage from "./pages/StatisticalAnalysisPage";

// Feature Pages
import RoleWeightingsPage from "./pages/RoleWeightingsPage";
import DocumentationPage from "./pages/DocumentationPage";
import MatchInfographicPage from "./pages/MatchInfographicPage";
import ScoutPage from "./pages/ScoutPage";
import SearchPlayersPage from "./pages/SearchPlayersPage";

// Auth Pages
import LoginPage from "./pages/auth/login-page";
import AdminPage from "./pages/admin/admin-page";
import TestingEnvironmentPage from "./pages/admin/testing-environment-page";

// Layout
import Layout from "./components/layout/Layout";
import { ProtectedRoute } from "./lib/protected-route";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/testing-environment" component={TestingEnvironmentPage} />
          
          <Route path="/">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/players">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <PlayersPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/teams">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <TeamsPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/data-visualization">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <DataVisualizationPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/advanced-visualization">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <AdvancedVisualizationPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/advanced-analytics">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <AdvancedAnalyticsPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/player-comparisons">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <PlayerComparisonsPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/match-predictor">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <MatchPredictorPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/statistical-analysis">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <StatisticalAnalysisPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/role-weightings">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <RoleWeightingsPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/documentation">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <DocumentationPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/match-infographic">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <MatchInfographicPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/scout">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <ScoutPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/search-players">
            {() => (
              <ProtectedRoute>
                <Layout>
                  <SearchPlayersPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/player/:playerName">
            {(params) => (
              <ProtectedRoute>
                <Layout>
                  <PlayerDetailPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route path="/team/:teamName">
            {(params) => (
              <ProtectedRoute>
                <Layout>
                  <TeamDetailPage />
                </Layout>
              </ProtectedRoute>
            )}
          </Route>
          
          <Route>
            <Layout>
              <NotFound />
            </Layout>
          </Route>
        </Switch>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;