import { useTokens, useCreateToken, useAcceptToken } from "@/hooks/use-tokens";
import { useAuth } from "@/hooks/use-auth";
import { useBatchMembers } from "@/hooks/use-folders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Coins, Trophy, Gift, Target, Heart, Sparkles, Clock, TrendingUp, Mail } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { Token } from "@shared/schema";

const AMOUNT_OPTIONS = [
  { value: 10000, label: "1만" },
  { value: 30000, label: "3만" },
  { value: 50000, label: "5만" },
  { value: 70000, label: "7만" },
  { value: 100000, label: "10만" },
];

const VALUE_CATEGORIES = [
  { value: "coaching", label: "코칭 세션이 큰 도움이 됐어요!", icon: Sparkles },
  { value: "feedback", label: "빠른 피드백 덕분에 방향을 잡았어요!", icon: TrendingUp },
  { value: "insight", label: "통찰력 있는 조언이 문제 해결에 도움됐어요!", icon: Target },
  { value: "execution", label: "실행 가능한 구체적 방법을 제시해줘서 좋았어요!", icon: Gift },
  { value: "custom", label: "직접 입력", icon: Heart },
];

export function TokenGame({ batchId }: { batchId: number }) {
  const { data: tokens, isLoading } = useTokens(batchId);
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [showPendingDialogFromHeader, setShowPendingDialogFromHeader] = useState(false);
  const prevPendingCountRef = useRef(0);
  
  const myStats = useMemo(() => {
    if (!tokens || !user) return { received: 0, given: 0, pending: 0, pendingCount: 0, today: 0, thisWeek: 0, cumulative: 0, latestPendingSender: null as string | null };
    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    
    const userIdentifiers = [
      user.firstName,
      user.email,
      user.id,
      `${user.firstName} ${user.lastName}`.trim()
    ].filter(Boolean);
    
    const isMe = (name: string | null | undefined) => 
      name && userIdentifiers.some(id => id?.toLowerCase() === name.toLowerCase());
    
    let received = 0, given = 0, pending = 0, pendingCount = 0, today = 0, thisWeek = 0, cumulative = 0;
    let latestPendingSender: string | null = null;
    
    tokens.forEach((t: Token) => {
      if (isMe(t.receiverName) || t.toUserId === user.id) {
        if (t.status === "pending") {
          pending += t.amount;
          pendingCount++;
          if (!latestPendingSender) latestPendingSender = t.senderName;
        } else {
          received += t.amount;
          cumulative += t.amount;
          if (new Date(t.createdAt) >= startOfDay) today += t.amount;
          if (new Date(t.createdAt) >= startOfWeek) thisWeek += t.amount;
        }
      }
      if (isMe(t.senderName) || t.fromUserId === user.id) {
        given += t.amount;
      }
    });
    
    return { received, given, pending, pendingCount, today, thisWeek, cumulative, latestPendingSender };
  }, [tokens, user]);

  const leaderboard = useMemo(() => {
    if (!tokens) return [];
    const scores: Record<string, number> = {};
    tokens.forEach((t: Token) => {
      if (t.receiverName) {
        scores[t.receiverName] = (scores[t.receiverName] || 0) + t.amount;
      }
    });
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, amount], index) => ({ name, amount, rank: index + 1 }));
  }, [tokens]);

  useEffect(() => {
    if (myStats.pendingCount > prevPendingCountRef.current && myStats.pendingCount > 0) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
    prevPendingCountRef.current = myStats.pendingCount;
  }, [myStats.pendingCount]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">로딩 중...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8 relative">
        <h2 className="text-3xl font-bold font-display flex items-center justify-center gap-3 text-amber-600">
          <Coins className="w-8 h-8" />
          가치 토큰 GAME
          {myStats.pendingCount > 0 && (
            <button
              onClick={() => {
                setShowNotification(false);
                setShowPendingDialogFromHeader(true);
              }}
              className="relative ml-2"
              data-testid="button-notification"
            >
              <Mail className="w-6 h-6 text-pink-500 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {myStats.pendingCount}
              </span>
            </button>
          )}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">1:1 기여 기반 코칭 토큰 시스템</p>
        
        {showNotification && myStats.pendingCount > 0 && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/50 dark:to-rose-900/50 border border-pink-300 dark:border-pink-700 rounded-xl p-4 shadow-lg max-w-sm">
            <p className="text-pink-700 dark:text-pink-300 font-medium">
              {myStats.latestPendingSender || "누군가"}님이 {user?.firstName}님의 가치를 인정했습니다!
            </p>
            <p className="text-sm text-pink-600 dark:text-pink-400 mt-1">
              지금 바로 확인해보세요!
            </p>
          </div>
        )}
      </div>

      <GameRulesSection />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <ProfileCard user={user} stats={myStats} />
          <PendingReceiveCard 
            pending={myStats.pending} 
            tokens={tokens} 
            user={user} 
            batchId={batchId}
            openFromHeader={showPendingDialogFromHeader}
            onCloseFromHeader={() => setShowPendingDialogFromHeader(false)}
          />
        </div>

        <div className="lg:col-span-5">
          <RecognizeValueForm user={user} batchId={batchId} />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <RealtimeActivityFeed tokens={tokens} />
          <LeaderboardCard leaderboard={leaderboard} userName={user?.firstName} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReceivedStatsCard stats={myStats} />
        <GivenValueCard given={myStats.given} />
      </div>
    </div>
  );
}

