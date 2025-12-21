import { Sidebar } from "@/components/layout/sidebar";
import { Route, Switch } from "wouter";
import { CrackTime } from "./crack-time";
import { Leads } from "./leads";
import { Tokens } from "./tokens";
import { Overview } from "./overview";
import { JournalDrawer } from "@/components/journals/journal-drawer";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-4 md:p-8 lg:p-12 min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Switch>
            <Route path="/dashboard" component={Overview} />
            <Route path="/dashboard/crack-time" component={CrackTime} />
            <Route path="/dashboard/leads" component={Leads} />
            <Route path="/dashboard/tokens" component={Tokens} />
          </Switch>
        </div>
      </main>
      <JournalDrawer />
    </div>
  );
}
