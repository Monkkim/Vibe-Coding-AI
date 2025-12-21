import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

export function Overview() {
  const { user } = useAuth();

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
          Welcome back, <span className="text-gradient">{user?.firstName}</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Your growth dashboard is ready. Focus on what matters today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Crack Time */}
        <Link href="/dashboard/crack-time">
          <motion.div 
            whileHover={{ y: -5 }}
            className="group cursor-pointer p-8 rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-900/10 border border-amber-100 dark:border-amber-900/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Crack Time</h3>
                <p className="text-amber-700 dark:text-amber-300">Consult the AI Oracle</p>
              </div>
              <div className="pt-4 flex items-center text-sm font-semibold text-amber-600 dark:text-amber-400">
                Enter the Fog <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Card 2: Sales Machine */}
        <Link href="/dashboard/leads">
          <motion.div 
            whileHover={{ y: -5 }}
            className="group cursor-pointer p-8 rounded-[2rem] bg-white dark:bg-card border border-border shadow-sm hover:shadow-xl transition-all"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-foreground">
                <span className="font-display font-bold text-xl">$</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Sales Machine</h3>
                <p className="text-muted-foreground">Manage your opportunities</p>
              </div>
            </div>
          </motion.div>
        </Link>
        
        {/* Card 3: Token Game */}
        <Link href="/dashboard/tokens">
          <motion.div 
            whileHover={{ y: -5 }}
            className="group cursor-pointer p-8 rounded-[2rem] bg-white dark:bg-card border border-border shadow-sm hover:shadow-xl transition-all"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-500">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">Token Game</h3>
                <p className="text-muted-foreground">Recognize peer excellence</p>
              </div>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
