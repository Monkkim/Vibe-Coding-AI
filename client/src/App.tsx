import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Landing } from "@/pages/landing";
import { Dashboard } from "@/pages/dashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      {/* Dashboard handles its own sub-routes via nested router/switch logic if needed, 
          but Wouter flat routes are often cleaner. 
          Here we route /dashboard/* to the Dashboard layout component 
          which then renders sub-components based on location */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/:subpage" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
