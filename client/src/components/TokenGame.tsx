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
import { Coins, Trophy, Gift, Target, Heart, Sparkles, Clock, TrendingUp, Mail, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect, useRef, Component, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";
import type { Token } from "@shared/schema";

// Safe date formatting to prevent crashes on invalid/null dates
function safeFormatDate(dateValue: string | Date | null | undefined, formatStr: string, fallback: string = "-"): string {
  if (!dateValue) return fallback;
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    if (!isValid(date)) return fallback;
    return format(date, formatStr);
  } catch {
    return fallback;
  }
}

// Centralized token validation and normalization helper
function isValidToken(token: Token | null | undefined): token is Token {
  if (!token) return false;
  const id = Number(token.id);
  if (!Number.isFinite(id) || id <= 0) return false;
  return true;
}

function getTokenAmount(token: Token): number {
  const amount = Number(token.amount);
  return Number.isFinite(amount) ? amount : 0;
}

function formatTokenAmount(amount: number): string {
  const numAmount = Number.isFinite(amount) ? amount : 0;
  return (numAmount / 10000).toFixed(0);
}

// Error boundary to prevent white screen crashes
class TokenGameErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("🚨 TokenGame Error Boundary Caught:", {
      error: error,
      errorMessage: error.message,
      errorStack: error.stack,
      errorInfo: errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });

    // Log to help debug which data caused the crash
    console.error("This error is likely caused by null/undefined data in tokens or batch members");
    console.error("Check the console for specific errors in isTokenForMe or myStats calculations");
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <h3 className="font-bold mb-2">가치 인정 시스템 오류</h3>
          <p className="text-sm text-muted-foreground mb-4">
            데이터를 불러오는 중 문제가 발생했습니다.
          </p>
          {this.state.error && (
            <details className="text-left mb-4 p-3 bg-muted rounded text-xs">
              <summary className="cursor-pointer font-semibold mb-2">오류 상세 (개발자용)</summary>
              <pre className="whitespace-pre-wrap break-all">
                {this.state.error.message}
                {"\n\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <Button onClick={() => window.location.reload()}>
            새로고침
          </Button>
        </Card>
      );
    }
    return this.props.children;
  }
}

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

// Main export wrapped with error boundary
export function TokenGame({ batchId }: { batchId: number }) {
  return (
    <TokenGameErrorBoundary>
      <TokenGameInner batchId={batchId} />
    </TokenGameErrorBoundary>
  );
}

