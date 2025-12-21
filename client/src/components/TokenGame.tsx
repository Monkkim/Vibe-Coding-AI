import { useTokens, useCreateToken } from "@/hooks/use-tokens";
import { useAuth } from "@/hooks/use-auth";
import { useUsers } from "@/hooks/use-folders";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Trophy, Medal } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTokenSchema, type InsertToken } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function TokenGame() {
  const { data: tokens, isLoading } = useTokens();
  const [isGiveOpen, setGiveOpen] = useState(false);
  
  // Calculate leaderboard
  const leaderboard = tokens?.reduce((acc, token) => {
    const userId = token.toUserId;
    if (!acc[userId]) {
      acc[userId] = { name: token.receiverName || "Unknown", count: 0 };
    }
    acc[userId].count += 1;
    return acc;
  }, {} as Record<string, { name: string, count: number }>);
  
  const sortedLeaderboard = Object.entries(leaderboard || {})
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Coins className="text-amber-500" />
            명예의 전당
          </h2>
          <p className="text-muted-foreground text-sm">동료에게 감사를 전하세요</p>
        </div>
        <GiveTokenDialog open={isGiveOpen} onOpenChange={setGiveOpen} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Section */}
        <Card className="glass-card rounded-3xl p-6 lg:col-span-1 border-amber-200/50 dark:border-amber-900/30">
          <div className="flex items-center gap-2 mb-4 text-amber-600 font-bold">
            <Trophy className="w-5 h-5" />
            <span>Top Contributors</span>
          </div>
          <div className="space-y-4">
            {sortedLeaderboard.map(([id, user], index) => (
              <div key={id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-amber-400 text-white' : 
                    index === 1 ? 'bg-slate-300 text-slate-600' :
                    index === 2 ? 'bg-amber-700/50 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-600 font-mono font-bold">
                  {user.count} <Coins className="w-3 h-3" />
                </div>
              </div>
            ))}
            {sortedLeaderboard.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">아직 토큰이 없습니다.</p>
            )}
          </div>
        </Card>

        {/* Recent Feed */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-semibold text-muted-foreground text-sm px-2">최근 활동</h3>
          {tokens?.slice(0, 5).map((token) => (
            <div key={token.id} className="glass-card rounded-2xl p-4 flex items-start gap-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600">
                <Medal className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-medium">
                    <span className="text-primary">{token.senderName}</span>님이 
                    <span className="text-primary"> {token.receiverName}</span>님에게 토큰을 보냈습니다.
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(token.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 bg-muted/30 p-2 rounded-lg inline-block">
                  "{token.message}"
                </p>
                <div className="mt-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    #{token.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GiveTokenDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (v: boolean) => void }) {
  const { user } = useAuth();
  const { data: allUsers, isLoading: usersLoading } = useUsers();
  const createToken = useCreateToken();
  const { toast } = useToast();
  
  const otherUsers = allUsers?.filter(u => u.id !== user?.id) || [];
  
  const form = useForm<InsertToken>({
    resolver: zodResolver(insertTokenSchema),
    defaultValues: {
      fromUserId: user?.id || "",
      toUserId: "",
      category: "growth",
      message: ""
    }
  });

  const onSubmit = (data: InsertToken) => {
    createToken.mutate({ ...data, fromUserId: user!.id }, {
      onSuccess: () => {
        toast({ title: "전송 완료!", description: "동료에게 마음을 전했습니다." });
        onOpenChange(false);
        form.reset();
      },
      onError: () => {
        toast({ title: "전송 실패", description: "잠시 후 다시 시도해주세요.", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
          토큰 보내기
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-white/20 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>동료 칭찬하기</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">받는 사람</label>
            <Select onValueChange={(v) => form.setValue("toUserId", v)} disabled={usersLoading}>
              <SelectTrigger className="rounded-xl bg-white/50 dark:bg-black/20" data-testid="select-recipient">
                <SelectValue placeholder={usersLoading ? "로딩 중..." : "동료를 선택하세요"} />
              </SelectTrigger>
              <SelectContent>
                {usersLoading ? (
                  <div className="p-2 text-sm text-muted-foreground animate-pulse">사용자 목록 로딩 중...</div>
                ) : otherUsers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">다른 사용자가 없습니다</div>
                ) : (
                  otherUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName} {u.email ? `(${u.email})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리</label>
            <Select onValueChange={(v) => form.setValue("category", v)} defaultValue="growth">
              <SelectTrigger className="rounded-xl bg-white/50 dark:bg-black/20" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="growth">성장 (Growth)</SelectItem>
                <SelectItem value="influence">영향력 (Influence)</SelectItem>
                <SelectItem value="execution">실행력 (Execution)</SelectItem>
                <SelectItem value="camaraderie">전우애 (Camaraderie)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">메시지</label>
            <Input 
              {...form.register("message")} 
              placeholder="어떤 점이 훌륭했나요?" 
              className="rounded-xl bg-white/50 dark:bg-black/20" 
              data-testid="input-message"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full rounded-xl mt-2 bg-amber-500 hover:bg-amber-600" 
            disabled={createToken.isPending}
            data-testid="button-send-token"
          >
            {createToken.isPending ? "전송 중..." : "토큰 보내기"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
