import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BatchProvider } from "@/contexts/BatchContext";
import NotFound from "@/pages/not-found";
import { Landing } from "@/pages/landing";
import { Login } from "@/pages/login";
import { Signup } from "@/pages/signup";
import { ForgotPassword } from "@/pages/forgot-password";
import { BatchSelect } from "@/pages/batch-select";
import { Dashboard } from "@/pages/dashboard";
import { Settings } from "@/pages/settings";
import { ShareView } from "@/pages/share";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/batches" component={BatchSelect} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/share/:id" component={ShareView} />
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