function GameRulesSection() {
  return (
    <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200/50 dark:border-amber-800/30">
      <h3 className="text-lg font-bold text-center mb-6 flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
        <Trophy className="w-5 h-5" /> 게임 방법
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600">
            <Gift className="w-6 h-6" />
          </div>
          <h4 className="font-semibold">1. 가치 인정하기</h4>
          <p className="text-sm text-muted-foreground">동료의 가치를 토큰으로 인정합니다. 받은 것의 가치를 숫자로 표현하며 감사를 구체화하는 연습입니다.</p>
        </div>
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="font-semibold">2. 받기 대기</h4>
          <p className="text-sm text-muted-foreground">동료들이 인정해준 나의 가치가 여기 쌓입니다. 아직 내가 받지 않은 것들입니다.</p>
        </div>
        <div className="space-y-2">
          <div className="w-12 h-12 mx-auto rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600">
            <Heart className="w-6 h-6" />
          </div>
          <h4 className="font-semibold">3. 감사하며 받기</h4>
          <p className="text-sm text-muted-foreground">이것이 진짜 받기입니다. 내 가치를 내가 인정하고 감사하며 받아들이는 순간입니다.</p>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg">
        <h4 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" /> 게임의 진짜 의도
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed">
          우리는 주는 데는 익숙하지만, 받는 데는 서툽니다. "이 정도로 돈을 받아도 되나?" 하는 의심이 가격을 낮춥니다.
          이 게임은 <span className="font-semibold text-foreground">받기를 연습</span>하는 공간입니다.
        </p>
      </div>
    </Card>
  );
}

function ProfileCard({ user, stats }: { user: any; stats: any }) {
  const level = Math.floor(stats.cumulative / 1000000) + 1;
  const progress = (stats.cumulative % 1000000) / 1000000 * 100;
  const nextLevelAmount = level * 1000000;
  const remaining = nextLevelAmount - stats.cumulative;

  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-400 to-teal-500 text-white overflow-visible">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 text-4xl">
          <span role="img" aria-label="tree">&#127794;</span>
        </div>
        <h3 className="text-xl font-bold">숙련 코치</h3>
        <p className="text-emerald-100 text-sm">Lv.{level}</p>
        <div className="mt-3">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs mt-1 text-emerald-100">다음 레벨까지 {(remaining / 10000).toFixed(0)}만원</p>
        </div>
        <p className="text-lg font-bold mt-2">{(stats.cumulative / 10000).toFixed(0)}만원</p>
        <p className="text-xs text-emerald-100">받은 가치 (확정됨)</p>
      </div>
      
      <div className="mt-4 p-3 bg-white/10 rounded-lg text-xs space-y-1">
        <p className="font-semibold mb-2 flex items-center gap-1"><Trophy className="w-3 h-3" /> 레벨 구간</p>
        <p>Lv.1: 0~100만원</p>
        <p>Lv.2: 100~300만원</p>
        <p>Lv.3: 300~500만원</p>
        <p>Lv.4: 500~1,000만원</p>
        <p>Lv.5: 1,000만원 달성!</p>
      </div>
    </Card>
  );
}

