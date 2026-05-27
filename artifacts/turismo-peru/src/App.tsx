import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import DirectorioPage from "@/pages/DirectorioPage";
import RankingsPage from "@/pages/RankingsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import OperatorDetailPage from "@/pages/OperatorDetailPage";
import NuevoOperadorPage from "@/pages/NuevoOperadorPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30000 } },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/directorio" component={DirectorioPage} />
        <Route path="/rankings" component={RankingsPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/operadores/nuevo" component={NuevoOperadorPage} />
        <Route path="/operadores/:id" component={OperatorDetailPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
