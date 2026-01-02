import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Gem, ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect } from "react";

export function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/batches");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;
  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-amber-400/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[100px]" />
      </div>

      <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2 font-display font-bold text-xl">
          <Gem className="text-amber-500" />
          <span>AGround</span>
        </div>
        <ThemeToggle />
      </nav>

      <main className="text-center max-w-4xl px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-white/20 backdrop-blur-md mb-8">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">성장을 위한 올인원 대시보드</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
            Break Your <br />
            <span className="text-amber-500">Limits.</span>
          </h1>
          

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="h-14 px-8 rounded-full text-lg bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 text-foreground hover:bg-white/30 dark:hover:bg-white/20 shadow-xl hover:scale-105 transition-all duration-300"
              asChild
            >
              <a href="/api/login">
                입장하기 <ArrowRight className="ml-2 w-5 h-5" />
              </a>
            </Button>
          </div>
        </motion.div>
      </main>

      <footer className="absolute bottom-6 text-sm text-muted-foreground/50 font-mono">
        © 2024 AGround. All rights reserved.
      </footer>
    </div>
  );
}
