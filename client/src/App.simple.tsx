import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import TestPage from "./pages/TestPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <Switch>
          <Route path="/" component={TestPage} />
          <Route>
            <div className="p-8">
              <h1 className="text-2xl font-bold">CS2 Analytics Platform</h1>
              <p className="mt-4">Application is loading...</p>
            </div>
          </Route>
        </Switch>
      </div>
    </QueryClientProvider>
  );
}

export default App;