import { useLeads, useCreateLead, useUpdateLead } from "@/hooks/use-leads";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLeadSchema, type InsertLead, type Lead } from "@shared/schema";
import { Plus, DollarSign, ArrowRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const STATUS_MAP = {
  new: "신규 유입",
  consulting: "상담 중",
  closing: "클로징",
  registered: "등록 완료"
};

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  consulting: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  closing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  registered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
};

export function SalesMachine() {
  const { data: leads, isLoading } = useLeads();
  const [isCreateOpen, setCreateOpen] = useState(false);
  
  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">데이터 로딩 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display">Sales Machine</h2>
          <p className="text-muted-foreground text-sm">리드 파이프라인 관리</p>
        </div>
        <CreateLeadDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {Object.entries(STATUS_MAP).map(([key, label]) => (
          <StatusColumn 
            key={key} 
            status={key} 
            label={label} 
            leads={leads?.filter(l => l.status === key) || []} 
          />
        ))}
      </div>
    </div>
  );
}

function StatusColumn({ status, label, leads }: { status: string, label: string, leads: Lead[] }) {
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  
  return (
    <div className="flex flex-col gap-3 min-w-[280px]">
      <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
        <span className="font-semibold">{label}</span>
        <Badge variant="outline" className="bg-background/50 font-mono text-xs">
          {leads.length}건
        </Badge>
      </div>
      
      <div className="flex flex-col gap-3">
        {leads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
        {leads.length === 0 && (
          <div className="h-24 rounded-2xl border border-dashed border-border flex items-center justify-center text-muted-foreground/50 text-sm">
            비어있음
          </div>
        )}
      </div>

      <div className="mt-auto pt-2 border-t border-border/50 flex justify-end">
        <span className="text-xs font-mono font-medium text-muted-foreground">
          ₩{totalValue.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const updateLead = useUpdateLead();

  const advanceStatus = () => {
    const statuses = Object.keys(STATUS_MAP);
    const currentIndex = statuses.indexOf(lead.status);
    if (currentIndex < statuses.length - 1) {
      updateLead.mutate({ id: lead.id, status: statuses[currentIndex + 1] });
    }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="glass-card rounded-2xl p-4 border-0 hover:border-primary/20 group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {lead.status !== 'registered' && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary"
              onClick={advanceStatus}
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
        <h4 className="font-bold text-foreground">{lead.name}</h4>
        <div className="flex items-center gap-1 mt-2 text-sm font-mono text-muted-foreground">
          <DollarSign className="w-3 h-3" />
          {lead.value.toLocaleString()}
        </div>
      </Card>
    </motion.div>
  );
}

function CreateLeadDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const createLead = useCreateLead();
  const form = useForm<InsertLead>({
    resolver: zodResolver(insertLeadSchema),
    defaultValues: { name: "", value: 0, status: "new" }
  });

  const onSubmit = (data: InsertLead) => {
    createLead.mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full bg-slate-800 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">
          <Plus className="w-4 h-4 mr-1" /> 리드 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-white/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새로운 리드 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">이름</label>
            <Input {...form.register("name")} placeholder="고객명 또는 기업명" className="rounded-xl bg-white/50" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">예상 가치 (원)</label>
            <Input 
              type="number" 
              {...form.register("value", { valueAsNumber: true })} 
              className="rounded-xl bg-white/50" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">상태</label>
            <Select onValueChange={(v) => form.setValue("status", v)} defaultValue="new">
              <SelectTrigger className="rounded-xl bg-white/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full rounded-xl mt-2" disabled={createLead.isPending}>
            {createLead.isPending ? "생성 중..." : "등록하기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
