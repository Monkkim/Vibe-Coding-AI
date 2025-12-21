import { useState } from "react";
import { GlassButton } from "@/components/ui/glass-button";
import { Textarea } from "@/components/ui/textarea";
import { useCrackTime } from "@/hooks/use-crack-time";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function CrackTime() {
  const [problem, setProblem] = useState("");
  const { crackProblem, isLoading, insight, actionItems } = useCrackTime();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!problem.trim()) return;
    crackProblem(problem);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2 text-center md:text-left">
        <h2 className="text-3xl font-display font-bold">Crack Time</h2>
        <p className="text-muted-foreground">Identify the fog. Extract the insight.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass p-8 rounded-[2rem]"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1">What's confusing you?</label>
              <Textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="I'm stuck on how to scale my outreach..."
                className="min-h-[200px] bg-white/50 border-white/20 focus:bg-white resize-none text-lg p-6 rounded-2xl"
              />
            </div>
            <GlassButton 
              type="submit" 
              className="w-full h-14 text-lg" 
              disabled={isLoading || !problem}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Analyzing Fog...</>
              ) : (
                <><BrainCircuit className="w-5 h-5 mr-2" /> Crack It</>
              )}
            </GlassButton>
          </form>
        </motion.div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {insight && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="glass p-8 rounded-[2rem] border-l-4 border-l-primary bg-gradient-to-br from-amber-50/50 to-transparent dark:from-amber-950/10"
              >
                <div className="flex items-center gap-3 mb-4 text-primary font-bold uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4" />
                  Core Insight
                </div>
                <p className="text-2xl font-display font-bold leading-relaxed text-foreground">
                  {insight}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {actionItems.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2">Action Plan</h3>
                {actionItems.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/40 dark:bg-black/20 border border-white/10"
                  >
                    <div className="mt-1">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-foreground/90 font-medium">{item}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {!insight && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center text-muted-foreground opacity-50 border-2 border-dashed border-border rounded-[2rem]">
              <BrainCircuit className="w-12 h-12 mb-4" />
              <p>Input your confusion to receive AI-powered clarity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
