import { useTokens, useCreateToken } from "@/hooks/use-tokens";
import { GlassButton } from "@/components/ui/glass-button";
import { Trophy, Medal, Crown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTokenSchema, type InsertToken } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Tokens() {
  const { data: tokens } = useTokens();
  const { mutate: createToken } = useCreateToken();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const form = useForm<InsertToken>({
    resolver: zodResolver(insertTokenSchema),
    defaultValues: {
      fromUserId: user?.id || "",
      toUserId: "", // In a real app this would be a select from users list
      category: "growth",
      message: "",
    },
  });

  const onSubmit = (data: InsertToken) => {
    createToken({ ...data, fromUserId: user?.id || "" }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      }
    });
  };

  // Simplified leaderboard logic
  const leaderboard = tokens?.reduce((acc, token) => {
    const userId = token.toUserId;
    if (!acc[userId]) acc[userId] = 0;
    acc[userId]++;
    return acc;
  }, {} as Record<string, number>);

  const topUsers = Object.entries(leaderboard || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold">Token Game</h2>
          <p className="text-muted-foreground">Recognize excellence</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <GlassButton className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-yellow-500/25">
              <Trophy className="w-4 h-4 mr-2" /> Give Token
            </GlassButton>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] glass">
            <DialogHeader>
              <DialogTitle>Award a Token</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="toUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To User ID</FormLabel>
                      <FormControl>
                        <Input placeholder="User ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="growth">Growth</SelectItem>
                          <SelectItem value="influence">Influence</SelectItem>
                          <SelectItem value="execution">Execution</SelectItem>
                          <SelectItem value="camaraderie">Camaraderie</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Input placeholder="Great job on..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <GlassButton type="submit" className="w-full">Send Token</GlassButton>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {topUsers.map(([userId, count], index) => (
          <div key={userId} className="glass p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50" />
             {index === 0 && <Crown className="w-8 h-8 text-yellow-500 mb-2" />}
             {index === 1 && <Medal className="w-8 h-8 text-slate-400 mb-2" />}
             {index === 2 && <Medal className="w-8 h-8 text-orange-400 mb-2" />}
             <h3 className="font-bold text-xl truncate max-w-full">User {userId.slice(0, 4)}</h3>
             <div className="text-4xl font-display font-bold mt-2 text-yellow-600">{count}</div>
             <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Tokens</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-lg">Recent Activity</h3>
        {tokens?.map((token) => (
          <div key={token.id} className="bg-card p-4 rounded-xl border border-border/50 flex items-center gap-4">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarFallback>{token.fromUserId.slice(0,1)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-bold">User {token.fromUserId.slice(0,4)}</span> awarded 
                <span className="font-bold"> User {token.toUserId.slice(0,4)}</span>
              </p>
              <p className="text-muted-foreground text-sm italic">"{token.message}"</p>
            </div>
            <span className="text-xs font-mono bg-secondary px-2 py-1 rounded-full uppercase">
              {token.category}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
