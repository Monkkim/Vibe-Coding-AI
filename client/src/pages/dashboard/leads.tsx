import { useLeads, useCreateLead, useUpdateLead } from "@/hooks/use-leads";
import { GlassButton } from "@/components/ui/glass-button";
import { Plus, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema, type InsertLead } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, Reorder } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Leads() {
  const { data: leads } = useLeads();
  const { mutate: createLead } = useCreateLead();
  const { mutate: updateLead } = useUpdateLead();
  const [open, setOpen] = useState(false);

  // Group leads by status
  const columns = {
    new: leads?.filter(l => l.status === "new") || [],
    consulting: leads?.filter(l => l.status === "consulting") || [],
    closing: leads?.filter(l => l.status === "closing") || [],
    registered: leads?.filter(l => l.status === "registered") || [],
  };

  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: {
      name: "",
      value: 0,
      status: "new",
    },
  });

  const onSubmit = (data: InsertLead) => {
    createLead(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  return (
    <div className="space-y-8 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold">Sales Machine</h2>
          <p className="text-muted-foreground">Pipeline visualization</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <GlassButton><Plus className="w-4 h-4 mr-2" /> Add Lead</GlassButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass">
            <DialogHeader>
              <DialogTitle>New Opportunity</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lead Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <GlassButton type="submit" className="w-full">Create Lead</GlassButton>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[600px]">
        {Object.entries(columns).map(([status, items]) => (
          <div key={status} className="flex flex-col h-full bg-secondary/30 rounded-2xl p-4 border border-border/50">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold uppercase text-xs tracking-wider text-muted-foreground">{status}</h3>
              <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md text-xs font-mono">{items.length}</span>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto">
              {items.map((lead) => (
                <motion.div
                  key={lead.id}
                  layoutId={String(lead.id)}
                  className="bg-card p-4 rounded-xl shadow-sm border border-border/50 cursor-grab active:cursor-grabbing group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{lead.name}</h4>
                    <span className="text-green-600 font-mono text-xs bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                      ${lead.value}
                    </span>
                  </div>
                  
                  {/* Status switcher for demo purposes since we don't have DnD fully wired */}
                  <div className="flex gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {Object.keys(columns).map(s => (
                      <button
                        key={s}
                        onClick={() => updateLead({ id: lead.id, status: s })}
                        className={cn(
                          "w-2 h-2 rounded-full ring-1 ring-offset-1 ring-border transition-all hover:scale-125",
                          s === status ? "bg-primary" : "bg-muted"
                        )}
                        title={`Move to ${s}`}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