function PendingReceiveCard({ pending, tokens, user, batchId, openFromHeader, onCloseFromHeader }: { 
  pending: number; 
  tokens: Token[] | undefined; 
  user: any;
  batchId: number;
  openFromHeader?: boolean;
  onCloseFromHeader?: () => void;
}) {
  const acceptToken = useAcceptToken(batchId);
  const { toast } = useToast();
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  
  const isDialogOpen = showPendingDialog || openFromHeader;
  
  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      setShowPendingDialog(false);
      onCloseFromHeader?.();
    }
  };
  
  const userIdentifiers = user ? [
    user.firstName,
    user.email,
    user.id,
    `${user.firstName} ${user.lastName}`.trim()
  ].filter(Boolean) : [];
  
  const isMe = (name: string | null | undefined) => 
    name && userIdentifiers.some(id => id?.toLowerCase() === name.toLowerCase());
  
  const pendingTokens = tokens?.filter(
    (t: Token) => (isMe(t.receiverName) || t.toUserId === user?.id) && t.status === "pending"
  ) || [];

  const handleAccept = (tokenId: number, amount: number) => {
    acceptToken.mutate(tokenId, {
      onSuccess: () => {
        toast({ 
          title: "가치를 받았습니다!", 
          description: `${(amount / 10000).toFixed(0)}만원이 레벨에 반영되었습니다.` 
        });
      },
    });
  };

  const latestToken = pendingTokens[0];

  return (
    <>
      <Card 
        className="p-6 bg-gradient-to-br from-pink-400 to-rose-500 text-white overflow-visible"
        data-testid="card-pending-receive"
      >
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="w-5 h-5" />
            <span className="font-semibold">도착한 토큰</span>
            {pendingTokens.length > 0 && (
              <span className="bg-white/30 rounded-full px-2 py-0.5 text-xs">{pendingTokens.length}통</span>
            )}
          </div>
          <p className="text-4xl font-bold">{(pending / 10000).toFixed(0)}만원</p>
          <p className="text-pink-100 text-sm mt-1">아직 확정되지 않은 가치</p>
          
          {latestToken && (
            <div className="mt-4 p-3 bg-white/20 rounded-lg text-left">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{latestToken.senderName}</span>
                <span className="text-pink-100">님이</span>
                <span className="font-bold">{(latestToken.amount / 10000).toFixed(0)}만원</span>
              </div>
              <Button
                onClick={() => handleAccept(latestToken.id, latestToken.amount)}
                disabled={acceptToken.isPending}
                className="mt-3 w-full bg-white text-pink-600 hover:bg-pink-50"
                data-testid="button-quick-accept"
              >
                <Heart className="w-4 h-4 mr-1" />
                감사히 받기
              </Button>
            </div>
          )}
          
          {pendingTokens.length > 1 && (
            <Button
              onClick={() => setShowPendingDialog(true)}
              variant="ghost"
              className="mt-2 text-white hover:bg-white/20"
              data-testid="button-check-pending"
            >
              +{pendingTokens.length - 1}개 더 보기
            </Button>
          )}
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-600">
              <Gift className="w-5 h-5" />
              받은 가치 리스트
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            아래 가치들을 확인하고 "받기"를 눌러 레벨에 반영하세요.
          </p>
          <div className="py-4 space-y-3 max-h-[400px] overflow-y-auto">
            {pendingTokens.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">대기 중인 가치가 없습니다</p>
            ) : (
              pendingTokens.map((token: Token) => (
                <div 
                  key={token.id} 
                  className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-lg border border-pink-200/50 dark:border-pink-800/30"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                      <Mail className="w-4 h-4" />
                      <span className="font-semibold">{token.senderName || "익명"}</span>
                      <span className="text-muted-foreground">님이</span>
                      <span className="font-bold text-lg">{(token.amount / 10000).toFixed(0)}만원</span>
                      <span className="text-muted-foreground">을 보냈습니다</span>
                    </div>
                    {token.message && (
                      <p className="text-foreground text-sm bg-white/50 dark:bg-black/20 p-3 rounded-lg italic">
                        "{token.message}"
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(token.createdAt), "MM/dd HH:mm")}
                      </span>
                      <Button
                        onClick={() => handleAccept(token.id, token.amount)}
                        disabled={acceptToken.isPending}
                        className="bg-pink-500 hover:bg-pink-600 text-white"
                        data-testid={`button-accept-${token.id}`}
                      >
                        <Heart className="w-4 h-4 mr-1" />
                        감사히 받기
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecognizeValueForm({ user, batchId }: { user: any; batchId: number }) {
  const { data: batchMembers, isLoading: membersLoading } = useBatchMembers(batchId);
  const createToken = useCreateToken(batchId);
  const { toast } = useToast();
  
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const filteredMembers = batchMembers?.filter(member => {
    if (!user) return true;
    const memberNameLower = member.name?.toLowerCase();
    const memberEmailLower = member.email?.toLowerCase();
    const userFirstNameLower = user.firstName?.toLowerCase();
    const userEmailLower = user.email?.toLowerCase();
    const userFullNameLower = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
    
    if (memberNameLower === userFirstNameLower) return false;
    if (memberNameLower === userEmailLower) return false;
    if (memberNameLower === userFullNameLower) return false;
    if (memberEmailLower && memberEmailLower === userEmailLower) return false;
    
    return true;
  }) || [];

  const handleSubmit = () => {
    const finalAmount = amount || Number(customAmount) * 10000;
    if (!recipient || !finalAmount || !category) {
      toast({ title: "입력 확인", description: "받는 사람, 금액, 가치 카테고리를 모두 선택해주세요.", variant: "destructive" });
      return;
    }

    const message = category === "custom" ? customMessage : VALUE_CATEGORIES.find(c => c.value === category)?.label || "";
    
    createToken.mutate({
      fromUserId: user?.id || "",
      toUserId: recipient,
      receiverName: recipient,
      senderName: user?.firstName || user?.email || "Unknown",
      amount: finalAmount,
      category,
      message,
      status: "pending",
    }, {
      onSuccess: () => {
        toast({ title: "가치 인정 완료!", description: `${recipient}님에게 ${(finalAmount / 10000).toFixed(0)}만원 가치를 인정했습니다.` });
        setRecipient("");
        setAmount(null);
        setCustomAmount("");
        setCategory("");
        setCustomMessage("");
      },
    });
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-amber-600">
        <Gift className="w-5 h-5" /> 가치 인정하기
      </h3>
      
      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium mb-2 block">누구의 가치를 인정하시나요?</Label>
          <Select value={recipient} onValueChange={setRecipient}>
            <SelectTrigger data-testid="select-recipient" className="bg-muted/30">
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {membersLoading ? (
                <div className="p-2 text-sm text-muted-foreground">로딩 중...</div>
              ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member) => (
                  <SelectItem key={member.id} value={member.name}>
                    {member.name} {member.email ? `(${member.email})` : ""}
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">기수관리에서 멤버를 추가하세요</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block">금액 선택 (만원)</Label>
          <div className="flex flex-wrap gap-2">
            {AMOUNT_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={amount === opt.value ? "default" : "outline"}
                onClick={() => { setAmount(opt.value); setCustomAmount(""); }}
                className={amount === opt.value ? "bg-amber-500 hover:bg-amber-600" : ""}
                data-testid={`button-amount-${opt.value}`}
              >
                {opt.label}
              </Button>
            ))}
          </div>
          <div className="mt-3">
            <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Coins className="w-3 h-3" /> 또는 직접 입력 (1건당 최대 10만원)
            </Label>
            <Input
              type="number"
              placeholder="금액 입력 (예: 7)"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
              className="bg-muted/30"
              max={10}
              data-testid="input-custom-amount"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium mb-3 block flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-500" /> 어떤 가치였나요? (선택)
          </Label>
          <RadioGroup value={category} onValueChange={setCategory} className="space-y-3">
            {VALUE_CATEGORIES.map((cat) => (
              <div key={cat.value} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                <RadioGroupItem value={cat.value} id={cat.value} data-testid={`radio-category-${cat.value}`} />
                <Label htmlFor={cat.value} className="flex-1 cursor-pointer flex items-center gap-2">
                  <cat.icon className="w-4 h-4 text-amber-500" />
                  {cat.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          {category === "custom" && (
            <div className="mt-3">
              <Textarea
                placeholder="구체적으로 어떤 가치였는지 적어주세요..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="min-h-[100px] bg-muted/30"
                data-testid="textarea-custom-message"
              />
            </div>
          )}
        </div>

        <Button 
          onClick={handleSubmit}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white py-6 text-lg"
          disabled={createToken.isPending}
          data-testid="button-send-token"
        >
          <Coins className="w-5 h-5 mr-2" />
          {createToken.isPending ? "전송 중..." : "가치 인정하기"}
        </Button>
      </div>
    </Card>
  );
}

function RealtimeActivityFeed({ tokens }: { tokens: Token[] | undefined }) {
  const recentTokens = tokens?.slice(0, 5) || [];

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-blue-600">
        <Sparkles className="w-4 h-4" /> 실시간 활동
      </h3>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {recentTokens.map((token: Token) => (
            <div key={token.id} className="p-2 bg-muted/30 rounded-lg text-xs">
              <div className="flex justify-between items-start">
                <span>
                  <span className="font-semibold">{token.senderName}</span>
                  <span className="text-muted-foreground">: {token.receiverName}님께 받은 {(token.amount / 10000).toFixed(0)}만원 우와!</span>
                </span>
              </div>
              <p className="text-muted-foreground mt-1">{format(new Date(token.createdAt), "HH:mm")}</p>
            </div>
          ))}
          {recentTokens.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">아직 활동이 없습니다</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

function LeaderboardCard({ leaderboard, userName }: { leaderboard: { name: string; amount: number; rank: number }[]; userName?: string | null }) {
  const [tab, setTab] = useState<"weekly" | "monthly" | "cumulative">("cumulative");

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-amber-600">
        <Trophy className="w-4 h-4" /> 기여 순위
      </h3>
      <div className="flex gap-1 mb-3">
        {[
          { key: "weekly", label: "주간" },
          { key: "monthly", label: "월간" },
          { key: "cumulative", label: "누적" },
        ].map((t) => (
          <Button
            key={t.key}
            size="sm"
            variant={tab === t.key ? "default" : "ghost"}
            onClick={() => setTab(t.key as any)}
            className={tab === t.key ? "bg-amber-500 hover:bg-amber-600 text-xs" : "text-xs"}
            data-testid={`button-tab-${t.key}`}
          >
            {t.label}
          </Button>
        ))}
      </div>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <div 
              key={entry.name} 
              className={`flex items-center justify-between p-2 rounded-lg ${
                entry.name === userName ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  entry.rank === 1 ? "bg-amber-400 text-white" :
                  entry.rank === 2 ? "bg-slate-300 text-slate-700" :
                  entry.rank === 3 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {entry.rank <= 3 ? <Trophy className="w-3 h-3" /> : entry.rank}
                </span>
                <span className="font-medium text-sm">{entry.name} {entry.name === userName && "(나)"}</span>
              </div>
              <span className="font-mono font-bold text-amber-600 text-sm">{(entry.amount / 10000).toFixed(0)}만원</span>
            </div>
          ))}
          {leaderboard.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">아직 기록이 없습니다</p>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

function ReceivedStatsCard({ stats }: { stats: any }) {
  const dailyGoal = 100000;
  const weeklyGoal = 700000;
  const dailyProgress = Math.min((stats.today / dailyGoal) * 100, 100);
  const weeklyProgress = Math.min((stats.thisWeek / weeklyGoal) * 100, 100);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-600">
        <TrendingUp className="w-5 h-5" /> 받은 가치 통계
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> 오늘</p>
          <p className="text-2xl font-bold text-blue-600">{(stats.today / 10000).toFixed(0)}만</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Target className="w-3 h-3" /> 이번주</p>
          <p className="text-2xl font-bold text-emerald-600">{(stats.thisWeek / 10000).toFixed(0)}만</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Trophy className="w-3 h-3" /> 시즌 누적</p>
          <p className="text-2xl font-bold text-amber-600">{(stats.cumulative / 10000).toFixed(0)}만</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2 text-sm"><Target className="w-4 h-4 text-emerald-500" /> 이번주 미션</h4>
        <div className="p-3 bg-muted/20 rounded-lg text-xs text-muted-foreground mb-3">
          <p>기준: 일평균 10만원 x 7일 = 주 70만원 | 주 70만원 x 16주 = 시즌 1,120만원</p>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> 일일 최소 목표: 10만원</span>
            <span className={dailyProgress >= 100 ? "text-emerald-600" : "text-amber-600"}>
              {dailyProgress >= 100 ? "달성" : "미달성"}
            </span>
          </div>
          <Progress value={dailyProgress} className="h-2" />
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1"><Trophy className="w-3 h-3" /> 주간 최소 목표: 70만원</span>
            <span className={weeklyProgress >= 100 ? "text-emerald-600" : "text-amber-600"}>
              {weeklyProgress >= 100 ? "달성" : "미달성"}
            </span>
          </div>
          <Progress value={weeklyProgress} className="h-2" />
        </div>
      </div>
    </Card>
  );
}

function GivenValueCard({ given }: { given: number }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-rose-500">
        <Heart className="w-5 h-5" /> 인정한 가치
      </h3>
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm mb-2">총 인정한 가치</p>
        <p className="text-5xl font-bold text-rose-500">{(given / 10000).toFixed(0)}만</p>
      </div>
    </Card>
  );
}