function TokenGameInner({ batchId }: { batchId: number }) {
  const { data: tokens, isLoading, isError, error } = useTokens(batchId);
  const { data: batchMembers } = useBatchMembers(batchId);
  const { user } = useAuth();
  const [showNotification, setShowNotification] = useState(false);
  const [showPendingDialogFromHeader, setShowPendingDialogFromHeader] = useState(false);
  const prevPendingCountRef = useRef(0);
  
  // Find batch member names that match the current user's email
  const myBatchMemberNames = useMemo(() => {
    if (!batchMembers || !user?.email) return [];
    try {
      const userEmail = user.email.toLowerCase();
      return batchMembers
        .filter(m => {
          // Safe email comparison
          const memberEmail = m.email;
          if (!memberEmail || typeof memberEmail !== 'string') return false;
          return memberEmail.toLowerCase() === userEmail && m.name;
        })
        .map(m => {
          const name = m.name;
          if (!name || typeof name !== 'string') return '';
          return name.toLowerCase();
        })
        .filter(name => name.length > 0);
    } catch (error) {
      console.error('Error calculating myBatchMemberNames:', error);
      return [];
    }
  }, [batchMembers, user?.email]);
  
  const myStats = useMemo(() => {
    if (!tokens || !user) return { received: 0, given: 0, pending: 0, pendingCount: 0, today: 0, thisWeek: 0, cumulative: 0, latestPendingSender: null as string | null };

    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());

      const userEmail = user.email?.toLowerCase();
      const userIdentifiers = [
        user.firstName,
        user.email,
        user.id,
        `${user.firstName || ''} ${user.lastName || ''}`.trim()
      ].filter(Boolean).map(id => {
        if (typeof id === 'string') return id.toLowerCase();
        return String(id).toLowerCase();
      });

      // Check if token is for the current user by name, email, or batch member name
      const isTokenForMe = (t: Token) => {
        try {
          // Check receiverEmail matches user's email (most reliable)
          const receiverEmail = t.receiverEmail;
          if (receiverEmail && typeof receiverEmail === 'string' && userEmail) {
            if (receiverEmail.toLowerCase() === userEmail) {
              return true;
            }
          }

          // Check toUserId matches user id
          if (t.toUserId === user.id) {
            return true;
          }

          // Check receiverName matches any batch member with the same email as user
          const receiverName = t.receiverName;
          if (receiverName && typeof receiverName === 'string') {
            const receiverNameLower = receiverName.toLowerCase();

            // Match with batch member names
            if (myBatchMemberNames.includes(receiverNameLower)) {
              return true;
            }

            // Match with user identifiers
            if (userIdentifiers.some(id => id === receiverNameLower)) {
              return true;
            }
          }

          return false;
        } catch (error) {
          console.error('Error in isTokenForMe:', error, t);
          return false;
        }
      };
    
      const isMe = (name: string | null | undefined) => {
        try {
          if (!name || typeof name !== 'string') return false;
          const nameLower = name.toLowerCase();
          return userIdentifiers.some(id => id === nameLower);
        } catch (error) {
          console.error('Error in isMe:', error, name);
          return false;
        }
      };

      let received = 0, given = 0, pending = 0, pendingCount = 0, today = 0, thisWeek = 0, cumulative = 0;
      let latestPendingSender: string | null = null;

      tokens.forEach((t: Token) => {
        try {
          // Skip invalid tokens using centralized helper
          if (!isValidToken(t)) {
            console.warn('Skipping invalid token in myStats:', t);
            return;
          }
          const amount = getTokenAmount(t);
          if (isTokenForMe(t)) {
            if (t.status === "pending") {
              pending += amount;
              pendingCount++;
              if (!latestPendingSender && t.senderName) {
                latestPendingSender = t.senderName;
              }
            } else {
              received += amount;
              cumulative += amount;
              try {
                const createdAt = new Date(t.createdAt);
                if (!isNaN(createdAt.getTime())) {
                  if (createdAt >= startOfDay) today += amount;
                  if (createdAt >= startOfWeek) thisWeek += amount;
                }
              } catch (dateError) {
                console.error('Error parsing token date:', dateError, t.createdAt);
              }
            }
          }
          if (isMe(t.senderName) || t.fromUserId === user.id) {
            given += amount;
          }
        } catch (tokenError) {
          console.error('Error processing token:', tokenError, t);
        }
      });

      return { received, given, pending, pendingCount, today, thisWeek, cumulative, latestPendingSender };
    } catch (error) {
      console.error('Error calculating myStats:', error);
      return { received: 0, given: 0, pending: 0, pendingCount: 0, today: 0, thisWeek: 0, cumulative: 0, latestPendingSender: null };
    }
  }, [tokens, user, myBatchMemberNames]);

  const leaderboard = useMemo(() => {
    if (!tokens) return [];
    try {
      const scores: Record<string, number> = {};
      tokens.filter(isValidToken).forEach((t: Token) => {
        try {
          const receiverName = t.receiverName;
          if (receiverName && typeof receiverName === 'string') {
            const trimmedName = receiverName.trim();
            if (trimmedName.length > 0) {
              const amount = getTokenAmount(t);
              scores[trimmedName] = (scores[trimmedName] || 0) + amount;
            }
          }
        } catch (tokenError) {
          console.error('Error processing token in leaderboard:', tokenError, t);
        }
      });
      return Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, amount], index) => ({ name, amount, rank: index + 1 }));
    } catch (error) {
      console.error('Error calculating leaderboard:', error);
      return [];
    }
  }, [tokens]);

  useEffect(() => {
    if (myStats.pendingCount > prevPendingCountRef.current && myStats.pendingCount > 0) {
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    }
    prevPendingCountRef.current = myStats.pendingCount;
  }, [myStats.pendingCount]);

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">로딩 중...</div>;

  if (isError) return (
    <Card className="p-8 text-center">
      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
      <h3 className="font-bold mb-2">토큰 데이터를 불러올 수 없습니다</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {(error as any)?.message || "서버와의 연결에 문제가 발생했습니다."}
      </p>
      <Button onClick={() => window.location.reload()}>
        새로고침
      </Button>
    </Card>
  );

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
        
        <div 
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/50 dark:to-rose-900/50 border border-pink-300 dark:border-pink-700 rounded-xl p-4 shadow-lg max-w-sm transition-opacity duration-200 ${showNotification && myStats.pendingCount > 0 ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        >
          <p className="text-pink-700 dark:text-pink-300 font-medium">
            {myStats.latestPendingSender || "누군가"}님이 {user?.firstName}님의 가치를 인정했습니다!
          </p>
          <p className="text-sm text-pink-600 dark:text-pink-400 mt-1">
            지금 바로 확인해보세요!
          </p>
        </div>
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
            myBatchMemberNames={myBatchMemberNames}
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
  const safeStats = stats || { cumulative: 0 };
  const cumulative = safeStats.cumulative || 0;
  const level = Math.floor(cumulative / 1000000) + 1;
  const progress = (cumulative % 1000000) / 1000000 * 100;
  const nextLevelAmount = level * 1000000;
  const remaining = nextLevelAmount - cumulative;

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
        <p className="text-lg font-bold mt-2">{(cumulative / 10000).toFixed(0)}만원</p>
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

function PendingReceiveCard({ pending, tokens, user, batchId, myBatchMemberNames, openFromHeader, onCloseFromHeader }: {
  pending: number;
  tokens: Token[] | undefined;
  user: any;
  batchId: number;
  myBatchMemberNames: string[];
  openFromHeader?: boolean;
  onCloseFromHeader?: () => void;
}) {
  const acceptToken = useAcceptToken(batchId);
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  // Track tokens being accepted to hide them from UI immediately
  const [acceptingTokenIds, setAcceptingTokenIds] = useState<Set<number>>(new Set());
  // Track dialog close request to defer until safe
  const [pendingClose, setPendingClose] = useState(false);

  // Combine both open states - dialog should be open if either is true
  const dialogOpen = (internalOpen || (openFromHeader ?? false)) && !pendingClose;

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      // Use requestAnimationFrame to defer close until DOM is stable
      requestAnimationFrame(() => {
        setInternalOpen(false);
        if (onCloseFromHeader) {
          onCloseFromHeader();
        }
      });
    } else {
      setInternalOpen(true);
      setPendingClose(false);
    }
  };
  
  const userEmail = user?.email?.toLowerCase();
  const userIdentifiers = user ? [
    user.firstName,
    user.email,
    user.id,
    `${user.firstName || ''} ${user.lastName || ''}`.trim()
  ].filter(Boolean) : [];
  
  // Check if token is for the current user by name, email, or batch member name
  const isTokenForMe = (t: Token) => {
    try {
      // Check receiverEmail matches user's email (most reliable)
      const receiverEmail = t.receiverEmail;
      if (receiverEmail && typeof receiverEmail === 'string' && userEmail) {
        if (receiverEmail.toLowerCase() === userEmail) {
          return true;
        }
      }

      // Check toUserId matches user id
      if (t.toUserId === user?.id) {
        return true;
      }

      // Check receiverName matches any batch member with the same email as user
      const receiverName = t.receiverName;
      if (receiverName && typeof receiverName === 'string') {
        const receiverNameLower = receiverName.toLowerCase();

        // Match with batch member names
        if (myBatchMemberNames.includes(receiverNameLower)) {
          return true;
        }

        // Match with user identifiers
        if (userIdentifiers.some(id => {
          if (!id || typeof id !== 'string') return false;
          return id.toLowerCase() === receiverNameLower;
        })) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error in isTokenForMe (PendingReceiveCard):', error, t);
      return false;
    }
  };
  
  // Filter out tokens that are currently being accepted (optimistic UI)
  const pendingTokens = tokens?.filter(
    (t: Token) => {
      // Skip tokens without valid id using centralized helper
      if (!isValidToken(t)) {
        console.warn('Skipping invalid token:', t);
        return false;
      }
      // Skip tokens currently being accepted (normalize ID to number for comparison)
      const tokenIdNum = Number(t.id);
      if (acceptingTokenIds.has(tokenIdNum)) {
        return false;
      }
      return isTokenForMe(t) && t.status === "pending";
    }
  ) || [];

  const handleAccept = (tokenId: number | string, amount: number) => {
    const normalizedAmount = Number.isFinite(amount) ? amount : 0;
    const normalizedTokenId = Number(tokenId);
    
    // Validate token ID before proceeding
    if (!Number.isFinite(normalizedTokenId) || normalizedTokenId <= 0) {
      console.error('Invalid token ID:', tokenId);
      toast({
        title: "토큰 수락 실패",
        description: "올바르지 않은 토큰입니다.",
        variant: "destructive"
      });
      return;
    }
    
    // Optimistically hide this token from UI immediately
    setAcceptingTokenIds(prev => {
      const next = new Set(Array.from(prev));
      next.add(normalizedTokenId);
      return next;
    });
    
    // Check if this will be the last token (before we hide it)
    const willBeEmpty = pendingTokens.length <= 1;
    
    // If this is the last token, schedule dialog close after a delay
    if (willBeEmpty) {
      setPendingClose(true);
      // Use multiple frames to ensure DOM is stable before closing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setInternalOpen(false);
          if (onCloseFromHeader) {
            onCloseFromHeader();
          }
          setPendingClose(false);
        });
      });
    }
    
    acceptToken.mutate(normalizedTokenId, {
      onSuccess: () => {
        toast({
          title: "가치를 받았습니다!",
          description: `${formatTokenAmount(normalizedAmount)}만원이 레벨에 반영되었습니다.`
        });
        // Remove from accepting set after mutation completes
        setAcceptingTokenIds(prev => {
          const next = new Set(Array.from(prev));
          next.delete(normalizedTokenId);
          return next;
        });
      },
      onError: (error: any) => {
        console.error("Token accept error:", error);
        // Restore token visibility on error
        setAcceptingTokenIds(prev => {
          const next = new Set(Array.from(prev));
          next.delete(normalizedTokenId);
          return next;
        });
        // Reopen dialog if we prematurely closed it
        if (willBeEmpty) {
          setInternalOpen(true);
          setPendingClose(false);
        }
        toast({
          title: "토큰 수락 실패",
          description: error?.message || "토큰을 수락하는 중 오류가 발생했습니다.",
          variant: "destructive"
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
          
          {latestToken && isValidToken(latestToken) && (
            <div className="mt-4 p-3 bg-white/20 rounded-lg text-left">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{latestToken.senderName || "익명"}</span>
                <span className="text-pink-100">님이</span>
                <span className="font-bold">{formatTokenAmount(getTokenAmount(latestToken))}만원</span>
              </div>
              <Button
                onClick={() => handleAccept(latestToken.id, getTokenAmount(latestToken))}
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
              onClick={() => setInternalOpen(true)}
              variant="ghost"
              className="mt-2 text-white hover:bg-white/20"
              data-testid="button-check-pending"
            >
              +{pendingTokens.length - 1}개 더 보기
            </Button>
          )}
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-md" key={`dialog-content-${pendingTokens.length}`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-pink-600">
              <Gift className="w-5 h-5" />
              받은 가치 리스트
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            아래 가치들을 확인하고 "받기"를 눌러 레벨에 반영하세요.
          </p>
          <div className="py-4 space-y-3 max-h-[400px] overflow-y-auto" key={`token-list-${pendingTokens.map(t => t.id).join('-')}`}>
            {pendingTokens.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">대기 중인 가치가 없습니다</p>
            ) : (
              pendingTokens.filter(isValidToken).map((token: Token, idx: number) => (
                <div 
                  key={`pending-${token.id}-${idx}`} 
                  className="p-4 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 rounded-lg border border-pink-200/50 dark:border-pink-800/30"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400">
                      <Mail className="w-4 h-4" />
                      <span className="font-semibold">{token.senderName || "익명"}</span>
                      <span className="text-muted-foreground">님이</span>
                      <span className="font-bold text-lg">{formatTokenAmount(getTokenAmount(token))}만원</span>
                      <span className="text-muted-foreground">을 보냈습니다</span>
                    </div>
                    {token.message && (
                      <p className="text-foreground text-sm bg-white/50 dark:bg-black/20 p-3 rounded-lg italic">
                        "{token.message}"
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {safeFormatDate(token.createdAt, "MM/dd HH:mm")}
                      </span>
                      <Button
                        onClick={() => handleAccept(token.id, getTokenAmount(token))}
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
    // Must have a valid name for SelectItem value (non-empty after trimming)
    if (!member.name || typeof member.name !== 'string' || member.name.trim() === "") return false;

    // Must have either email or valid id
    if (!member.email && !member.id) return false;

    if (!user) return true;
    const memberNameLower = member.name?.toLowerCase().trim();
    const memberEmailLower = member.email?.toLowerCase().trim();
    const userFirstNameLower = user.firstName?.toLowerCase().trim();
    const userEmailLower = user.email?.toLowerCase().trim();
    const userFullNameLower = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();

    if (memberNameLower === userFirstNameLower) return false;
    if (memberNameLower === userEmailLower) return false;
    if (memberNameLower === userFullNameLower) return false;
    if (memberEmailLower && memberEmailLower === userEmailLower) return false;

    return true;
  }) || [];

  const handleSubmit = () => {
    const customNum = Number(customAmount);
    const finalAmount = amount || (Number.isFinite(customNum) ? customNum * 10000 : 0);
    
    if (!recipient || !Number.isFinite(finalAmount) || finalAmount <= 0 || !category) {
      toast({ title: "입력 확인", description: "받는 사람, 올바른 금액, 가치 카테고리를 모두 선택해주세요.", variant: "destructive" });
      return;
    }

    const message = category === "custom" ? customMessage : VALUE_CATEGORIES.find(c => c.value === category)?.label || "";

    // Find the selected member by ID to get their name and email
    const selectedMember = batchMembers?.find(m => String(m.id) === recipient);

    // Validate selectedMember exists and has required fields
    if (!selectedMember) {
      toast({
        title: "오류",
        description: "선택한 멤버를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.",
        variant: "destructive"
      });
      return;
    }

    const receiverName = selectedMember.name?.trim();
    if (!receiverName) {
      toast({
        title: "오류",
        description: "선택한 멤버의 이름이 올바르지 않습니다. 기수 관리자에게 문의해주세요.",
        variant: "destructive"
      });
      return;
    }

    const receiverEmail = selectedMember.email?.trim() || null;

    createToken.mutate({
      fromUserId: user?.id || "",
      toUserId: recipient,
      receiverName: receiverName,
      receiverEmail: receiverEmail,
      senderName: user?.firstName || user?.email || "Unknown",
      amount: finalAmount,
      category,
      message,
      status: "pending",
    }, {
      onSuccess: () => {
        toast({ title: "가치 인정 완료!", description: `${receiverName}님에게 ${(finalAmount / 10000).toFixed(0)}만원 가치를 인정했습니다.` });
        setRecipient("");
        setAmount(null);
        setCustomAmount("");
        setCategory("");
        setCustomMessage("");
      },
      onError: (error: any) => {
        console.error("Token creation error:", error);
        toast({
          title: "가치 인정 실패",
          description: error?.message || "토큰 발행 중 오류가 발생했습니다. 다시 시도해주세요.",
          variant: "destructive"
        });
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
                  <SelectItem key={member.id} value={String(member.id)}>
                    {member.name || "이름 없음"} {member.email ? `(${member.email})` : ""}
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
  // Safely filter and slice tokens using centralized helper
  const recentTokens = (tokens ?? []).filter(isValidToken).slice(0, 5);

  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold flex items-center gap-2 mb-3 text-blue-600">
        <Sparkles className="w-4 h-4" /> 실시간 활동
      </h3>
      <ScrollArea className="h-[200px]">
        <div className="space-y-2">
          {recentTokens.map((token: Token, index: number) => {
            const senderName = token.senderName && typeof token.senderName === 'string'
              ? token.senderName.trim() || "익명"
              : "익명";
            const receiverName = token.receiverName && typeof token.receiverName === 'string'
              ? token.receiverName.trim() || "멤버"
              : "멤버";
            const amount = getTokenAmount(token);
            const stableKey = `token-${token.id}-${index}`;

            return (
              <div key={stableKey} className="p-2 bg-muted/30 rounded-lg text-xs">
                <div className="flex justify-between items-start">
                  <span>
                    <span className="font-semibold">{senderName}</span>
                    <span className="text-muted-foreground">: {receiverName}님께 받은 {formatTokenAmount(amount)}만원 우와!</span>
                  </span>
                </div>
                <p className="text-muted-foreground mt-1">{safeFormatDate(token.createdAt, "HH:mm")}</p>
              </div>
            );
          })}
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
          {leaderboard.map((entry, index) => (
            <div 
              key={`rank-${entry.rank}-${entry.name}-${index}`} 
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
  const safeStats = stats || { today: 0, thisWeek: 0, cumulative: 0 };
  const dailyGoal = 100000;
  const weeklyGoal = 700000;
  const dailyProgress = Math.min(((safeStats.today || 0) / dailyGoal) * 100, 100);
  const weeklyProgress = Math.min(((safeStats.thisWeek || 0) / weeklyGoal) * 100, 100);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-blue-600">
        <TrendingUp className="w-5 h-5" /> 받은 가치 통계
      </h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> 오늘</p>
          <p className="text-2xl font-bold text-blue-600">{((safeStats.today || 0) / 10000).toFixed(0)}만</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Target className="w-3 h-3" /> 이번주</p>
          <p className="text-2xl font-bold text-emerald-600">{((safeStats.thisWeek || 0) / 10000).toFixed(0)}만</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1 flex items-center justify-center gap-1"><Trophy className="w-3 h-3" /> 시즌 누적</p>
          <p className="text-2xl font-bold text-amber-600">{((safeStats.cumulative || 0) / 10000).toFixed(0)}만</p>
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
