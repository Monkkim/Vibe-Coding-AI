import { useAuth } from "@/hooks/use-auth";
import { useFolders, useCreateFolder, useDeleteFolder, useBatchMembers, useDeleteBatchMember, useMemberJournals, useUpdateBatchMember } from "@/hooks/use-folders";
import { useCreateJournal, useUpdateJournal } from "@/hooks/use-journals";
import { useBatch } from "@/contexts/BatchContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TokenGame } from "@/components/TokenGame";
import { RichTextEditor } from "@/components/RichTextEditor";
import { useCrackTime } from "@/hooks/use-ai-chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  FolderOpen,
  LogOut, 
  Sparkles, 
  Map as MapIcon, 
  ChevronRight,
  Gem,
  Plus,
  Trash2,
  Users,
  ArrowLeft,
  BookOpen,
  Sun,
  Settings,
  Download,
  FileText,
  RefreshCw,
  Pencil,
  X,
  Share2,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export function Dashboard() {
  const { user, logout } = useAuth();
  const { selectedBatch, clearBatch } = useBatch();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"crack" | "token" | "batch">("crack");

  useEffect(() => {
    if (!selectedBatch) {
      navigate("/batches");
    }
  }, [selectedBatch, navigate]);

  if (!selectedBatch) {
    return null;
  }

  const handleChangeBatch = () => {
    clearBatch();
    navigate("/batches");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-amber-100">
      {/* Sidebar */}
      <Sidebar 
        setActiveTab={setActiveTab} 
        activeTab={activeTab} 
        onLogout={() => logout()} 
        user={user}
        batchName={selectedBatch.name}
        onChangeBatch={handleChangeBatch}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <header className="flex justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Hello, {user?.firstName || "Viber"}
            </h1>
            <p className="text-muted-foreground">
              <span className="text-amber-600 font-medium">{selectedBatch.name}</span> 에서 한계를 돌파할 준비가 되셨나요?
            </p>
          </div>
          <ThemeToggle />
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-7xl mx-auto"
          >
            {activeTab === "crack" && <CrackTimeSection />}
            {activeTab === "token" && <TokenGame batchId={selectedBatch.id} />}
            {activeTab === "batch" && <BatchManager selectedBatchId={selectedBatch.id} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function Sidebar({ 
  setActiveTab, 
  activeTab, 
  onLogout,
  user,
  batchName,
  onChangeBatch
}: { 
  setActiveTab: (v: "crack" | "token" | "batch") => void, 
  activeTab: string,
  onLogout: () => void,
  user: any,
  batchName: string,
  onChangeBatch: () => void
}) {
  return (
    <aside className="w-64 glass border-r border-border hidden md:flex flex-col h-full z-10">
      <div className="p-6">
        <div className="flex items-center gap-2 font-display font-bold text-xl text-primary mb-4">
          <Gem className="w-6 h-6" />
          AGround
        </div>
        
        <button
          onClick={onChangeBatch}
          className="w-full flex items-center gap-2 p-3 rounded-lg bg-amber-100/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 mb-6 hover-elevate"
          data-testid="button-change-batch"
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{batchName}</span>
          <ArrowLeft className="w-3 h-3 ml-auto text-amber-600" />
        </button>

        <nav className="space-y-2">
          <SidebarItem 
            icon={<Sparkles className="w-4 h-4" />} 
            label="Crack Time" 
            active={activeTab === "crack"}
            onClick={() => setActiveTab("crack")}
          />
          <SidebarItem 
            icon={<Gem className="w-4 h-4" />} 
            label="Token Game" 
            active={activeTab === "token"}
            onClick={() => setActiveTab("token")}
          />
          <SidebarItem 
            icon={<Users className="w-4 h-4" />} 
            label="멤버 관리" 
            active={activeTab === "batch"}
            onClick={() => setActiveTab("batch")}
          />
        </nav>
      </div>

      <div className="flex-1" />

      <div className="p-6 mt-auto border-t border-border/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs">
            {user?.firstName?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            asChild
            data-testid="button-settings"
          >
            <Link href="/settings">
              <Settings className="w-4 h-4 mr-2" /> 설정
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" /> 로그아웃
          </Button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`w-full justify-start rounded-xl transition-all duration-200 ${
        active 
          ? "bg-primary/10 text-primary font-semibold shadow-sm" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <span className={`mr-2 ${active ? "text-primary" : ""}`}>{icon}</span>
      {label}
      {active && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
    </Button>
  );
}

function CrackTimeSection() {
  const { sendMessage, isLoading, result, fogInput, error, reset } = useCrackTime();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const today = new Date();
  const formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
  const userName = user?.firstName || "Viber";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendMessage(input, userName);
  };

  const handleReset = () => {
    reset();
    setInput("");
  };

  const downloadAsHtml = () => {
    if (!result?.html) return;
    const blob = new Blob([result.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crack_time_${result.userName}_${result.date.replace(/\./g, '')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printToPdf = () => {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.print();
  };

  const handleShare = async () => {
    if (!result?.html) return;
    
    setIsSharing(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "cracktime",
          title: `CRACK TIME - ${result.userName} (${result.date})`,
          content: result.html,
          authorName: result.userName,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create share link");
      
      const data = await response.json();
      const fullUrl = `${window.location.origin}${data.url}`;
      setShareUrl(fullUrl);
      setShowShareDialog(true);
    } catch (error) {
      toast({
        title: "공유 링크 생성 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "링크가 복사되었습니다" });
    } catch (error) {
      toast({ title: "복사 실패", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="bg-amber-400 dark:bg-amber-600 px-6 py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-xl tracking-wide">CRACK TIME</span>
            </div>
            <span className="text-white/90 text-sm font-medium">{formattedDate}</span>
          </div>
          <div className="p-12 flex flex-col items-center justify-center space-y-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-16 h-16 text-amber-500" />
            </motion.div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">분석 중입니다</h3>
              <p className="text-muted-foreground">잠시만 기다려주세요...</p>
            </div>
            <div className="w-48 h-2 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-amber-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-amber-400 dark:bg-amber-600 px-6 py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-white" />
              <span className="text-white font-bold text-xl tracking-wide">CRACK TIME</span>
            </div>
            <span className="text-white/90 text-sm font-medium">{formattedDate}</span>
          </div>
          <div className="p-6 space-y-6">
            <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
              <div className="p-5">
                <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
                {error.includes("API 키") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    asChild
                    data-testid="button-go-settings"
                  >
                    <Link href="/settings">
                      <Settings className="w-4 h-4 mr-2" /> 설정으로 이동
                    </Link>
                  </Button>
                )}
              </div>
            </Card>
            <Button 
              onClick={handleReset}
              variant="outline"
              className="w-full"
              data-testid="button-retry-crack"
            >
              다시 시도하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (result?.html) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }}
        className="max-w-3xl mx-auto space-y-4"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-foreground">크랙 타임 결과</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              onClick={handleShare}
              variant="outline"
              size="sm"
              disabled={isSharing}
              data-testid="button-share-crack"
            >
              <Share2 className="w-4 h-4 mr-2" /> {isSharing ? "생성 중..." : "공유하기"}
            </Button>
            <Button 
              onClick={downloadAsHtml}
              variant="outline"
              size="sm"
              data-testid="button-download-html"
            >
              <Download className="w-4 h-4 mr-2" /> HTML 저장
            </Button>
            <Button 
              onClick={printToPdf}
              variant="outline"
              size="sm"
              data-testid="button-print-pdf"
            >
              <FileText className="w-4 h-4 mr-2" /> PDF 출력
            </Button>
            <Button 
              onClick={handleReset}
              variant="outline"
              size="sm"
              data-testid="button-new-crack"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> 새로 만들기
            </Button>
          </div>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
          <iframe
            ref={iframeRef}
            srcDoc={result.html}
            className="w-full h-[700px] bg-white"
            title="Crack Time Result"
            data-testid="iframe-crack-result"
          />
        </div>

        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-500" />
                공유 링크
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                이 링크를 복사해서 누구에게나 공유할 수 있습니다.
              </p>
              <div className="flex items-center gap-2">
                <Input 
                  value={shareUrl} 
                  readOnly 
                  className="flex-1 text-sm"
                  data-testid="input-share-url"
                />
                <Button 
                  onClick={copyToClipboard}
                  size="icon"
                  variant="outline"
                  data-testid="button-copy-url"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowShareDialog(false)}
              >
                닫기
              </Button>
              <Button 
                onClick={() => window.open(shareUrl, "_blank")}
                data-testid="button-open-share"
              >
                <ExternalLink className="w-4 h-4 mr-2" /> 페이지 열기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-amber-400 dark:bg-amber-600 px-6 py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-white" />
            <span className="text-white font-bold text-xl tracking-wide">CRACK TIME</span>
          </div>
          <span className="text-white/90 text-sm font-medium">{formattedDate}</span>
        </div>

        <div className="p-6 space-y-6">
          <div className="border-l-4 border-amber-500 pl-4">
            <h2 className="text-2xl font-bold text-foreground">{userName} 대표님</h2>
            <p className="text-amber-600 dark:text-amber-400 text-sm mt-1">
              크랙 타임이 당신의 관점을 밝게 바꿔드립니다!
            </p>
          </div>

          <Card className="bg-white/80 dark:bg-black/30 border-0 shadow-sm">
            <div className="p-5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold mb-3 text-sm">
                <Sparkles className="w-4 h-4" />
                현재의 안개 (고민 상황)
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="지금 당신을 가로막고 있는 고민이나 안개가 무엇인가요? 명확하게 적을수록 빛은 더 선명해집니다."
                  className="min-h-[120px] resize-none border-amber-200 dark:border-amber-800 focus:ring-amber-500 bg-white/50 dark:bg-black/20"
                  data-testid="input-fog"
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  data-testid="button-crack-submit"
                >
                  <span className="flex items-center gap-2">
                    <Sun className="w-4 h-4" /> 크랙 포인트 발견하기
                  </span>
                </Button>
              </form>
            </div>
          </Card>

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground tracking-widest">
              MORNING SUNLIGHT · BREAKING LIMITS · CRACK TIME
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchManager({ selectedBatchId }: { selectedBatchId: number }) {
  const { data: folders } = useFolders();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const { toast } = useToast();
  const { user } = useAuth();
  const createJournal = useCreateJournal();
  const updateJournal = useUpdateJournal();
  
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(selectedBatchId);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [selectedMemberName, setSelectedMemberName] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [journalTitle, setJournalTitle] = useState("");
  const [journalContent, setJournalContent] = useState("");
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [showJournalShareDialog, setShowJournalShareDialog] = useState(false);
  const [journalShareUrl, setJournalShareUrl] = useState("");
  const [isJournalSharing, setIsJournalSharing] = useState(false);
  const [journalCopied, setJournalCopied] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  
  const { data: members, isLoading: membersLoading } = useBatchMembers(selectedFolderId);
  const deleteMember = useDeleteBatchMember();
  const updateMember = useUpdateBatchMember();
  const { data: memberJournals, isLoading: journalsLoading } = useMemberJournals(selectedMemberId);
  
  const selectedFolder = folders?.find(f => f.id === selectedFolderId);
  
  // Find current user's member record in this batch
  const myMemberRecord = members?.find(m => m.userId === user?.id);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({ title: "기수 이름을 입력하세요", variant: "destructive" });
      return;
    }
    createFolder.mutate({ name: newFolderName, type: "batch" }, {
      onSuccess: () => {
        toast({ title: "기수 생성 완료" });
        setNewFolderName("");
      },
      onError: () => toast({ title: "생성 실패", variant: "destructive" })
    });
  };

  const handleUpdateMyName = () => {
    if (!newMemberName.trim() || !myMemberRecord || !selectedFolderId) {
      toast({ title: "이름을 입력하세요", variant: "destructive" });
      return;
    }
    updateMember.mutate({ 
      id: myMemberRecord.id, 
      folderId: selectedFolderId,
      data: { name: newMemberName }
    }, {
      onSuccess: () => {
        toast({ title: "이름이 변경되었습니다" });
        setNewMemberName("");
        setShowMemberDialog(false);
      },
      onError: () => toast({ title: "변경 실패", variant: "destructive" })
    });
  };

  const handleCreateJournal = () => {
    if (!journalTitle.trim() || !journalContent.trim() || !selectedMemberId || !user) {
      toast({ title: "제목과 내용을 입력하세요", variant: "destructive" });
      return;
    }
    createJournal.mutate({
      title: journalTitle,
      content: journalContent,
      category: "morning",
      userId: user.id,
      memberId: selectedMemberId,
    }, {
      onSuccess: () => {
        toast({ title: "저널 작성 완료" });
        setJournalTitle("");
        setJournalContent("");
        setShowJournalForm(false);
      },
      onError: () => toast({ title: "저널 작성 실패", variant: "destructive" })
    });
  };

  const handleSelectMember = (memberId: number, memberName: string) => {
    setSelectedMemberId(memberId);
    setSelectedMemberName(memberName);
  };

  const startEditJournal = (journal: { id: number; title: string; content: string }) => {
    setEditingJournalId(journal.id);
    setEditTitle(journal.title);
    setEditContent(journal.content);
  };

  const cancelEditJournal = () => {
    setEditingJournalId(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleUpdateJournal = () => {
    if (!editTitle.trim() || !editContent.trim() || !editingJournalId) {
      toast({ title: "제목과 내용을 입력하세요", variant: "destructive" });
      return;
    }
    updateJournal.mutate({
      id: editingJournalId,
      title: editTitle,
      content: editContent,
      memberId: selectedMemberId || undefined,
    }, {
      onSuccess: () => {
        toast({ title: "저널 수정 완료" });
        cancelEditJournal();
      },
      onError: () => toast({ title: "저널 수정 실패", variant: "destructive" })
    });
  };

  const handleBack = () => {
    if (selectedMemberId) {
      setSelectedMemberId(null);
      setSelectedMemberName("");
      setShowJournalForm(false);
    } else if (selectedFolderId) {
      setSelectedFolderId(null);
    }
  };

  const handleShareJournal = async (journal: { id: number; title: string; content: string; category: string; createdAt: Date }) => {
    setIsJournalSharing(true);
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "journal",
          title: `${selectedMemberName} 저널 - ${journal.title}`,
          content: JSON.stringify({
            title: journal.title,
            content: journal.content,
            category: journal.category,
            memberName: selectedMemberName,
            date: new Date(journal.createdAt).toLocaleDateString('ko-KR'),
          }),
          authorName: selectedMemberName,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create share link");
      
      const data = await response.json();
      const fullUrl = `${window.location.origin}${data.url}`;
      setJournalShareUrl(fullUrl);
      setShowJournalShareDialog(true);
    } catch (error) {
      toast({
        title: "공유 링크 생성 실패",
        description: "다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsJournalSharing(false);
    }
  };

  const copyJournalUrl = async () => {
    try {
      await navigator.clipboard.writeText(journalShareUrl);
      setJournalCopied(true);
      setTimeout(() => setJournalCopied(false), 2000);
      toast({ title: "링크가 복사되었습니다" });
    } catch (error) {
      toast({ title: "복사 실패", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {(selectedFolderId || selectedMemberId) && (
            <Button variant="ghost" size="icon" onClick={handleBack} data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <Users className="text-blue-500" />
              {selectedMemberId ? `${selectedMemberName} 저널` : selectedFolder ? selectedFolder.name : "기수 관리"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {selectedMemberId 
                ? "이 멤버의 아침 저널링을 확인하고 작성합니다." 
                : selectedFolder 
                  ? "멤버를 클릭하여 저널을 작성하세요." 
                  : "기수를 선택하면 멤버 목록이 표시됩니다."
              }
            </p>
          </div>
        </div>
        
        {!selectedFolderId && !selectedMemberId && (
          <Button 
            onClick={() => setShowFolderDialog(true)}
            className="rounded-xl bg-blue-500"
            data-testid="button-open-folder-dialog"
          >
            <Plus className="w-4 h-4 mr-1" />
            기수 추가
          </Button>
        )}

        <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>새 기수 추가</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="기수 이름을 입력하세요 (예: AG 44기)" 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="rounded-xl"
                data-testid="input-new-folder"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowFolderDialog(false)}>
                취소
              </Button>
              <Button 
                onClick={() => {
                  handleCreateFolder();
                  setShowFolderDialog(false);
                }}
                disabled={createFolder.isPending || !newFolderName.trim()}
                className="bg-blue-500"
                data-testid="button-create-folder"
              >
                추가하기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedFolderId && !selectedMemberId && myMemberRecord && (
          <Button 
            onClick={() => {
              setNewMemberName(myMemberRecord.name);
              setShowMemberDialog(true);
            }}
            variant="outline"
            className="rounded-xl"
            data-testid="button-open-member-dialog"
          >
            <Pencil className="w-4 h-4 mr-1" />
            이름 변경하기
          </Button>
        )}

        <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>내 이름 변경</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Input 
                placeholder="변경할 이름을 입력하세요" 
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="rounded-xl"
                data-testid="input-rename-member"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowMemberDialog(false)}>
                취소
              </Button>
              <Button 
                onClick={handleUpdateMyName}
                disabled={updateMember.isPending || !newMemberName.trim()}
                className="bg-green-500"
                data-testid="button-update-name"
              >
                {updateMember.isPending ? "변경 중..." : "변경하기"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {selectedMemberId && !showJournalForm && (
          <Button 
            onClick={() => setShowJournalForm(true)}
            className="rounded-xl bg-amber-500"
            data-testid="button-write-journal"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            저널 작성
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedFolderId && (
          <motion.div
            key="folders"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {folders?.map(folder => (
              <Card 
                key={folder.id} 
                className="glass-card rounded-2xl p-5 cursor-pointer group hover:shadow-lg transition-all"
                onClick={() => setSelectedFolderId(folder.id)}
                data-testid={`card-folder-${folder.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FolderOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{folder.name}</p>
                      <p className="text-xs text-muted-foreground">클릭하여 멤버 보기</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${folder.name}"를 삭제하시겠습니까?`)) {
                        deleteFolder.mutate(folder.id, { onSuccess: () => toast({ title: "삭제됨" }) });
                      }
                    }}
                    data-testid={`button-delete-folder-${folder.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {folders?.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">아직 기수가 없습니다.</p>
                <p className="text-sm">위에서 기수를 추가해보세요.</p>
              </div>
            )}
          </motion.div>
        )}

        {selectedFolderId && !selectedMemberId && (
          <motion.div
            key="members"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {membersLoading && <p className="col-span-full text-center text-muted-foreground animate-pulse">로딩 중...</p>}
            {members?.map(member => (
              <Card 
                key={member.id} 
                className="glass-card rounded-2xl p-5 cursor-pointer group hover:shadow-lg transition-all"
                onClick={() => handleSelectMember(member.id, member.name)}
                data-testid={`card-member-${member.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        {member.name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{member.name}</p>
                      <p className="text-xs text-muted-foreground">클릭하여 저널 보기</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`"${member.name}"를 삭제하시겠습니까?`) && selectedFolderId) {
                        deleteMember.mutate({ id: member.id, folderId: selectedFolderId }, { onSuccess: () => toast({ title: "삭제됨" }) });
                      }
                    }}
                    data-testid={`button-delete-member-${member.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {members?.length === 0 && !membersLoading && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">아직 멤버가 없습니다.</p>
                <p className="text-sm">위에서 멤버를 추가해보세요.</p>
              </div>
            )}
          </motion.div>
        )}

        {selectedMemberId && (
          <motion.div
            key="journals"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex gap-4 h-[calc(100vh-200px)]"
          >
            <div className="flex-1 flex flex-col">
              {showJournalForm ? (
                <Card className="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between gap-2">
                    <Input 
                      placeholder="제목을 입력하세요..." 
                      value={journalTitle}
                      onChange={(e) => setJournalTitle(e.target.value)}
                      className="text-xl font-bold border-0 bg-transparent focus-visible:ring-0 px-0"
                      data-testid="input-journal-title"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <RichTextEditor
                      value={journalContent}
                      onChange={setJournalContent}
                      placeholder="'/'를 입력하여 블록 유형을 선택하세요..."
                      minHeight="100%"
                      className="h-full border-0 rounded-none"
                    />
                  </div>
                  <div className="p-4 border-t flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowJournalForm(false)}>취소</Button>
                    <Button 
                      onClick={handleCreateJournal} 
                      disabled={createJournal.isPending}
                      className="bg-amber-500"
                      data-testid="button-submit-journal"
                    >
                      저장하기
                    </Button>
                  </div>
                </Card>
              ) : editingJournalId ? (
                <Card className="glass-card rounded-2xl flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between gap-2">
                    <Input 
                      placeholder="제목을 입력하세요..." 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xl font-bold border-0 bg-transparent focus-visible:ring-0 px-0"
                      data-testid="input-edit-title"
                    />
                    <Button variant="ghost" size="icon" onClick={cancelEditJournal}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <RichTextEditor
                      value={editContent}
                      onChange={setEditContent}
                      placeholder="내용을 입력하세요..."
                      minHeight="100%"
                      className="h-full border-0 rounded-none"
                    />
                  </div>
                  <div className="p-4 border-t flex gap-2 justify-end">
                    <Button variant="outline" onClick={cancelEditJournal}>취소</Button>
                    <Button 
                      onClick={handleUpdateJournal} 
                      disabled={updateJournal.isPending}
                      className="bg-amber-500"
                      data-testid="button-save-edit"
                    >
                      저장하기
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BookOpen className="w-20 h-20 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">저널을 선택하거나 새로 작성하세요</p>
                    <Button 
                      onClick={() => setShowJournalForm(true)}
                      className="bg-amber-500 mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      새 저널 작성
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-80 flex-shrink-0">
              <Card className="glass-card rounded-2xl h-full flex flex-col overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-sm">저널 목록</h3>
                  <span className="text-xs text-muted-foreground">{memberJournals?.length || 0}개</span>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 space-y-1">
                    {journalsLoading && (
                      <p className="text-center text-muted-foreground animate-pulse py-4">로딩 중...</p>
                    )}
                    {memberJournals?.map(journal => (
                      <div
                        key={journal.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors hover-elevate ${
                          editingJournalId === journal.id ? "bg-amber-100 dark:bg-amber-900/30" : ""
                        }`}
                        onClick={() => startEditJournal(journal)}
                        data-testid={`journal-item-${journal.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                            #{journal.category}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareJournal(journal);
                              }}
                              disabled={isJournalSharing}
                            >
                              <Share2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-medium text-sm truncate">{journal.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(journal.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    ))}
                    {memberJournals?.length === 0 && !journalsLoading && (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">아직 저널이 없습니다</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={showJournalShareDialog} onOpenChange={setShowJournalShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-amber-500" />
              저널 공유 링크
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              이 링크를 복사해서 누구에게나 공유할 수 있습니다.
            </p>
            <div className="flex items-center gap-2">
              <Input 
                value={journalShareUrl} 
                readOnly 
                className="flex-1 text-sm"
                data-testid="input-journal-share-url"
              />
              <Button 
                onClick={copyJournalUrl}
                size="icon"
                variant="outline"
                data-testid="button-copy-journal-url"
              >
                {journalCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowJournalShareDialog(false)}
            >
              닫기
            </Button>
            <Button 
              onClick={() => window.open(journalShareUrl, "_blank")}
              data-testid="button-open-journal-share"
            >
              <ExternalLink className="w-4 h-4 mr-2" /> 페이지 열기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
