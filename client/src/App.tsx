import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BatchProvider } from "@/contexts/BatchContext";
import NotFound from "@/pages/not-found";
import { Landing } from "@/pages/landing";
import { BatchSelect } from "@/pages/batch-select";
import { Dashboard } from "@/pages/dashboard";
import { Settings } from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/batches" component={BatchSelect} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BatchProvider>
          <Router />
          <Toaster />
        </BatchProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
