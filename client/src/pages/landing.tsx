import { useAuth } from "@/hooks/use-auth";
import { GlassButton } from "@/components/ui/glass-button";
import { Link } from "wouter";
import { Gem, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function Landing() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center space-y-8 max-w-2xl px-6"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-2xl shadow-primary/40 rotate-12">
            <Gem className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-foreground">
          Break your <span className="text-gradient">limits.</span>
        </h1>
        
        <p className="text-xl text-muted-foreground font-light leading-relaxed">
          The all-in-one growth dashboard for ambitious students. <br/>
          Analyze fog, track leads, and execute with precision.
        </p>

        <div className="pt-8">
          {user ? (
            <Link href="/dashboard">
              <GlassButton size="lg" className="text-lg px-10 h-16 rounded-full group">
                Enter Dashboard <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </GlassButton>
            </Link>
          ) : (
            <div className="flex flex-col items-center gap-4">
               <GlassButton size="lg" className="text-lg px-10 h-16 rounded-full group" onClick={() => window.location.href = "/api/login"}>
                Start Now <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </GlassButton>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Powered by Replit Auth</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
